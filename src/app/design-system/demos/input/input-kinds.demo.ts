import { ChangeDetectionStrategy, Component } from '@angular/core';

import {
  ApFieldComponent,
  ApFieldLabelIconDirective,
  ApFieldPrefixDirective,
  ApInputDirective,
} from 'src/app/ui';

/* ============================================================================
   معاينة حيّة — أنواع الحقول
   ----------------------------------------------------------------------------
   الثابت هو القالب نفسه — انظر التعليق في `button-variants.demo.ts`.

   كل نوع يضبط type و inputmode و dir دفعةً واحدة. الأثر الحقيقي يظهر على
   الجوّال: حقل الرقم يفتح لوحة أرقام، والبريد يفتح لوحة بها @ ونقطة.

   افتح أدوات المطوّر وافحص أي حقل: ستجد السمات مضبوطة بلا سطر واحد منها
   في هذا القالب.
   ============================================================================ */

export const INPUT_KINDS_SOURCE = `
<ap-field label="الاسم الكامل">
  <input apInput kind="name" placeholder="محمد عبدالله" />
</ap-field>

<ap-field label="البريد الإلكتروني">
  <input apInput kind="email" placeholder="name@domain.com" />
</ap-field>

<ap-field label="عدد المقاعد">
  <input apInput kind="number" placeholder="25" />
</ap-field>

<ap-field label="السعر" hint="اتركه فارغًا لجعل الدورة مجانية.">
  <span apFieldPrefix>ر.س</span>
  <input apInput kind="price" placeholder="0.00" />
</ap-field>

<ap-field label="رابط الدورة">
  <span apFieldPrefix>https://</span>
  <input apInput kind="url" placeholder="acadimiat.com/course" />
</ap-field>

<ap-field label="الموقع الإلكتروني">
  <span apFieldPrefix>https://</span>
  <input apInput kind="website" placeholder="example.com" />
</ap-field>

<ap-field label="تاريخ البدء">
  <input apInput kind="date" />
</ap-field>

<ap-field label="وقت البدء">
  <input apInput kind="time" />
</ap-field>
`;

@Component({
  selector: 'demo-input-kinds',
  standalone: true,
  imports: [
    ApFieldComponent,
    ApInputDirective,
    ApFieldPrefixDirective,
    ApFieldLabelIconDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    ':host { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; width: 100%; }',
  ],
  template: INPUT_KINDS_SOURCE,
})
export class InputKindsDemo {}
