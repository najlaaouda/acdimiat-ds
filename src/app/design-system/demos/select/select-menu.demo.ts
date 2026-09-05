import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ApFieldComponent, ApSelectComponent, ApSelectOption } from 'src/app/ui';

/* ============================================================================
   معاينة حيّة — القائمة المرسومة
   ----------------------------------------------------------------------------
   الثابت هو القالب نفسه — انظر التعليق في `button-variants.demo.ts`.

   افتح القائمة الأولى: اللوحة بطاقة مرسومة في الصفحة لا لائحة نظام تشغيل،
   فتقبل الاستدارة والظلّ والفجوة عن الزنّاد — وهو ما يستحيل على `<select>`
   الأصلي مهما كُتب له من CSS.

   وجرّبها بلوحة المفاتيح: الأسهم تنقل، والكتابة تقفز إلى أول خيار يبدأ بما
   كتبت، وEsc يغلق بلا اعتماد، وTab يعتمد ويغادر.
   ============================================================================ */

export const SELECT_MENU_SOURCE = `
<ap-field label="تصنيف الدورة" [required]="true" hint="يحدّد مكان ظهورها في صفحة الأكاديمية.">
  <ap-select [options]="categories" placeholder="اختر تصنيفًا" />
</ap-field>

<ap-field label="المدرّب المسؤول">
  <ap-select [options]="instructors" placeholder="اختر مدرّبًا" />
</ap-field>

<ap-field label="حالة الدورة" hint="تُدار من صفحة النشر.">
  <ap-select [options]="statuses" placeholder="مسوّدة" [disabled]="true" />
</ap-field>
`;

@Component({
  selector: 'demo-select-menu',
  standalone: true,
  imports: [ApFieldComponent, ApSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    ':host { display: flex; flex-direction: column; gap: var(--ap-space-4); width: 100%; }',
  ],
  template: SELECT_MENU_SOURCE,
})
export class SelectMenuDemo {
  protected readonly categories: ApSelectOption[] = [
    { value: 'course', label: 'دورة جديدة' },
    { value: 'consult', label: 'جلسة استشارية' },
    { value: 'form', label: 'نموذج تسجيل' },
    { value: 'certificate', label: 'شهادة إتمام' },
    { value: 'bundle', label: 'حزمة دورات' },
    { value: 'archived', label: 'مؤرشفة', disabled: true },
  ];

  protected readonly instructors: ApSelectOption[] = [
    { value: 1, label: 'سارة العتيبي' },
    { value: 2, label: 'خالد المطيري' },
    { value: 3, label: 'نورة الدوسري' },
  ];

  protected readonly statuses: ApSelectOption[] = [{ value: 'draft', label: 'مسوّدة' }];
}
