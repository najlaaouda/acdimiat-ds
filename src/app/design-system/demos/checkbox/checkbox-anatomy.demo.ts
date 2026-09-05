import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ApCheckboxDirective, ApChoiceComponent } from 'src/app/ui';

/* ============================================================================
   معاينة حيّة — بنية مربّع الاختيار
   ----------------------------------------------------------------------------
   الثابت هو القالب نفسه — انظر التعليق في `button-variants.demo.ts`.

   افحص أي مربّع أدناه في أدوات المطوّر: العنصر الأصلي يحمل `id` مولَّدًا،
   والـ label يحمل `for` مطابقًا، والوصف مربوط بـ `aria-describedby`. ولم
   يُكتب أيّ من ذلك في هذا القالب.
   ============================================================================ */

export const CHECKBOX_ANATOMY_SOURCE = `
<ap-choice label="أوافق على شروط الاستخدام" [required]="true">
  <input apCheckbox />
</ap-choice>

<ap-choice
  label="إرسال إشعار للمتدرّبين"
  description="يصل بريد إلى كل متدرّب مسجَّل فور نشر الدورة."
>
  <input apCheckbox checked />
</ap-choice>

<ap-choice
  label="أرشفة الدورة تلقائيًا"
  description="متاح بعد تحديد تاريخ الانتهاء."
>
  <input apCheckbox disabled />
</ap-choice>

<ap-choice
  label="أوافق على سياسة الخصوصية"
  error="يلزم قبول السياسة قبل إنشاء الحساب."
>
  <input apCheckbox />
</ap-choice>
`;

@Component({
  selector: 'demo-checkbox-anatomy',
  standalone: true,
  imports: [ApChoiceComponent, ApCheckboxDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  /* المسرح صفّ ملتفّ؛ الخيارات تُقرأ قائمةً رأسية. */
  styles: [
    ':host { display: flex; flex-direction: column; gap: var(--ap-space-3); width: 100%; }',
  ],
  template: CHECKBOX_ANATOMY_SOURCE,
})
export class CheckboxAnatomyDemo {}
