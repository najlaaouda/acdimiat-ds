import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  ViewEncapsulation,
  computed,
  forwardRef,
  inject,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { ApFieldControl } from '../field/ap-field-control';
import { attachViewportSync, computePopoverPosition } from './popover-position';

/* ============================================================================
   Acadimiat UI — القائمة المنسدلة المرسومة
   ----------------------------------------------------------------------------
   ─── لماذا يوجد هذا المكوّن أصلًا ─────────────────────────────────────────
   `<select>` الأصلي يرسم لائحته في نظام التشغيل: لا حشوة، ولا استدارة، ولا
   ظلّ، ولا مسافة عن زنّاده — ولا سطر CSS يصلها. فأي مواصفة تخصّ شكل اللائحة
   تستلزم عنصرًا غير أصلي. هذا هو الثمن كاملًا، ويُدفع عن قصد.

   ⚠️ ولذلك لا يُلغي `<select apSelect>` ولا يحلّ محلّه: من يفضّل منتقي نظام
      التشغيل — وهو أفضل على الجوّال بلا منازع — يبقى عليه. القاعدة:
        شكل اللائحة يهمّ            ⇐ `<ap-select>`
        منتقي النظام يهمّ           ⇐ `<select apSelect>`
        بحث أو تعدّد برقاقات        ⇐ `<app-native-select>`

   ─── لماذا عنصر مخصّص رغم قاعدة «موجّه على عنصر أصلي» ─────────────────────
   القاعدة وُضعت لأن التغليف يُفقد العنصر الأصلي دلالاته (`type="submit"`،
   `disabled`). وهنا لا عنصر أصلي نحسّنه — استبداله هو المهمّة نفسها.
   والدلالات محفوظة داخليًا: الزنّاد `<button type="button">` حقيقي.

   ─── نمط ARIA: select-only combobox ───────────────────────────────────────
   زرّ بـ `role="combobox"` + `aria-haspopup="listbox"`، ولوحة `role="listbox"`،
   والتمييز بـ `aria-activedescendant`.

   `aria-activedescendant` لا تركيزًا متنقّلًا (roving focus): التركيز الفيزيائي
   لا يغادر الزرّ إطلاقًا. فالإغلاق عند مغادرة التركيز قاعدة واحدة بلا سباقات
   مؤقّتات، وTab يعمل بلا «تحرير» تركيز من داخل اللائحة، ولا حاجة إلى
   `tabindex` متحرّك على عناصر تُبنى وتُهدم مع كل فتح.

   ⚠️ القالب والأنماط في ملفين خارجيين لا سطريَّين — أي backtick داخل قالب
      سطري (ولو في تعليق) يُغلق النصّ الحرفي. لُدغ المشروع بذلك مرّتين.
   ============================================================================ */

export interface ApSelectOption {
  value: unknown;
  label: string;
  disabled?: boolean;
}

/** مهلة تجميع أحرف القفز بالكتابة. أطول منها = بحث جديد. */
const TYPEAHEAD_RESET_MS = 500;

@Component({
  selector: 'ap-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './ap-select.component.html',
  styleUrl: './ap-select.component.scss',
  providers: [
    { provide: ApFieldControl, useExisting: forwardRef(() => ApSelectComponent) },
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ApSelectComponent), multi: true },
  ],
  host: {
    '[attr.data-fit-content]': 'fitContentValue() ? "true" : null',
  },
})
export class ApSelectComponent extends ApFieldControl implements ControlValueAccessor {
  /** يخبر `<ap-field>` أن يرسم السهم في طرف الصفّ — كالقائمة الأصلية تمامًا. */
  override readonly indicator = 'chevron' as const;

  @ViewChild('trigger') private triggerRef?: ElementRef<HTMLButtonElement>;
  @ViewChild('panel') private panelRef?: ElementRef<HTMLElement>;

