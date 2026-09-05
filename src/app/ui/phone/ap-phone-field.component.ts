import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  ViewChild,
  ViewEncapsulation,
  computed,
  forwardRef,
  inject,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import type { CountryCode } from 'libphonenumber-js';

import { ApFieldControl } from '../field/ap-field-control';
import { attachViewportSync, computePopoverPosition } from '../select/popover-position';
import { AP_PHONE_FLAG_SOURCE, ApPhoneFlag } from './ap-phone-flag';
import { ApPhoneCountry, getApPhoneCountries, matchesCountry } from './phone-country.data';
import {
  digitsOnly,
  formatNational,
  interpretInput,
  isValidPhone,
  parseE164,
  toE164,
} from './phone-value';

/* ============================================================================
   Acadimiat UI — حقل رقم الجوال
   ----------------------------------------------------------------------------
   عنصران داخل حدّ واحد: زرّ الدولة في بداية الصفّ، ثم الرقم.

   ─── لماذا صندوق واحد لا صندوقان ──────────────────────────────────────────
   لا يرسم هذا المكوّن حدّه: يعلن `affixed = true` فيأخذ معاملة الصفّ الملاصق
   الجاهزة في `ap-field.component.scss` — الحدّ والتعبئة والاستدارة وحالتا
   الخطأ والتعطيل، كلّها موجودة ومجرَّبة. رسم حدّ ثانٍ هنا كان سينتج صندوقًا
   داخل صندوق.

   ─── اتجاه الصفّ ──────────────────────────────────────────────────────────
   `ltrRow()` تعيد `true`: محتوى الحقل لاتيني (‎+966 5xxxxxxxx‎)، فيُقلب الصفّ
   إلى LTR ويهبط زرّ الدولة على اليسار الفيزيائي والرقم يليه — ترتيب القراءة
   الصحيح عالميًا.

   ⚠️ وهذا يعني أن الخصائص المنطقية **داخل الصفّ** تُحلّ مقابل LTR لا مقابل
      الصفحة. من يكتب `inset-inline-start` هنا وهو يتخيّل RTL يضع العنصر في
      الجهة المقلوبة. أمّا الـ label والرسالة فخارج الصفّ، ويبقيان RTL.

   ─── قاعدة القيمة ─────────────────────────────────────────────────────────
   القيمة E.164 نصًّا. والرقم يملك الحقيقة لا المحدِّد: لصق `+9715…` والمحدِّد
   على السعودية ينقل المحدِّد إلى الإمارات — انظر `interpretInput`.

   ⚠️ القالب والأنماط في ملفين خارجيين — قاعدة الـ backtick.
   ============================================================================ */

