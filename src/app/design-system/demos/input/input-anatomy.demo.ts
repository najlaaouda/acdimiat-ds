import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ApFieldComponent, ApInputDirective } from 'src/app/ui';

/* ============================================================================
   معاينة حيّة — بنية الحقل
   ----------------------------------------------------------------------------
   الثابت هو القالب نفسه — انظر التعليق في `button-variants.demo.ts`.

   افحص الحقول أدناه في أدوات المطوّر: كل `<input>` له `id` مولَّد، وكل
   `<label>` له `for` مطابق، ورسالة الخطأ مربوطة بـ `aria-describedby`
   وتحمل `role="alert"`. لم يُكتب أيّ من ذلك في هذا القالب — الحقل يفعله.
   ============================================================================ */

export const INPUT_ANATOMY_SOURCE = `
<ap-field label="اسم الدورة" [required]="true" hint="يظهر للمتدرّبين في صفحة الدورة.">
  <input apInput type="text" placeholder="مثال: أساسيات التسويق الرقمي" />
</ap-field>

<ap-field label="الوصف المختصر" [showOptional]="true">
  <textarea apInput placeholder="سطران يشرحان ما ستقدّمه الدورة."></textarea>
</ap-field>

<ap-field label="البريد الإلكتروني" error="أدخل بريدًا صالحًا — مثال: name@domain.com">
  <input apInput type="email" value="name@" />
</ap-field>

<ap-field label="الرابط المختصر" success="الرابط متاح.">
  <input apInput type="text" value="marketing-basics" />
</ap-field>
`;

@Component({
  selector: 'demo-input-anatomy',
  standalone: true,
  imports: [ApFieldComponent, ApInputDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: INPUT_ANATOMY_SOURCE,
})
export class InputAnatomyDemo {}
