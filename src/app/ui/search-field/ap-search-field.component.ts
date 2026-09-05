import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  ViewEncapsulation,
  computed,
  forwardRef,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { ApFieldControl } from '../field/ap-field-control';
import { attachViewportSync, computePopoverPosition } from '../select/popover-position';

/* ============================================================================
   Acadimiat UI — حقل البحث بالإكمال التلقائي
   ----------------------------------------------------------------------------
   نتائج من أوّل حرف، بلا زرّ «بحث». الزرّ في النمط القائم ليس تفصيلة شكل:
   هو نقرة إضافية في كل بحث، ويجعل الحقل يبدو نموذجًا يُرسَل لا أداة تصفية.

   ─── لماذا مكوّن مستقلّ لا `<input apInput type="search">` ────────────────
   ثلاثة أشياء لا يقدر عليها الحقل النصّي:

     • **زرّ مسح داخل الحدّ.** `apFieldSuffix` القائم نصّ ساكن `aria-hidden`
       (للعملة و«https://»)، ووضع زرّ قابل للتركيز داخله نقيضه الدلالي.
     • **لوحة اقتراحات.** تحتاج `popover` وتموضعًا محسوبًا وربطًا بـ ARIA.
     • **دلالة combobox.** `aria-expanded`/`aria-controls`/`aria-activedescendant`
       على الحقل نفسه — وهي ما يجعل قارئ الشاشة يعلن ظهور النتائج أصلًا.

   ─── نمط ARIA: editable combobox مع listbox ───────────────────────────────
   الحقل `<input role="combobox">` يبقى **هو صاحب التركيز دائمًا**، والتمييز
   داخل اللوحة بـ `aria-activedescendant` لا بتركيز متنقّل. فسهم الأسفل ينقل
   التمييز والكتابة تستمرّ في مكانها، وTab يغادر الحقل كلّه لا الاقتراح.

   ⚠️ ولذلك الاقتراح `<div role="option">` لا `<button>`: زرّ قابل للتركيز
      داخل اللوحة يُدخل عناصر في ترتيب التنقّل لا يجب أن تكون فيه.

   ─── التأخير (debounce) ───────────────────────────────────────────────────
   الكتابة تُطلق طلبًا لكل حرف بلا تأخير. والتأخير هنا **لا يؤخّر الفتح**:
   اللوحة تُفتح فورًا بحالة «جارٍ البحث»، وحدها النتائج تنتظر. فالمستخدم يرى
   أن شيئًا يحدث من أوّل حرف، والشبكة لا تُغرق.

   ⚠️ القالب والأنماط في ملفين خارجيين — أي backtick داخل قالب سطري (ولو في
      تعليق) يُغلق النصّ الحرفي. لُدغ المشروع بذلك مرّتين.
   ============================================================================ */

/** اقتراح واحد. `hint` سطر ثانٍ خافت — البريد تحت الاسم مثلًا. */
export interface ApSearchOption {
  value: unknown;
  label: string;
  hint?: string;
}

/* عدّاد وحدات لا `Math.random`: الخادم والمتصفّح يُصيّران بالترتيب نفسه
   فتتطابق المعرّفات ولا ينكسر الترطيب — القاعدة نفسها في `<ap-field>`. */
let searchCounter = 0;