  /* الكشف اليدوي في `open()` شرطُ عمل لا تحسين — انظر تعليقه هناك. */
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly options$ = signal<readonly ApSelectOption[]>([]);
  private readonly placeholder$ = signal('اختر…');
  private readonly emptyText$ = signal('لا توجد خيارات');
  private readonly triggerPrefix$ = signal('');
  private readonly size$ = signal<'sm' | 'md' | 'lg'>('md');
  private readonly disabled$ = signal(false);
  private readonly fitContent$ = signal(false);
  private readonly reserveWidth$ = signal(true);
  private readonly value$ = signal<unknown>(null);

  private readonly open$ = signal(false);
  private readonly activeIndex$ = signal(-1);
  private readonly placement$ = signal<'below' | 'above'>('below');

  /*
    سمات الربط تعيش في signals ويكتبها القالب — لا يكتبها `wire()` على عنصر.

    السبب توقيتي وحاسم: `<ap-field>` يستدعي `wire()` من `ngAfterContentInit`،
    أي قبل تهيئة عرض هذا المكوّن. فـ `ViewChild` للزرّ ما زال `undefined`
    هناك، والكتابة عليه تفشل صامتةً وتترك label بلا ارتباط — وهو العطل نفسه
    الذي وُجد هذا المكوّن ليمنعه.
  */
  private readonly controlId$ = signal('');
  private readonly describedBy$ = signal<string | null>(null);
  private readonly required$ = signal(false);
  private readonly invalid$ = signal(false);

  /* إحداثيات محسوبة لحظيًا — موضع الزنّاد على الشاشة، لا قيم تصميم. */
  private readonly panelTop$ = signal(0);
  private readonly panelLeft$ = signal(0);
  private readonly panelWidth$ = signal(0);
  private readonly panelMaxHeight$ = signal(0);

  private typeaheadBuffer = '';
  private typeaheadAt = 0;
  /** يمنع سباق إغلاق `popover` مع نقرة الزنّاد — انظر `onTriggerClick`. */
  private wasOpenOnPointerDown = false;
  private detachViewportListeners: (() => void) | null = null;

  private onChange: (value: unknown) => void = () => {};
  private onTouched: () => void = () => {};

  @Input({ required: true })
  set options(value: readonly ApSelectOption[]) {
    this.options$.set(value ?? []);
  }

  /** يُعرض حين لا قيمة، بلون النصّ البديل — فيُقرأ «لم يُختر بعد». */
  @Input()
  set placeholder(value: string) {
    this.placeholder$.set(value ?? '');
  }

  @Input()
  set emptyText(value: string) {
    this.emptyText$.set(value ?? '');
  }

  /**
   * صدرٌ ثابت يسبق القيمة في الزنّاد: `حالة الحساب: الكل`.
   *
   * للفلاتر تحديدًا — قائمة فوق جدول مكتوب عليها «الكل» لا تقول أيّ شيءٍ
   * «كل»، والتسمية فوقها تأخذ سطرًا كاملًا في شريط أدوات.
   *
   * ⚠️ ولا يغني عن التسمية: `<ap-field label>` تبقى (مخفيّة بصريًّا) لأنّها
   *    ما يولّد الـ id ويربط الـ for — وهذا نصّ معروض لا اسم مُعلَن.
   */
  @Input()
  set triggerPrefix(value: string) {
    this.triggerPrefix$.set(value ?? '');
  }

  @Input()
  set size(value: 'sm' | 'md' | 'lg') {
    this.size$.set(value ?? 'md');
  }

  @Input()
  set disabled(value: boolean) {
    this.disabled$.set(!!value);
  }