@Component({
  selector: 'ap-phone-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './ap-phone-field.component.html',
  styleUrl: './ap-phone-field.component.scss',
  providers: [
    { provide: ApFieldControl, useExisting: forwardRef(() => ApPhoneFieldComponent) },
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ApPhoneFieldComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => ApPhoneFieldComponent), multi: true },
  ],
})
export class ApPhoneFieldComponent
  extends ApFieldControl
  implements ControlValueAccessor, Validator
{
  /** يأخذ معاملة الصفّ الملاصق — الحدّ للصفّ لا للعنصرين. */
  override readonly affixed = true;

  /** السهم داخل زرّ الدولة، لا في طرف الصفّ فوق حقل الرقم. */
  override readonly indicator = 'none' as const;

  protected readonly searchLabel = 'ابحث عن دولة';

  private readonly flagSource = inject(AP_PHONE_FLAG_SOURCE);

  @ViewChild('trigger') private triggerRef?: ElementRef<HTMLButtonElement>;
  @ViewChild('panel') private panelRef?: ElementRef<HTMLElement>;
  @ViewChild('search') private searchRef?: ElementRef<HTMLInputElement>;
  @ViewChild('number') private numberRef?: ElementRef<HTMLInputElement>;

  private readonly countries = getApPhoneCountries();

  private readonly countryIso$ = signal<CountryCode>('SA');
  private readonly national$ = signal('');
  private readonly display$ = signal('');
  private readonly disabled$ = signal(false);
  private readonly placeholder$ = signal('5X XXX XXXX');
  private readonly flagBroken$ = signal(new Set<string>());

  private readonly open$ = signal(false);
  private readonly query$ = signal('');
  private readonly placement$ = signal<'below' | 'above'>('below');

  private readonly controlId$ = signal('');
  private readonly labelId$ = signal<string | null>(null);
  private readonly describedBy$ = signal<string | null>(null);
  private readonly required$ = signal(false);
  private readonly invalid$ = signal(false);

  private readonly panelTop$ = signal(0);
  private readonly panelLeft$ = signal(0);
  private readonly panelWidth$ = signal(0);
  private readonly panelMaxHeight$ = signal(0);

  protected readonly activeIndex = signal(0);

  private wasOpenOnPointerDown = false;
  private detachViewport: (() => void) | null = null;
  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};
  private onValidatorChange: () => void = () => {};

  /** الدولة الافتراضية قبل أي إدخال. */
  @Input()
  set defaultCountry(value: CountryCode) {
    if (value && !this.national$()) {
      this.countryIso$.set(value);
    }
  }

  @Input()
  set placeholder(value: string) {
    this.placeholder$.set(value ?? '');
  }

  @Input()
  set disabled(value: boolean) {
    this.disabled$.set(!!value);
  }

  protected readonly disabledValue = this.disabled$.asReadonly();
  protected readonly placeholderValue = this.placeholder$.asReadonly();
  protected readonly requiredValue = this.required$.asReadonly();
  protected readonly invalidValue = this.invalid$.asReadonly();
  protected readonly describedBy = this.describedBy$.asReadonly();
  protected readonly controlId = this.controlId$.asReadonly();
  protected readonly labelId = this.labelId$.asReadonly();
  protected readonly isOpen = this.open$.asReadonly();
  protected readonly query = this.query$.asReadonly();
  protected readonly placement = this.placement$.asReadonly();
  protected readonly displayValue = this.display$.asReadonly();
  protected readonly panelTop = this.panelTop$.asReadonly();
  protected readonly panelLeft = this.panelLeft$.asReadonly();
  protected readonly panelWidth = this.panelWidth$.asReadonly();
  protected readonly panelMaxHeight = this.panelMaxHeight$.asReadonly();

  protected readonly listboxId = computed(() => `${this.controlId$()}-countries`);

  protected readonly selected = computed<ApPhoneCountry>(
    () =>
      this.countries.find(c => c.iso2 === this.countryIso$())
      ?? this.countries[0],
  );

  /** `null` ⇐ شارة الرمز. انظر `ap-phone-flag.ts`. */
  protected readonly flag = computed<ApPhoneFlag | null>(() => {
    const iso2 = this.selected().iso2;
    return this.flagBroken$().has(iso2) ? null : this.flagSource(iso2);
  });

  protected readonly filtered = computed(() =>
    this.countries.filter(c => matchesCountry(c, this.query$())),
  );

  protected readonly activeOptionId = computed(() => {
    const list = this.filtered();
    const at = this.activeIndex();
    return at >= 0 && at < list.length ? this.optionId(at) : null;
  });

  /* ── عقد `ApFieldControl` ───────────────────────────────────────────── */

  override wire(id: string, describedBy: string | null, required: boolean): void {
    this.controlId$.set(id);
    this.describedBy$.set(describedBy);
    this.required$.set(required);
  }

  override setLabelId(id: string): void {
    this.labelId$.set(id);
  }

  override setAriaInvalid(invalid: boolean): void {
    this.invalid$.set(invalid);
  }

  override ltrRow(): boolean {
    return true;
  }

  setInvalid(value: boolean): void {
    this.invalid$.set(value);
  }

  /* ── ControlValueAccessor / Validator ───────────────────────────────── */

  writeValue(value: string | null): void {
    const parts = parseE164(value);
    if (parts) {
      this.countryIso$.set(parts.country);
      this.national$.set(parts.national);
      this.display$.set(formatNational(parts.country, parts.national));
      return;
    }
    this.national$.set('');
    this.display$.set('');
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled$.set(isDisabled);
  }

  /**
   * التحقّق هنا يقول «صالح/غير صالح» فقط — أمّا **نصّ** الرسالة فمسؤولية
   * `<ap-field [error]>`. رسالة مدفونة في المكوّن تعني نصًّا لا يستطيع
   * المؤلّف تغييره بحسب سياق نموذجه.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    const value = control.value as string | null;
    if (!value) {
      return this.required$() ? { required: true } : null;
    }
    return isValidPhone(value) ? null : { invalidPhone: true };
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  /* ── الرقم ──────────────────────────────────────────────────────────── */

  protected onNumberInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;

    /* الرقم الدولي يملك الحقيقة: ينقل المحدِّد إلى دولته. */
    const international = interpretInput(raw);
    if (international) {
      this.countryIso$.set(international.country);
      this.setNational(international.national);
      return;
    }

    this.setNational(digitsOnly(raw));
  }

  /**
   * التنسيق عند المغادرة لا أثناء الكتابة — إعادة كتابة القيمة تحت المؤشّر
   * تحرّكه، وإدارة مواضعه كلفة صيانة دائمة مقابل كسب تجميلي.
   */
  protected onNumberBlur(): void {
    this.onTouched();
    this.display$.set(formatNational(this.countryIso$(), this.national$()));
  }

  private setNational(digits: string): void {
    this.national$.set(digits);
    this.display$.set(digits);
    this.emit();
  }

  private emit(): void {
    this.onChange(toE164(this.countryIso$(), this.national$(), this.selected().dialCode));
    this.onValidatorChange();
  }

  /* ── العلم ──────────────────────────────────────────────────────────── */

  /**
   * ملف ناقص ⇐ شارة الرمز، بلا كسر.
   *
   * وهذا ما يجعل مجموعة **جزئية** خيارًا مشروعًا: من يضع أعلام الخليج وحدها
   * يحصل عليها، وتظهر البقية رموزًا — بدل أن يُجبَر على 250 ملفًا أو لا شيء.
   */
  protected onFlagError(): void {
    const iso2 = this.selected().iso2;
    this.flagBroken$.update(set => new Set(set).add(iso2));
  }

  /* ── لوحة الدول ─────────────────────────────────────────────────────── */

  protected onTriggerPointerDown(): void {
    /* `popover=auto` يغلق عند `pointerdown` خارج اللوحة — والزرّ خارجها.
       بلا الالتقاط تُغلق ثم تعيدها `click` فورًا فتبدو أنها لا تُغلق. */
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

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      this.open();
    }
  }

  protected onSearchInput(event: Event): void {
    this.query$.set((event.target as HTMLInputElement).value);
    this.activeIndex.set(0);
  }

  protected onSearchKeydown(event: KeyboardEvent): void {
    const list = this.filtered();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex.set(Math.min(this.activeIndex() + 1, list.length - 1));
        this.scrollActiveIntoView();
        return;
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex.set(Math.max(this.activeIndex() - 1, 0));
        this.scrollActiveIntoView();
        return;
      case 'Home':
        event.preventDefault();
        this.activeIndex.set(0);
        this.scrollActiveIntoView();
        return;
      case 'End':
        event.preventDefault();
        this.activeIndex.set(list.length - 1);
        this.scrollActiveIntoView();
        return;
      case 'Enter':
        event.preventDefault();
        if (list[this.activeIndex()]) {
          this.choose(list[this.activeIndex()]);
        }
        return;
      case 'Escape':
        event.preventDefault();
        this.close();
        this.triggerRef?.nativeElement.focus();
        return;
      default:
    }
  }

  protected choose(country: ApPhoneCountry): void {
    this.countryIso$.set(country.iso2);
    this.close();
    this.emit();
    /*
      التركيز يعود إلى **حقل الرقم** لا إلى الزنّاد: المستخدم اختار دولة كي
      يكتب رقمًا، فإعادته إلى الزنّاد تكلّفه ضغطة Tab ضائعة.
    */
    this.numberRef?.nativeElement.focus();
  }

  protected optionId(index: number): string {
    return `${this.controlId$()}-country-${index}`;
  }

  protected onPanelToggle(event: Event): void {
    if ((event as ToggleEvent).newState === 'closed' && this.open$()) {
      this.close();
    }
  }

  /* الكشف اليدوي في `open()` شرطُ عمل لا تحسين — انظر تعليقه هناك. */
  private readonly cdr = inject(ChangeDetectorRef);

  private open(): void {
    if (this.disabled$() || this.open$()) {
      return;
    }

    this.query$.set('');
    this.activeIndex.set(
      Math.max(0, this.countries.findIndex(c => c.iso2 === this.countryIso$())),
    );
    this.position();
    this.open$.set(true);

    /*
      ⚠️ كشفٌ يدويّ ثم فتحٌ **متزامن** — العطل نفسه المشروح في `<ap-select>`.

      اللوحة داخل `@if (isOpen())` فلا وجود لعنصرها بعد ضبط الإشارة، و`@ViewChild`
      لا يُحدَّث إلّا في دورة كشف. وتأجيل النداء بـ `queueMicrotask` لا يكفي:
      المهمّة الدقيقة تُستهلك قبل أن تُصرِّف zone.js دورتها، فيبقى `panelRef`
      غير معرَّف و`?.` تبتلع النداء بلا خطأ — فتبقى اللوحة `display: none`
      وزنّادها يقول `aria-expanded="true"`.

      ونقل التركيز يبقى بعد `showPopover()`: التركيز على عنصر داخل popover
      غير معروض يفشل صامتًا.
    */
    this.cdr.detectChanges();

    const panel = this.panelRef?.nativeElement as HTMLElement & { showPopover?: () => void };
    /* ⚠️ الحارس على `:popover-open`: `showPopover()` ترمي على لوحة مفتوحة. */
    if (panel && !panel.matches(':popover-open')) {
      panel.showPopover?.();
    }
    this.searchRef?.nativeElement.focus();
    /* قياسة ثانية بعد أن صار للوحة أبعاد — الأولى وقعت وهي غير موجودة. */
    this.position();
    this.scrollActiveIntoView();

    this.detachViewport = attachViewportSync(() => this.position());
  }

  private close(): void {
    if (!this.open$()) {
      return;
    }

    const panel = this.panelRef?.nativeElement as HTMLElement & { hidePopover?: () => void };
    try {
      panel?.hidePopover?.();
    } catch {
      /* يرمي إن كانت مغلقة أصلًا (وصلنا من حدث toggle) — لا يعني شيئًا. */
    }

    this.detachViewport?.();
    this.detachViewport = null;
    this.open$.set(false);
    this.query$.set('');
  }

  private position(): void {
    const trigger = this.triggerRef?.nativeElement;
    if (!trigger) {
      return;
    }
    /*
      المرجع صفّ الحقل كلّه لا الزرّ: اللوحة تحاذي الحقل وتأخذ عرضه، وتعليقها
      على الزرّ وحده (بعرض ~90px) كان ينتج لوحة أضيق من أطول اسم دولة فيها.
    */
    const row = trigger.closest('.ap-field__control') ?? trigger;
    const pos = computePopoverPosition(row as HTMLElement, this.panelRef?.nativeElement);
    this.placement$.set(pos.placement);
    this.panelTop$.set(pos.top);
    this.panelLeft$.set(pos.left);
    this.panelWidth$.set(pos.width);
    this.panelMaxHeight$.set(pos.maxHeight);
  }

  private scrollActiveIntoView(): void {
    const id = this.activeOptionId();
    if (!id) {
      return;
    }
    queueMicrotask(() => {
      const el = this.panelRef?.nativeElement.querySelector(`#${CSS.escape(id)}`);
      el?.scrollIntoView({ block: 'nearest' });
    });
  }
}
