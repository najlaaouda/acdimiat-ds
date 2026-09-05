import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ApChoiceComponent, ApSwitchDirective } from 'src/app/ui';

/* ============================================================================
   معاينة حيّة — المفتاح وصفّ الإعداد
   ----------------------------------------------------------------------------
   الثابت هو القالب نفسه — انظر التعليق في `button-variants.demo.ts`.

   بدّل أي مفتاح أدناه ثم افحصه: `aria-checked` يتغيّر معه، وموضع الإبهام
   يتحرّك من البداية إلى النهاية — تمييز شكلي يُقرأ حتى بلا لون.

   وجرّب التبديل بلوحة المفاتيح: المسافة تعمل لأن العنصر تحت الشكل عنصر
   `<input>` أصلي، لا `<div>` بـ `role`.
   ============================================================================ */

export const SWITCH_ROW_SOURCE = `
<ap-choice
  layout="between"
  label="إشعارات البريد الإلكتروني"
  description="رسالة عند كل تسجيل جديد في إحدى دوراتك."
>
  <input apSwitch checked />
</ap-choice>

<ap-choice
  layout="between"
  label="السماح بالتعليقات"
  description="يستطيع المتدرّبون التعليق أسفل كل درس."
>
  <input apSwitch />
</ap-choice>

<ap-choice
  layout="between"
  label="الشهادات التلقائية"
  description="متاح في الباقة الاحترافية."
>
  <input apSwitch disabled />
</ap-choice>
`;

@Component({
  selector: 'demo-switch-row',
  standalone: true,
  imports: [ApChoiceComponent, ApSwitchDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  /*
    صفوف الإعداد تُفصل بخطّ لا بفجوة: الفجوة وحدها تجعل الوصف الطويل يبدو
    منتميًا إلى الصفّ التالي.
  */
  styles: [
    ':host { display: flex; flex-direction: column; width: 100%; }',
    ':host ap-choice { padding-block: var(--ap-space-3); }',
    ':host ap-choice + ap-choice { border-block-start: var(--ap-border-width-thin) solid var(--ap-color-border-subtle); }',
  ],
  template: SWITCH_ROW_SOURCE,
})
export class SwitchRowDemo {}
