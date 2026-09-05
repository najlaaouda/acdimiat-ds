import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ApButtonComponent, ApEmptyStateComponent, ApIllustrationComponent } from 'src/app/ui';

/* ============================================================================
   معاينة حيّة — الحالة الفارغة
   ----------------------------------------------------------------------------
   الثابت هو القالب نفسه — انظر التعليق في `button-variants.demo.ts`.

   ─── ما تُظهره هذه المعاينة بالذات ─────────────────────────────────────────
   الصور الثلاث التي تظهر بها الكتلة في اللوحة، مرتّبةً من الأكمل إلى الأقصر:

     ١. مقفلة بالباقة — أيقونة وعنوان ووصف فيه **قائمة** وزرّ واحد. والقائمة
        هي ما يقلب محاذاة الوصف إلى بداية السطر: قاعدة في ورقة المكوّن
        (`:has(ul, ol)`) لا مدخل يُمرَّر.

     ٢. فارغة بحقّ — أيقونة وعنوان ووصف وزرّان، الأوّل أساسي والثاني ثانوي.

     ٣. أقصر صورة — وصف وزرّ بلا أيقونة ولا عنوان، وهي الصحيحة داخل بطاقة
        صغيرة يسمّيها عنوانٌ فوقها أصلًا.

   والثالثة `size="sm"` كذلك: داخل حاوٍ له حدّه وحشوته، والحجم الكامل يترك
   فراغًا يبتلع البطاقة.
   ============================================================================ */

export const EMPTY_STATE_VARIANTS_SOURCE = `
<!-- ١) مقفلة بالباقة: القائمة تقلب المحاذاة وحدها -->
<ap-empty-state heading="هذه الميزة غير متاحة في باقتك" appearance="card">
  <ap-illustration apEmptyStateIllustration name="plan-locked" />

  <p>تتيح لك هذه الميزة منح المشرف جميع الصلاحيات، باستثناء:</p>
  <ul>
    <li>حذف مقاطع الفيديو</li>
    <li>إضافة أو حذف المشرفين</li>
    <li>الوصول الكامل إلى الإحصائيات والتقارير</li>
  </ul>
  <p>للاستفادة من هذه الميزة، يُرجى ترقية باقتك.</p>

  <a apEmptyStateActions apButton variant="primary" href="#">ترقية الباقة</a>
</ap-empty-state>

<!-- ٢) فارغة بحقّ: زرّان، الأساسي أوّلًا -->
<ap-empty-state heading="لا توجد دورات بعد" appearance="card">
  <ap-illustration apEmptyStateIllustration name="no-data" />

  <p>ابدأ بإنشاء دورتك الأولى، أو استورد دورة جاهزة من ملف.</p>

  <button apEmptyStateActions type="button" apButton variant="primary">إضافة دورة</button>
  <button apEmptyStateActions type="button" apButton variant="secondary">استيراد ملف</button>
</ap-empty-state>

<!-- ٣) أقصر صورة: وصف وزرّ، بلا أيقونة ولا عنوان -->
<ap-empty-state size="sm" appearance="card">
  <ap-illustration apEmptyStateIllustration size="sm" name="no-results" />
  <p>يرجى التحقق من الأحرف وإعادة المحاولة.</p>
  <button apEmptyStateActions type="button" apButton variant="tertiary">مسح البحث</button>
</ap-empty-state>
`;

@Component({
  selector: 'docs-empty-state-variants-demo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ApEmptyStateComponent, ApIllustrationComponent, ApButtonComponent],
  template: EMPTY_STATE_VARIANTS_SOURCE,
  styles: [
    `
      :host {
        display: grid;
        gap: var(--ap-space-6);
      }
    `,
  ],
})
export class EmptyStateVariantsDemoComponent {}