  /**
   * يجعل عرض القائمة **بمقدار محتواها** لا بمقدار حاويها.
   *
   * القائمة تملأ عرض حاويها افتراضيًا، وهو الصواب في نموذج: الحقول تصطفّ على
   * عرض واحد فتُقرأ عمودًا. أمّا فوق جدول — فلتر أو قائمة حجم صفحة — فلا عمود
   * تنتمي إليه، فيتحوّل الفائض إلى فراغ داخل الزنّاد بين نصّه وسهمه يُقرأ
   * حشوةً بلا سبب.
   *
   * ⚠️ والعرض **يحجز أوسع خيار** ولا يتبع الخيار المختار.
   *
   *    وهذا هو الفرق بين مقاسٍ بالمحتوى صالح وآخر معطوب: عرضٌ يتبع القيمة
   *    ينكمش ويتمدّد مع كل اختيار — يُختار «غير فعال» فيتّسع الزنّاد، ثم
   *    «الكل» فيضيق — فيزحف ما بجواره في شريط الأدوات مع كل تصفية. وهو عطل
   *    الحركة نفسه الذي يمنعه صفّ الأرقام في الترقيم بخلاياه السبع الثابتة.
   *
   *    والحجز يقع في CSS لا في TS: القالب يرسم كل تسمية في خليّة شبكة واحدة
   *    مطويّة (ارتفاع صفر وإخفاء بصري)، فيقيسها المتصفّح بالخطّ الحقيقي وبتشكيل
   *    الحروف العربية على حقيقته. وأيّ تقدير بعدد الأحرف خاطئ في العربية
   *    أصلًا — حروفها تختلف عرضًا وتتّصل.
   */
  @Input()
  set fitContent(value: boolean) {
    this.fitContent$.set(!!value);
  }

  /**
   * هل يحجز الزنّاد عرض أوسع خيار؟ (`true` افتراضًا، مع `fitContent` وحده)
   *
   * الحجز يمنع الزحف: عرضٌ يتبع القيمة يتغيّر مع كل اختيار فيدفع ما بعده في
   * الصفّ. وثمنه فراغٌ دائم داخل الزنّاد بمقدار الفرق بين المختار وأوسع خيار.
   *
   * ⚠️ فاسأل أوّلًا: **ما الذي يقع بعد القائمة في صفّها؟** إن كان بعدها عنصرٌ
   *    يُدفع فالحجز واجب — صفّ الترقيم مثلًا. وإن كانت آخر عنصر في مجموعتها
   *    ويليها فراغٌ حرّ (والطرف المقابل مثبَّت بهامش تلقائي) فلا شيء يتحرّك
   *    حين تتغيّر، والحجز حينها يشتري لا شيء ويدفع الفراغ ثمنًا في كل نظرة.
   *
   * ⚠️ ويبقى ‎true‎ افتراضًا: الحالة الشائعة قائمةٌ وسط صفّ، والافتراض الآمن
   *    هو الذي لا يُحرّك شيئًا.
   */
  @Input()
  set reserveWidth(value: boolean) {
    this.reserveWidth$.set(value !== false);
  }

  /**
   * يخرج عند فتح اللائحة وعند إغلاقها.

   * لِما يُحسب من الخيارات لا لِما يُختار منها: عدّاد بجانب كل حالة مثلًا لا
   * تُعرف أرقامه إلّا بتحميل، وتحميلُه عند فتح الصفحة يقع على من لا يفتح
   * القائمة أصلًا. فالفتح هو أوّل لحظة تُطلب فيها الأرقام فعلًا.
   *
   * ⚠️ ولا يُستعمل للقيمة: تلك تصل عبر `ControlValueAccessor`، ومستمعٌ هنا
   *    يكتبها مرّة ثانية يصنع مصدرَي حقيقة لشيء واحد.
   */
  @Output() readonly openChange = new EventEmitter<boolean>();

  protected readonly optionsValue = this.options$.asReadonly();
  protected readonly placeholderValue = this.placeholder$.asReadonly();
  protected readonly emptyTextValue = this.emptyText$.asReadonly();
  protected readonly triggerPrefixValue = this.triggerPrefix$.asReadonly();
  protected readonly sizeValue = this.size$.asReadonly();
  protected readonly disabledValue = this.disabled$.asReadonly();
  protected readonly fitContentValue = this.fitContent$.asReadonly();
  protected readonly requiredValue = this.required$.asReadonly();
  protected readonly invalidValue = this.invalid$.asReadonly();
  protected readonly describedBy = this.describedBy$.asReadonly();
  protected readonly controlId = this.controlId$.asReadonly();
  protected readonly isOpen = this.open$.asReadonly();
  protected readonly activeIndex = this.activeIndex$.asReadonly();
  protected readonly placement = this.placement$.asReadonly();
  protected readonly panelTop = this.panelTop$.asReadonly();
  protected readonly panelLeft = this.panelLeft$.asReadonly();
  protected readonly panelWidth = this.panelWidth$.asReadonly();
  protected readonly panelMaxHeight = this.panelMaxHeight$.asReadonly();

