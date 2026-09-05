import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ApChoiceComponent, ApChoiceGroupComponent, ApRadioDirective } from 'src/app/ui';

/* ============================================================================
   معاينة حيّة — مجموعة الراديو
   ----------------------------------------------------------------------------
   الثابت هو القالب نفسه — انظر التعليق في `button-variants.demo.ts`.

   ⚠️ لا سمة `name` في أي راديو أدناه، ومع ذلك تعمل المجموعتان مستقلّتين:
      `<ap-choice-group>` يولّد اسمًا فريدًا لكلّ منهما ويضبطه على خياراتها.
      حذف الاسم يدويًا هو الخلل الصامت الأشهر في النماذج — راديوهات بلا اسم
      مشترك تُحدَّد كلّها معًا بلا خطأ في أي مكان.

   وافحص البنية: `<fieldset>` يحمل `<legend>`، فيُقرأ الخيار «مستوى الظهور،
   عام، زرّ اختيار، 1 من 3» بدل «عام، زرّ اختيار».
   ============================================================================ */

export const RADIO_GROUP_SOURCE = `
<ap-choice-group
  label="مستوى ظهور الدورة"
  hint="يمكن تغييره في أي وقت بعد النشر."
  [required]="true"
>
  <ap-choice label="عامّة" description="تظهر في صفحة الأكاديمية ومحرّكات البحث.">
    <input apRadio checked />
  </ap-choice>
  <ap-choice label="بِرابط" description="لا تظهر في القوائم، ويصل إليها من يملك الرابط.">
    <input apRadio />
  </ap-choice>
  <ap-choice label="خاصّة" description="لا يصل إليها إلا من تدعوه صراحةً.">
    <input apRadio />
  </ap-choice>
</ap-choice-group>

<ap-choice-group label="طريقة الدفع" orientation="horizontal">
  <ap-choice label="دفعة واحدة"><input apRadio checked /></ap-choice>
  <ap-choice label="تقسيط"><input apRadio /></ap-choice>
  <ap-choice label="مجّانية"><input apRadio disabled /></ap-choice>
</ap-choice-group>

<ap-choice-group label="مدّة الاشتراك" error="اختر مدّة قبل المتابعة.">
  <ap-choice label="شهر"><input apRadio /></ap-choice>
  <ap-choice label="ثلاثة أشهر"><input apRadio /></ap-choice>
  <ap-choice label="سنة"><input apRadio /></ap-choice>
</ap-choice-group>
`;

@Component({
  selector: 'demo-radio-group',
  standalone: true,
  imports: [ApChoiceGroupComponent, ApChoiceComponent, ApRadioDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    ':host { display: flex; flex-direction: column; gap: var(--ap-space-6); width: 100%; }',
  ],
  template: RADIO_GROUP_SOURCE,
})
export class RadioGroupDemo {}
