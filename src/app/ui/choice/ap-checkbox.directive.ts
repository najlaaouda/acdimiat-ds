import { Directive, ElementRef, Input, forwardRef, signal } from '@angular/core';

import { ApChoiceControl } from './ap-choice-control';

/* ============================================================================
   Acadimiat UI — مربّع الاختيار
   ----------------------------------------------------------------------------
   موجّه على `<input type="checkbox">` أصلي داخل `<ap-choice>`.

   ─── لماذا يبقى العنصر الأصلي وتُرسم علامته فوقه ──────────────────────────
   العنصر الأصلي شفّاف تمامًا ومبسوط على كامل هدف اللمس، والمربّع المرئي
   شقيقه المرسوم تحته. البديلان الشائعان أسوأ:

   • `appearance: none` + `::before` على العنصر نفسه: العناصر المستبدَلة
     (replaced) لا يضمن أي معيار لها محتوى مولَّدًا — تعمل اليوم وتنكسر بلا
     إنذار.
   • صورة خلفية بعلامة SVG: يُدفَن لون العلامة في الصورة، فلا يشتقّ من token
     ولا يتبع الحالة المعطَّلة.

   الشقيق المرسوم يحلّ الاثنين: العلامة SVG في القالب ترث `currentColor`،
   والعنصر الأصلي يحتفظ بسلوكه كاملًا — المسافة تبدّله، والنموذج يرسله،
   وقارئ الشاشة يعلن «مربّع اختيار، محدَّد».

   ─── الحالة الوسطى ─────────────────────────────────────────────────────────
   `indeterminate` خاصية DOM لا سمة HTML، فلا سبيل لضبطها من القالب إلا
   عبر موجّه. وهي الحالة الوحيدة المدعومة اليوم في Material فقط من بين
   الأنظمة الثلاثة المتعايشة (C-03).

   ⚠️ الأنماط في `ap-choice.component.scss` — الموجّهات لا تملك أوراق أنماط،
      والقيد مقصود: `apCheckbox` يستلزم `ApChoiceComponent`، فلا مربّع بلا
      label مربوط.
   ============================================================================ */

@Directive({
  selector: 'input[apCheckbox]',
  standalone: true,
  providers: [{ provide: ApChoiceControl, useExisting: forwardRef(() => ApCheckboxDirective) }],
  host: {
    type: 'checkbox',
    class: 'ap-choice__native',
    '[attr.data-invalid]': 'invalidValue() ? "true" : null',
  },
})
export class ApCheckboxDirective extends ApChoiceControl {
  readonly appearance = 'checkbox' as const;

  private readonly invalid$ = signal(false);

  protected readonly invalidValue = this.invalid$.asReadonly();

  /**
   * الحالة الوسطى — «بعض ما تحته محدَّد».
   *
   * خاصية DOM لا سمة، ولا تُلغي `checked` بل تُغطّيها بصريًا: العنصر يبقى
   * غير محدَّد في بيانات النموذج. لذلك تُستخدم على مربّع «تحديد الكلّ» وحده،
   * ولا تُرسل قيمة.
   */
  @Input()
  set indeterminate(value: boolean) {
    (this.element as ElementRef<HTMLInputElement>).nativeElement.indeterminate = !!value;
  }

  setInvalid(value: boolean): void {
    this.invalid$.set(value);
  }
}
