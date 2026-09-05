import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ApBreadcrumbItem, ApBreadcrumbsComponent } from 'src/app/ui';

/* ============================================================================
   معاينة حيّة — الطيّ حين يطول المسار
   ----------------------------------------------------------------------------
   ستّ درجات وحدّ الطيّ أربع، فيُطوى الوسط ويبقى الثلاثة التي تحمل المعنى:
   الجذر (أين نحن من الموقع)، والأب (الوجهة المرجَّحة)، والحالي.

   جرّبه بلوحة المفاتيح: اضغط Tab حتى تصل إلى «…» ثم Enter. الزرّ يختفي عند
   الفتح — ولذلك ينتقل التركيز إلى أوّل درجة كُشفت، وهي بالضبط ما طلبها.
   بلا ذلك يسقط التركيز إلى `<body>` ويضيع مكان المستخدم من الصفحة.

   ⚠️ الروابط هنا تشير إلى صفحة التوثيق نفسها بمعامل استعلام، كي لا تغادر
      المعاينة الصفحة. وهي روابط حقيقية رغم ذلك: تُفتح في تبويب جديد،
      ويُنسخ عنوانها، وتعمل قبل الترطيب.
   ============================================================================ */

export const BREADCRUMBS_COLLAPSE_SOURCE = `
<ap-breadcrumbs label="مسار تعديل الدرس" [items]="path" [collapseAfter]="4" />
`;

@Component({
  selector: 'demo-breadcrumbs-collapse',
  standalone: true,
  imports: [ApBreadcrumbsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: block; }'],
  template: BREADCRUMBS_COLLAPSE_SOURCE,
})
export class BreadcrumbsCollapseDemo {
  protected readonly path: ApBreadcrumbItem[] = [
    { label: 'الرئيسية', link: '.', queryParams: { crumb: 'home' } },
    { label: 'المنتجات', link: '.', queryParams: { crumb: 'products' } },
    { label: 'الدورات', link: '.', queryParams: { crumb: 'courses' } },
    { label: 'دورة التسويق الرقمي', link: '.', queryParams: { crumb: 'course' } },
    { label: 'المحتوى', link: '.', queryParams: { crumb: 'content' } },
    { label: 'تعديل الدرس' },
  ];
}
