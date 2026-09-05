import { Directive, Input, forwardRef, signal } from '@angular/core';

import { ApFieldControl } from './ap-field-control';
import { AP_FIELD_KINDS, ApFieldKind, ApFieldKindConfig } from './ap-field-kind';

/* ============================================================================
   Acadimiat UI — الحقل النصّي
   ----------------------------------------------------------------------------
   موجّه (directive) على `<input>` و`<textarea>` الأصليين — لا وسم مخصّص.
   العنصر الأصلي يحمل كل سلوك المتصفّح مجانًا: الإكمال التلقائي، ومدير
   كلمات المرور، ولوحة المفاتيح المناسبة على الجوّال، والتحقّق الأصلي.

   الربط (المعرّف والوصف والإلزام والبطلان) يأتي من `ApFieldControl` —
   الصنف المجرّد الذي يتشاركه هذا الموجّه مع `ApSelectDirective`.

   ⚠️ أنماط `[apInput]` تعيش في `ap-field.component.scss` (بلا تغليف) لا هنا،
      لأن الموجّهات في Angular لا تملك أوراق أنماط.

      وهذا قيد مقصود لا التفاف: استخدام `apInput` يستلزم استيراد `ApFieldComponent`،
      أي أن كل حقل يمرّ عبر بنية تحمل label مربوطًا. وهو بالضبط ما يعالج
      أخطر رقم في التدقيق — 1256 حقلًا من 1280 بلا `id`، و1163 label بلا `for`.

      الحقل الذي لا يحتاج label مرئيًا يستخدم `ap-field` بـ `labelHidden`،
      فيبقى الاسم لقارئ الشاشة. لا مسار يُنتج حقلًا بلا اسم.
   ============================================================================ */

@Directive({
  selector: 'input[apInput], textarea[apInput]',
  standalone: true,
  providers: [{ provide: ApFieldControl, useExisting: forwardRef(() => ApInputDirective) }],
  host: {
    '[attr.data-size]': 'sizeValue()',
    '[attr.data-kind]': 'kindValue()',
    '[attr.data-invalid]': 'invalidValue() ? "true" : null',
  },
})
export class ApInputDirective extends ApFieldControl {
  private readonly size$ = signal<'sm' | 'md' | 'lg'>('md');
  private readonly invalid$ = signal(false);
  private readonly kind$ = signal<ApFieldKind>('text');

  @Input()
  set size(value: 'sm' | 'md' | 'lg') {
    this.size$.set(value ?? 'md');
  }

  /**
   * نوع الحقل. يضبط type و inputmode و dir و autocomplete دفعةً واحدة.
   *
   * يُطبَّق على العنصر مباشرةً لا عبر ربط قالب: العنصر أصلي، والسمة المكتوبة
   * يدويًا في القالب يجب أن تفوز على الافتراض — فمن يكتب type صراحةً يعرف
   * ما يريد.
   */
  @Input()
  set kind(value: ApFieldKind) {
    const config = AP_FIELD_KINDS[value] ?? AP_FIELD_KINDS['text'];
    this.kind$.set(value ?? 'text');
    this.apply(config);
  }

  protected readonly sizeValue = this.size$.asReadonly();
  protected readonly kindValue = this.kind$.asReadonly();
  protected readonly invalidValue = this.invalid$.asReadonly();

  /** يقرؤه الحقل الحاوي ليعرف هل يقلب اتجاه صفّ اللواصق. */
  override ltrRow(): boolean {
    return AP_FIELD_KINDS[this.kind$()].ltrRow;
  }

  private apply(config: ApFieldKindConfig): void {
    const el = this.element.nativeElement;

    /* لا نلمس سمةً كتبها المؤلّف صراحةً في القالب. */
    if (!el.getAttribute('type') || el.getAttribute('type') === 'text') {
      el.setAttribute('type', config.type);
    }

    setOrRemove(el, 'inputmode', config.inputMode);
    setOrRemove(el, 'dir', config.dir);
    setOrRemove(el, 'autocomplete', config.autocomplete);
  }

  /** يضبطه الحقل الحاوي — لا يُضبط من الخارج. */
  setInvalid(value: boolean): void {
    this.invalid$.set(value);
  }
}

function setOrRemove(el: Element, name: string, value: string | null): void {
  if (value) {
    el.setAttribute(name, value);
  } else {
    el.removeAttribute(name);
  }
}