  protected readonly listboxId = computed(() => `${this.controlId$()}-listbox`);

  protected readonly selectedOption = computed(
    () => this.options$().find(option => option.value === this.value$()) ?? null,
  );

  /**
   * التسميات التي يحجز الزنّاد أوسعها — انظر `fitContent`.
   *
   * والنصّ البديل معها: قائمة بلا قيمة تعرضه، فحجزٌ لا يشمله يترك الزنّاد
   * يقفز عند أوّل اختيار.
   */
  protected readonly sizerLabels = computed(() => {
    if (!this.fitContent$() || !this.reserveWidth$()) {
      return [];
    }
    const labels = this.options$().map(option => option.label);
    const placeholder = this.placeholder$();
    return placeholder ? [...labels, placeholder] : labels;
  });

  protected readonly activeOptionId = computed(() => {
    const index = this.activeIndex$();
    return index >= 0 ? this.optionId(index) : null;
  });

  /* ── عقد `ApFieldControl` ───────────────────────────────────────────── */

  /**
   * يُعاد تعريفه بالكامل: النسخة الموروثة تكتب على العنصر المضيف، وهو هنا
   * `<ap-select>` لا الزرّ — فيصير الـ label مربوطًا بعنصر غير قابل للتركيز.
   */
  override wire(id: string, describedBy: string | null, required: boolean): void {
    this.controlId$.set(id);
    this.describedBy$.set(describedBy);
    this.required$.set(required);
  }

  override setAriaInvalid(invalid: boolean): void {
    this.invalid$.set(invalid);
  }

  setInvalid(value: boolean): void {
    this.invalid$.set(value);
  }

  /* ── ControlValueAccessor ───────────────────────────────────────────── */

  writeValue(value: unknown): void {
    this.value$.set(value);
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled$.set(isDisabled);
  }

  /* ── الفتح والإغلاق ─────────────────────────────────────────────────── */

  protected onTriggerPointerDown(): void {
    /*
      `popover=auto` يُغلق عند `pointerdown` خارج اللوحة — والزنّاد خارجها.
      فبدون هذا الالتقاط تُغلق اللوحة ثم تعيدها نقرة `click` فورًا، فتبدو
      قائمة «لا تُغلق» بالنقر على زنّادها.
    */
    this.wasOpenOnPointerDown = this.open$();
  }

  protected onTriggerClick(): void {
    if (this.wasOpenOnPointerDown) {
      this.wasOpenOnPointerDown = false;
      this.close();
      return;
    }
    this.open();
  }

  protected onTriggerBlur(): void {
    this.onTouched();
  }

  protected onPanelToggle(event: Event): void {
    /* الإغلاق قد يأتي من المتصفّح (Esc، نقرة خارجية) لا من الكود. */
    const state = (event as ToggleEvent).newState;
    if (state === 'closed' && this.open$()) {
      this.close();
    }
  }

