import { Directive, ElementRef, forwardRef, signal } from '@angular/core';

import { ApChoiceControl } from './ap-choice-control';

/* ============================================================================
   Acadimiat UI — زرّ الراديو
   ----------------------------------------------------------------------------
   موجّه على `<input type="radio">` أصلي داخل `<ap-choice>`.
   طريقة الرسم نفسها المشروحة في `ap-checkbox.directive.ts`.

   ─── الفرق الجوهري عن مربّع الاختيار ───────────────────────────────────────
   ليس الشكل: الفرق أن الراديو لا معنى له منفردًا. مجموعة الراديو وحدة
   واحدة، ووحدتها في المتصفّح تُبنى على تطابق `name` — وهو الخلل الصامت
   الأشهر في النماذج: راديوهات بلا `name` مشترك تصبح مربّعات اختيار تُحدَّد
   كلّها معًا، بلا أي رسالة خطأ في أي مكان.

   لذلك يضبط `<ap-choice-group>` الاسم على كل راديو داخله — انظر `setName`.
   لا يُكتب الاسم يدويًا في القالب، فلا يُنسى.

   ⚠️ لا تُبنى مجموعة راديو بمربّعات اختيار ولا العكس: الراديو خيار واحد لا
      رجعة فيه إلا باختيار غيره (لا سبيل لإلغاء اختيار الكلّ)، والمربّع خيار
      مستقلّ يُرفع ويُنزل. المجموعة التي تقبل «لا شيء» تحتاج خيارًا صريحًا
      بذلك المعنى.
   ============================================================================ */

@Directive({
  selector: 'input[apRadio]',
  standalone: true,
  providers: [{ provide: ApChoiceControl, useExisting: forwardRef(() => ApRadioDirective) }],
  host: {
    type: 'radio',
    class: 'ap-choice__native',
    '[attr.data-invalid]': 'invalidValue() ? "true" : null',
  },
})
export class ApRadioDirective extends ApChoiceControl {
  readonly appearance = 'radio' as const;

  private readonly invalid$ = signal(false);

  protected readonly invalidValue = this.invalid$.asReadonly();

  setInvalid(value: boolean): void {
    this.invalid$.set(value);
  }

  /**
   * يضبطه `<ap-choice-group>` — ولا يُضبط من الخارج.
   *
   * الاسم المكتوب صراحةً في القالب يفوز: من يكتبه يعرف ما يريد، وقد يكون
   * يبني مجموعة تتجاوز حدود مجموعة واحدة.
   */
  setName(name: string): void {
    const el = (this.element as ElementRef<HTMLInputElement>).nativeElement;
    if (!el.name) {
      el.name = name;
    }
  }
}
