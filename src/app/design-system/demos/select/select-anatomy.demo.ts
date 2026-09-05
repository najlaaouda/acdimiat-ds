import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ApFieldComponent, ApSelectDirective } from 'src/app/ui';

/* ============================================================================
   معاينة حيّة — القائمة المنسدلة
   ----------------------------------------------------------------------------
   الثابت هو القالب نفسه — انظر التعليق في `button-variants.demo.ts`.

   القائمة تعيش داخل `<ap-field>` نفسه الذي يحمل الحقل النصّي، فترث منه
   الـ label المربوط والنصّ المساعد ورسالة الخطأ بلا سطر إضافي — والأهمّ:
   بالأبعاد نفسها، فيستقيم الصفّ الذي يجمع حقلًا وقائمة.

   افتح القائمة الأولى: منتقي المتصفّح هو ما يظهر — مترجَم، قابل للتنقّل
   بالأسهم، وعلى الجوّال منتقي النظام كامل الشاشة.
   ============================================================================ */

export const SELECT_ANATOMY_SOURCE = `
<ap-field label="تصنيف الدورة" [required]="true" hint="يحدّد مكان ظهورها في صفحة الأكاديمية.">
  <select apSelect>
    <option value="">اختر تصنيفًا</option>
    <option value="marketing">التسويق</option>
    <option value="design">التصميم</option>
    <option value="programming">البرمجة</option>
  </select>
</ap-field>

<ap-field label="لغة الدورة">
  <select apSelect>
    <option value="ar" selected>العربية</option>
    <option value="en">الإنجليزية</option>
  </select>
</ap-field>

<ap-field label="المدرّب المسؤول" error="اختر مدرّبًا قبل نشر الدورة.">
  <select apSelect>
    <option value="">اختر مدرّبًا</option>
    <option value="1">سارة العتيبي</option>
    <option value="2">خالد المطيري</option>
  </select>
</ap-field>

<ap-field label="حالة الدورة" hint="تُدار من صفحة النشر.">
  <select apSelect disabled>
    <option value="draft" selected>مسوّدة</option>
  </select>
</ap-field>
`;

@Component({
  selector: 'demo-select-anatomy',
  standalone: true,
  imports: [ApFieldComponent, ApSelectDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    ':host { display: flex; flex-direction: column; gap: var(--ap-space-4); width: 100%; }',
  ],
  template: SELECT_ANATOMY_SOURCE,
})
export class SelectAnatomyDemo {}