  private open(): void {
    if (this.disabled$() || this.open$()) {
      return;
    }

    const selected = this.options$().findIndex(option => option.value === this.value$());
    this.activeIndex$.set(selected >= 0 ? selected : this.firstEnabledIndex());
    this.position();
    this.open$.set(true);

    /*
      ⚠️ كشفٌ يدويّ ثم فتحٌ **متزامن** — ولا `queueMicrotask` هنا.

      اللوحة داخل `@if (isOpen())`، فعنصرها لا يوجد في اللحظة التي تُضبط
      فيها الإشارة: `@ViewChild('panel')` لا يُحدَّث إلّا في دورة كشف. وتأجيل
      النداء بـ `queueMicrotask` **لا يكفي**: المهمّة الدقيقة تُستهلك قبل أن
      تُصرِّف zone.js دورتها، فيبقى `panelRef` غير معرَّف — و`?.` تبتلع
      النداء بلا خطأ ولا أثر.

      والعطل الناتج يبدو سليمًا من كل زاوية إلّا الشاشة: الزنّاد يقول
      `aria-expanded="true"`، واللوحة في DOM بخياراتها وبإحداثيات صحيحة —
      وعليها `display: none` من ورقة الوكيل لأن `showPopover()` لم تُنادَ.
      أي قائمة «تُفتح» بلا خيارات تظهر، بلا رسالة في أي مكان.

      و`<ap-menu>` و`<ap-column-toggle>` لا تُصابان به: لوحتاهما مقيمتان في
      الشجرة بلا `@if` — وهو الفارق الوحيد بينهما وبين هذه.

      `detectChanges()` تُنشئ الكتلة وتُحدِّث الاستعلام في مكانها، فيقع
      `showPopover()` على عنصر موجود — وكلّه قبل الرسم فلا وميض.
    */
    this.cdr.detectChanges();

    const panel = this.panelRef?.nativeElement as HTMLElement & {
      showPopover?: () => void;
    };
    /* المتصفّح القديم بلا `popover` يعرضها في التدفّق العادي — ولذلك
       تحمل الورقة درجة تكديس احتياطية.

       ⚠️ والحارس على `:popover-open`: `showPopover()` **ترمي** على لوحة
          مفتوحة أصلًا — القاعدة نفسها في `<ap-menu>`. */
    if (panel && !panel.matches(':popover-open')) {
      panel.showPopover?.();
    }

    /*
      قياسة ثانية بعد أن صار للوحة أبعاد: الأولى وقعت وهي غير موجودة، فقُدِّر
      ارتفاعها بالسقف. والفرق يظهر في آخر صفّ من جدول — حيث لا يتّسع الأسفل
      فتُقلب إلى الأعلى — إذ تُرفع بالسقف لا بارتفاعها فتقف معلّقة فوق زنّادها.
    */
    this.position();
    queueMicrotask(() => this.scrollActiveIntoView());

    this.attachViewportListeners();
    this.openChange.emit(true);
  }

  private close(commit?: ApSelectOption): void {
    if (!this.open$()) {
      return;
    }

    const panel = this.panelRef?.nativeElement as HTMLElement & {
      hidePopover?: () => void;
    };
    try {
      panel?.hidePopover?.();
    } catch {
      /* يرمي إن كانت مغلقة أصلًا (وصلنا من حدث toggle) — لا يعني شيئًا. */
    }

    this.detachViewportListeners?.();
    this.detachViewportListeners = null;
    this.open$.set(false);
    this.activeIndex$.set(-1);
    this.typeaheadBuffer = '';
    this.openChange.emit(false);

    if (commit && !commit.disabled) {
      this.select(commit);
    }
  }

  private select(option: ApSelectOption): void {
    this.value$.set(option.value);
    this.onChange(option.value);
  }

  /* ── الخيارات بالفأرة ───────────────────────────────────────────────── */

  protected onOptionPointerEnter(index: number): void {
    this.activeIndex$.set(index);
  }

  protected onOptionClick(option: ApSelectOption): void {
    if (option.disabled) {
      return;
    }
    this.close(option);
    this.triggerRef?.nativeElement.focus();
  }

  protected isSelected(option: ApSelectOption): boolean {
    return option.value === this.value$();
  }

  protected optionId(index: number): string {
    return `${this.controlId$()}-opt-${index}`;
  }

  /* ── لوحة المفاتيح ──────────────────────────────────────────────────── */

