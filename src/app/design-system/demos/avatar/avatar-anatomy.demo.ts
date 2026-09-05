import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ApAvatarComponent, ApMediaCellComponent } from 'src/app/ui';

/* ============================================================================
   معاينة حيّة — الأفاتار وخليّة الوسائط
   ----------------------------------------------------------------------------
   الثابت هو القالب نفسه — انظر التعليق في `button-variants.demo.ts`.

   ─── ما يُثبته هذا المثال ──────────────────────────────────────────────────
   • الأحرف الأولى تتخطّى أداة التعريف: «سارة العتيبي» ⇐ «سع» لا «سا».
     وهذا ليس تحسينًا لغويًا — بلا التخطّي تصير كل الأفاتارات في عمود عربي
     تنتهي بـ «ا»، فيضيع نصف التمييز.
   • الصفّ الأخير رابط مكسور عمدًا: الصورة تفشل فتحلّ الأحرف محلّها بلا
     أيقونة متصفّح مشوّهة، وبلا قفزة في التخطيط.
   • الشكل يتبع المحتوى: دائري لشخص، بزوايا لشيء.
   ============================================================================ */

export const AVATAR_ANATOMY_SOURCE = `
<div class="strip">
  <span class="head">المقاسات</span>
  <ap-avatar name="سارة العتيبي" size="xs" [decorative]="false" />
  <ap-avatar name="سارة العتيبي" size="sm" [decorative]="false" />
  <ap-avatar name="سارة العتيبي" size="md" [decorative]="false" />
  <ap-avatar name="سارة العتيبي" size="lg" [decorative]="false" />
</div>

<div class="strip">
  <span class="head">الشكل</span>
  <ap-avatar name="خالد المطيري" shape="circle" [decorative]="false" />
  <ap-avatar name="أساسيات التسويق" shape="rounded" [decorative]="false" />
  <span class="note">دائري لشخص · بزوايا لشيء</span>
</div>

<div class="strip">
  <span class="head">الأحرف</span>
  <ap-avatar name="نورة الدوسري" [decorative]="false" />
  <ap-avatar name="عبدالله القحطاني" [decorative]="false" />
  <ap-avatar name="ريم" [decorative]="false" />
  <ap-avatar name="Sara Al Otaibi" [decorative]="false" />
</div>

<div class="cells">
  <span class="head">خليّة الوسائط</span>

  <ap-media-cell shape="circle" title="سارة العتيبي" subtitle="sara@example.com" />

  <ap-media-cell shape="rounded" title="أساسيات التسويق الرقمي" subtitle="دورة · 12 درسًا" />

  <ap-media-cell
    shape="circle"
    title="خالد المطيري"
    subtitle="رابط الصورة مكسور — تحلّ الأحرف محلّه"
    src="/assets/does-not-exist.png"
  />

  <ap-media-cell
    shape="rounded"
    title="اسم منتج طويل جدًّا لا يتّسع له عرض العمود فيُقصّ بثلاث نقاط"
    subtitle="القصّ بصريّ — النصّ كامل في الـ DOM وفي title"
  />
</div>
`;

@Component({
  selector: 'demo-avatar-anatomy',
  standalone: true,
  imports: [ApAvatarComponent, ApMediaCellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  /* ⚠️ لا backtick داخل هذه السلاسل — يُغلق النصّ الحرفي. */
  styles: [
    ':host { display: flex; flex-direction: column; gap: var(--ap-space-6); width: 100%; }',
    '.strip { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ap-space-3); }',
    '.cells { display: flex; flex-direction: column; gap: var(--ap-space-4);' +
      ' max-width: 360px; }',
    '.head { min-width: 6rem; color: var(--ap-color-text-tertiary);' +
      ' font-size: var(--ap-font-size-xs); font-weight: var(--ap-font-weight-medium); }',
    '.note { color: var(--ap-color-text-tertiary); font-size: var(--ap-font-size-xs); }',
  ],
  template: AVATAR_ANATOMY_SOURCE,
})
export class AvatarAnatomyDemo {}