@Component({
  selector: 'ap-search-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './ap-search-field.component.html',
  styleUrl: './ap-search-field.component.scss',
  providers: [
    { provide: ApFieldControl, useExisting: forwardRef(() => ApSearchFieldComponent) },
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ApSearchFieldComponent),
      multi: true,
    },
  ],
})
export class ApSearchFieldComponent
  extends ApFieldControl
  implements ControlValueAccessor, OnDestroy
{
  @ViewChild('input') private inputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('box') private boxRef?: ElementRef<HTMLElement>;

  private readonly uid = ++searchCounter;
  protected readonly listboxId = `ap-search-${this.uid}-listbox`;

  /*
    سمات الربط في signals يكتبها القالب — لا يكتبها `wire()` على عنصر.
    `<ap-field>` يستدعي `wire()` من `ngAfterContentInit`، أي قبل تهيئة عرض
    هذا المكوّن، فـ `ViewChild` هناك `undefined` والكتابة تفشل صامتةً.
  */
  private readonly controlId$ = signal('');
  private readonly describedBy$ = signal<string | null>(null);
  private readonly required$ = signal(false);
  private readonly invalid$ = signal(false);

  private readonly query$ = signal('');
  private readonly options$ = signal<readonly ApSearchOption[]>([]);
  private readonly loading$ = signal(false);
  private readonly disabled$ = signal(false);
  private readonly placeholder$ = signal('ابحث…');
  private readonly emptyText$ = signal('لا توجد نتائج');
  private readonly loadingText$ = signal('جارٍ البحث…');
  private readonly debounce$ = signal(200);

  private readonly open$ = signal(false);
  private readonly activeIndex$ = signal(-1);

  private readonly panelTop$ = signal(0);
  private readonly panelLeft$ = signal(0);
  private readonly panelWidth$ = signal(0);
  private readonly panelMaxHeight$ = signal(0);
  private readonly placement$ = signal<'below' | 'above'>('below');

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private detachViewportListeners: (() => void) | null = null;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  /** الاقتراحات المعروضة. يملؤها المستهلك ردًّا على `queryChange`. */
  @Input()
  set options(value: readonly ApSearchOption[]) {
    this.options$.set(value ?? []);
    /* قائمة جديدة ⇐ التمييز يعود إلى البداية: الفهرس القديم يشير إلى صفّ
       مختلف تمامًا، فيؤكّد Enter شيئًا لم يره المستخدم. */
    this.activeIndex$.set(-1);
  }

  @Input()
  set loading(value: boolean) {
    this.loading$.set(!!value);
  }

  @Input()
  set placeholder(value: string) {
    this.placeholder$.set(value ?? '');
  }

  @Input()
  set emptyText(value: string) {
    this.emptyText$.set(value || 'لا توجد نتائج');
  }

  @Input()
  set loadingText(value: string) {
    this.loadingText$.set(value || 'جارٍ البحث…');
  }

  /** مهلة التجميع قبل إطلاق `queryChange`. اللوحة تُفتح فورًا بلا انتظارها. */
  @Input()
  set debounce(value: number) {
    this.debounce$.set(Math.max(0, value ?? 200));
  }

  @Input()
  set disabled(value: boolean) {
    this.disabled$.set(!!value);
  }

  /** النصّ المكتوب، بعد التأخير. */
  @Output() readonly queryChange = new EventEmitter<string>();

  /** اختيار اقتراح — بالنقر أو بـ Enter على المميَّز. */
  @Output() readonly optionSelected = new EventEmitter<ApSearchOption>();

  /**
   * يمسح النصّ من الخارج — للمستهلك الذي يعرض «مسح البحث» في مكان آخر،
   * كزرّ الحالة الفارغة تحت جدولٍ لم يطابق البحثُ فيه شيئًا.
   *
   * ويفعل ما يفعله زرّ المسح داخل الحقل بالضبط: يفرغ النصّ، ويُطلق
   * `queryChange` بقيمة فارغة كي يستعيد المستهلك صفوفه، ويغلق اللوحة،
   * **ويعيد التركيز إلى الحقل**.
   *
   * ⚠️ وإعادة التركيز ليست تحسينًا: الزرّ الذي استدعى هذه الدالّة يختفي
   *    مع الحالة الفارغة التي يعيش فيها، فبدونها يسقط التركيز إلى
   *    `<body>` ويضيع مكان مستخدم لوحة المفاتيح في الصفحة كلّها.
   *
   * ⚠️ وهي المدخل المعتمد لذلك، لا `writeValue`: تلك واجهة
   *    `ControlValueAccessor` تكتب القيمة ولا تُطلق حدثًا ولا تغلق
   *    اللوحة — فيُفرَّغ الحقل ويبقى الجدول مُرشَّحًا بنصّ لم يعد ظاهرًا.
   */
  clear(): void {
    this.onClear();
  }

  protected readonly controlId = this.controlId$.asReadonly();
  protected readonly describedBy = this.describedBy$.asReadonly();
  protected readonly requiredValue = this.required$.asReadonly();
  protected readonly invalidValue = this.invalid$.asReadonly();
  protected readonly queryValue = this.query$.asReadonly();
  protected readonly optionsValue = this.options$.asReadonly();
  protected readonly loadingValue = this.loading$.asReadonly();
  protected readonly disabledValue = this.disabled$.asReadonly();
  protected readonly placeholderValue = this.placeholder$.asReadonly();
  protected readonly emptyTextValue = this.emptyText$.asReadonly();
  protected readonly loadingTextValue = this.loadingText$.asReadonly();
  protected readonly isOpen = this.open$.asReadonly();
  protected readonly activeIndex = this.activeIndex$.asReadonly();
  protected readonly panelTop = this.panelTop$.asReadonly();
  protected readonly panelLeft = this.panelLeft$.asReadonly();
  protected readonly panelWidth = this.panelWidth$.asReadonly();
  protected readonly panelMaxHeight = this.panelMaxHeight$.asReadonly();
  protected readonly placement = this.placement$.asReadonly();

  protected readonly hasQuery = computed(() => this.query$().length > 0);

  protected readonly activeOptionId = computed(() => {
    const i = this.activeIndex$();
    return i >= 0 ? this.optionId(i) : null;
  });

  /**
   * ما يُعلَن لقارئ الشاشة عند تغيّر النتائج.
   *
   * ⚠️ منطقة حيّة مستقلّة، لا الاعتماد على إعلان `aria-expanded` وحده:
   *    الأخير يقول «مفتوح» ولا يقول **كم** نتيجة — وهي المعلومة التي يبني
   *    عليها المستخدم قراره بمواصلة الكتابة أو التصفّح.
   */
  protected readonly announcement = computed(() => {
    if (!this.open$()) {
      return '';
    }
    if (this.loading$()) {
      return this.loadingText$();
    }
    const count = this.options$().length;
    if (count === 0) {
      return this.emptyText$();
    }
    return count === 1 ? 'نتيجة واحدة' : `${count} نتائج`;
  });

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

  writeValue(value: string): void {
    this.query$.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled$.set(isDisabled);
  }

  ngOnDestroy(): void {
    this.clearTimer();
    this.detachViewportListeners?.();
    this.detachViewportListeners = null;
  }

  /* ── الكتابة ────────────────────────────────────────────────────────── */

  protected onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.query$.set(value);
    this.onChange(value);

    /*
      الفتح فوري والنتائج مؤجَّلة. لو انتظر الفتحُ التأخيرَ لبدا الحقل صامتًا
      بعد أوّل حرف — وهو ما يدفع المستخدم إلى النقر بحثًا عن زرّ لا وجود له.
    */
    if (value) {
      this.openPanel();
    } else {
      this.closePanel();
    }

    this.clearTimer();
    this.debounceTimer = setTimeout(() => this.queryChange.emit(value), this.debounce$());
  }

  protected onClear(): void {
    this.query$.set('');
    this.onChange('');
    this.clearTimer();
    this.queryChange.emit('');
    this.closePanel();
    /* التركيز يعود إلى الحقل: الزرّ يختفي بمجرّد المسح، فبدون ذلك يسقط
       التركيز إلى `<body>` ويضيع مكان مستخدم لوحة المفاتيح. */
    this.inputRef?.nativeElement.focus();
  }

  protected onFocus(): void {
    if (this.query$() && this.options$().length) {
      this.openPanel();
    }
  }

  protected onBlur(): void {
    this.onTouched();
    this.closePanel();
  }

  /* ── لوحة المفاتيح ──────────────────────────────────────────────────── */

  protected onKeydown(event: KeyboardEvent): void {
    const count = this.optionsValue().length;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.open$() && this.query$()) {
          this.openPanel();
          return;
        }
        if (count) {
          this.activeIndex$.set((this.activeIndex$() + 1) % count);
        }
        return;

      case 'ArrowUp':
        event.preventDefault();
        if (count) {
          this.activeIndex$.set((this.activeIndex$() - 1 + count) % count);
        }
        return;

      case 'Home':
        if (this.open$() && count) {
          event.preventDefault();
          this.activeIndex$.set(0);
        }
        return;

      case 'End':
        if (this.open$() && count) {
          event.preventDefault();
          this.activeIndex$.set(count - 1);
        }
        return;

      case 'Enter': {
        const active = this.activeIndex$();
        if (this.open$() && active >= 0) {
          /* يُمنع الإرسال: الحقل قد يكون داخل نموذج، واختيار اقتراح ليس
             إرسالًا له. */
          event.preventDefault();
          this.select(this.optionsValue()[active]);
        }
        return;
      }

      case 'Escape':
        /*
          إغلاق أوّلًا ومسح ثانيًا. الضغطة الواحدة التي تفعل الاثنين تمحو
          بحثًا مكتوبًا لمن أراد إخفاء اللوحة فحسب.
        */
        if (this.open$()) {
          event.preventDefault();
          this.closePanel();
        } else if (this.query$()) {
          event.preventDefault();
          this.onClear();
        }
        return;

      default:
        return;
    }
  }

  /* ── الاقتراحات ─────────────────────────────────────────────────────── */

  protected optionId(index: number): string {
    return `${this.listboxId}-option-${index}`;
  }

  protected onOptionPointerEnter(index: number): void {
    this.activeIndex$.set(index);
  }

  /*
    `pointerdown` لا `click`: النقر على اقتراح يُخرج التركيز من الحقل أوّلًا،
    فيُغلق `blur` اللوحة قبل أن يصل `click` إلى الاقتراح — والنتيجة نقرة لا
    تفعل شيئًا. و`preventDefault` هنا يمنع نقل التركيز أصلًا.
  */
  protected onOptionPointerDown(event: Event, option: ApSearchOption): void {
    event.preventDefault();
    this.select(option);
  }

  private select(option: ApSearchOption): void {
    if (!option) {
      return;
    }
    this.query$.set(option.label);
    this.onChange(option.label);
    this.optionSelected.emit(option);
    this.closePanel();
    this.inputRef?.nativeElement.focus();
  }

  /* ── اللوحة ─────────────────────────────────────────────────────────── */

  private openPanel(): void {
    if (this.open$() || this.disabled$()) {
      return;
    }
    this.open$.set(true);
    this.activeIndex$.set(-1);
    this.syncPosition();
    this.detachViewportListeners = attachViewportSync(() => this.syncPosition());
  }

  private closePanel(): void {
    if (!this.open$()) {
      return;
    }
    this.open$.set(false);
    this.activeIndex$.set(-1);
    this.detachViewportListeners?.();
    this.detachViewportListeners = null;
  }

  private syncPosition(): void {
    const box = this.boxRef?.nativeElement;
    if (!box) {
      return;
    }
    const position = computePopoverPosition(box);
    this.placement$.set(position.placement);
    this.panelTop$.set(position.top);
    this.panelLeft$.set(position.left);
    this.panelWidth$.set(position.width);
    this.panelMaxHeight$.set(position.maxHeight);
  }

  private clearTimer(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }
}