  protected onTriggerKeydown(event: KeyboardEvent): void {
    const open = this.open$();

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (open) {
          this.close(this.options$()[this.activeIndex$()]);
        } else {
          this.open();
        }
        return;

      case 'ArrowDown':
        event.preventDefault();
        /* الأسهم الرأسية لا تنقلب في RTL: القائمة محور رأسي والاتجاه لا
           يمسّه، ولا يعكسها أي `<select>` أصلي في واجهة عربية. */
        open ? this.moveActive(1) : this.open();
        return;

      case 'ArrowUp':
        event.preventDefault();
        open ? this.moveActive(-1) : this.open();
        return;

      case 'Home':
        if (open) {
          event.preventDefault();
          this.setActive(this.firstEnabledIndex());
        }
        return;

      case 'End':
        if (open) {
          event.preventDefault();
          this.setActive(this.lastEnabledIndex());
        }
        return;

      case 'Escape':
        if (open) {
          event.preventDefault();
          /* إغلاق بلا اعتماد: النشط يُهمَل والقيمة تبقى كما كانت. */
          this.close();
        }
        return;

      case 'Tab':
        /* لا `preventDefault`: الاعتماد ثم مغادرة الحقل — سلوك `<select>`. */
        if (open) {
          this.close(this.options$()[this.activeIndex$()]);
        }
        return;

      default:
        /* حرف مطبوع واحد فقط — يستثني Shift وControl وأخواتها. */
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          this.typeahead(event.key);
        }
    }
  }

  /**
   * القفز بالكتابة.
   *
   * ⚠️ `Date.now()` مقروء هنا وحده وفي المتصفّح فقط: الدالة لا تُستدعى إلا من
   *    حدث لوحة مفاتيح، ولا حدث على الخادم — فلا أثر على SSR.
   */
  private typeahead(char: string): void {
    const now = Date.now();
    this.typeaheadBuffer = now - this.typeaheadAt > TYPEAHEAD_RESET_MS
      ? char
      : this.typeaheadBuffer + char;
    this.typeaheadAt = now;

    const needle = this.typeaheadBuffer.toLowerCase();
    const index = this.options$().findIndex(
      option => !option.disabled && option.label.toLowerCase().startsWith(needle),
    );

    if (index < 0) {
      return;
    }

    if (this.open$()) {
      this.setActive(index);
    } else {
      this.select(this.options$()[index]);
    }
  }

  private moveActive(step: number): void {
    const options = this.options$();
    /* بلا التفاف عند الطرفين — مطابقة ARIA APG وسلوك القائمة الأصلية. */
    for (let i = this.activeIndex$() + step; i >= 0 && i < options.length; i += step) {
      if (!options[i].disabled) {
        this.setActive(i);
        return;
      }
    }
  }

  private setActive(index: number): void {
    if (index < 0) {
      return;
    }
    this.activeIndex$.set(index);
    queueMicrotask(() => this.scrollActiveIntoView());
  }

  private scrollActiveIntoView(): void {
    const id = this.activeOptionId();
    if (!id) {
      return;
    }
    /* البحث داخل اللوحة لا في المستند: المعرّفات فريدة، لكن اللوحة قد تعيش
       داخل جذر ظلّي في مسرح التوثيق حيث لا يجدها `getElementById`. */
    const el = this.panelRef?.nativeElement.querySelector(`#${CSS.escape(id)}`);
    /* `nearest` بلا `smooth`: يحترم تفضيل تقليل الحركة تلقائيًا. */
    el?.scrollIntoView({ block: 'nearest' });
  }

  private firstEnabledIndex(): number {
    return this.options$().findIndex(option => !option.disabled);
  }

  private lastEnabledIndex(): number {
    const options = this.options$();
    for (let i = options.length - 1; i >= 0; i--) {
      if (!options[i].disabled) {
        return i;
      }
    }
    return -1;
  }

  /* ── التموضع ────────────────────────────────────────────────────────── */

  /**
   * الحساب في `popover-position.ts` — مشترك مع `<ap-phone-field>` كي لا
   * تتباعد نسختان من المنطق نفسه.
   */
  private position(): void {
    const trigger = this.triggerRef?.nativeElement;
    if (!trigger) {
      return;
    }

    const pos = computePopoverPosition(trigger, this.panelRef?.nativeElement);
    this.placement$.set(pos.placement);
    this.panelTop$.set(pos.top);
    this.panelLeft$.set(pos.left);
    this.panelWidth$.set(pos.width);
    this.panelMaxHeight$.set(pos.maxHeight);
  }

  private attachViewportListeners(): void {
    this.detachViewportListeners = attachViewportSync(() => this.position());
  }
}
