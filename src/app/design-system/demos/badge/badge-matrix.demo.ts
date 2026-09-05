import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ApBadgeComponent } from 'src/app/ui';

/* ============================================================================
   معاينة حيّة — شارة الحالة
   ----------------------------------------------------------------------------
   الثابت هو القالب نفسه — انظر التعليق في `button-variants.demo.ts`.

   ─── ما تُظهره هذه المعاينة بالذات ─────────────────────────────────────────
   الحالات الخمس في الحجمين جنبًا إلى جنب. والمقارنة الرأسية هي المقصودة:
   النقطة والنصّ في كل حالة لونٌ واحد، فتُقرأ الشارة وحدةً بصرية لا عنصرين —
   وهو ما يجعل الخمس متساوية في الوضوح رغم اختلاف ألوانها.

   والسطر الأخير يعرض الحالة الخامسة داخل عمود جدول: هناك تأخذ الشارات
   عرضًا أدنى موحَّدًا من ورقة الجدول، فتستوي حافّتها ولا يصير طول التسمية
   إشارةً ثانية.
   ============================================================================ */

export const BADGE_MATRIX_SOURCE = `
<div class="grid">
  <span class="head"></span>
  <span class="head">Small</span>
  <span class="head">Medium</span>

  <span class="row">الافتراضي</span>
  <ap-badge variant="default" size="sm">مسوّدة</ap-badge>
  <ap-badge variant="default" size="md">مسوّدة</ap-badge>

  <span class="row">قيد المعالجة</span>
  <ap-badge variant="processing" size="sm">قيد المعالجة</ap-badge>
  <ap-badge variant="processing" size="md">قيد المعالجة</ap-badge>

  <span class="row">نجاح</span>
  <ap-badge variant="success" size="sm">مكتمل</ap-badge>
  <ap-badge variant="success" size="md">مكتمل</ap-badge>

  <span class="row">تحذير</span>
  <ap-badge variant="warning" size="sm">بانتظار الإجراء</ap-badge>
  <ap-badge variant="warning" size="md">بانتظار الإجراء</ap-badge>

  <span class="row">خطأ</span>
  <ap-badge variant="error" size="sm">فشل</ap-badge>
  <ap-badge variant="error" size="md">فشل</ap-badge>
</div>

<!--
  الشارة داخل عمود: العرض الأدنى يأتي من ورقة الجدول لا من الشارة، فتستوي
  الحافّة ولا يتحوّل طول التسمية إلى إشارة بصرية ثانية.
-->
<p class="note">داخل عمود جدول — حافّة واحدة رغم اختلاف الأطوال:</p>
<div class="column">
  <ap-badge variant="success" size="sm">مكتمل</ap-badge>
  <ap-badge variant="error" size="sm">فشل</ap-badge>
  <ap-badge variant="warning" size="sm">بانتظار الإجراء</ap-badge>
  <ap-badge variant="default" size="sm">مسوّدة</ap-badge>
</div>
`;

@Component({
  selector: 'demo-badge-matrix',
  standalone: true,
  imports: [ApBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  /* ⚠️ لا backtick داخل هذه السلاسل ولا في تعليقاتها — يُغلق النصّ الحرفي. */
  styles: [
    ':host { display: block; width: 100%; }',
    '.grid { display: grid; grid-template-columns: auto auto auto;' +
      ' gap: var(--ap-space-3) var(--ap-space-6); align-items: center;' +
      ' justify-content: start; }',
    '.head, .row { color: var(--ap-color-text-secondary);' +
      ' font-size: var(--ap-font-size-xs); }',
    '.note { margin-block: var(--ap-space-6) var(--ap-space-2);' +
      ' color: var(--ap-color-text-secondary); font-size: var(--ap-font-size-xs); }',
    '.column { display: flex; flex-direction: column;' +
      ' align-items: start; gap: var(--ap-space-2); }',
    '.column ap-badge { min-width: var(--ap-table-badge-min-width);' +
      ' justify-content: center; }',
  ],
  template: BADGE_MATRIX_SOURCE,
})
export class BadgeMatrixDemo {}
