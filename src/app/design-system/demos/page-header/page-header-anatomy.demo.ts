import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ApButtonComponent, ApPageHeaderComponent } from 'src/app/ui';

/* ============================================================================
   معاينة حيّة — رأس الصفحة
   ----------------------------------------------------------------------------
   الثابت هو القالب نفسه — انظر التعليق في `button-variants.demo.ts`.

   الوصف هنا نصّ ممرَّر، والرابط عنصر مُسقَط في نهايته: الجملة تنتهي بـ
   «اقرأ المقال» فيُقرأ امتدادًا لها لا سطرًا منفصلًا تحتها. ونوعه `link`
   فيجري في السطر نفسه بلا ارتفاع زرّ.

   والأفعال في المنفذ المسمّى `apPageHeaderActions` — تقع في الطرف المقابل
   للعنوان، وتنزل تحته على الشاشة الضيّقة.
   ============================================================================ */

export const PAGE_HEADER_ANATOMY_SOURCE = `
<ap-page-header
  heading="المستخدمون"
  description="إدارة العملاء، المدربين، المدراء والمشرفين، وتحديد الصلاحيات المناسبة لكل مستخدم. "
>
  <a apButton variant="link" href="#" (click)="$event.preventDefault()">اقرأ المقال</a>

  <button apPageHeaderActions type="button" apButton variant="secondary">تصدير</button>
  <button apPageHeaderActions type="button" apButton variant="primary">إضافة مستخدم</button>
</ap-page-header>
`;

@Component({
  selector: 'demo-page-header-anatomy',
  standalone: true,
  imports: [ApPageHeaderComponent, ApButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: block; }'],
  template: PAGE_HEADER_ANATOMY_SOURCE,
})
export class PageHeaderAnatomyDemo {}
