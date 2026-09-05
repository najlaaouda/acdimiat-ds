import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ApBreadcrumbItem, ApBreadcrumbsComponent } from 'src/app/ui';

/* ============================================================================
   معاينة حيّة — المسار الأساسي
   ----------------------------------------------------------------------------
   الثابت هو القالب نفسه — انظر التعليق في `button-variants.demo.ts`.

   ─── المسار هنا حقيقي ──────────────────────────────────────────────────────
   الدرجتان الأوّليان تقودان إلى صفحتَي التوثيق الفعليّتين، والثالثة هي هذه
   الصفحة. أي أن المعاينة تصف موضعها هي — فما تراه هو ما يفعله المكوّن، لا
   محاكاة له. جرّب النقر على «المكوّنات».

   ولاحظ الأخيرة: نصّ لا رابط، وتحمل `aria-current="page"`. رابط يقود إلى
   الصفحة التي نحن فيها وعدٌ كاذب.
   ============================================================================ */

export const BREADCRUMBS_ANATOMY_SOURCE = `
<ap-breadcrumbs label="مسار صفحة التوثيق" [items]="path" />
`;

@Component({
  selector: 'demo-breadcrumbs-anatomy',
  standalone: true,
  imports: [ApBreadcrumbsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: block; }'],
  template: BREADCRUMBS_ANATOMY_SOURCE,
})
export class BreadcrumbsAnatomyDemo {
  protected readonly path: ApBreadcrumbItem[] = [
    { label: 'نظام التصميم', link: '/design-system' },
    { label: 'المكوّنات', link: '/design-system/components' },
    { label: 'مسار التنقّل' },
  ];
}
