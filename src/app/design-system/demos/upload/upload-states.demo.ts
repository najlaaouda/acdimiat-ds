import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ApFieldComponent, ApUploadComponent, ApUploadFile } from 'src/app/ui';

/* ============================================================================
   معاينة حيّة — حقل رفع الصور، الصور الأربع
   ----------------------------------------------------------------------------
   الثابت هو القالب نفسه — انظر التعليق في `button-variants.demo.ts`.

   ─── ما تُظهره هذه المعاينة بالذات ─────────────────────────────────────────
   الحقل نفسه في أربع حالات متتابعة زمنيًّا، كي تُقرأ الحالتان الوسطيان
   امتدادًا للأولى لا مكوّنًا آخر:

     ١. قبل الرفع        صفّ بحدّ متقطّع — مربّع فارغ ثمّ مطالبة
     ٢. أثناء الرفع      بطاقة، والنسبة تحلّ محلّ الحجم في السطر نفسه
     ٣. بعد الرفع        بطاقة كاملة — مصغَّرة، اسم، حجم، زرّ حذف
     ٤. بعد رفضٍ         الحدّ أحمر ورسالة الخطأ من `<ap-field>` لا من المكوّن،
                        ونصّها من **الخادم** — لا حدّ حجم في العميل يسبقه

   ولاحظ اختلاف **شكل** المصغَّرة بين ٣ و٥: الغلاف `wide` لأنه شيء مصوَّر،
   والشعار `rounded` لأنه شيء مربّع. القاعدة نفسها التي تحكم `<ap-avatar>`،
   وليست خيارًا تجميليًّا: القصّ المربّع لغلافٍ أفقي يبتر طرفيه.

   ─── معاينات وهمية ─────────────────────────────────────────────────────────
   الصور `data:` قصيرة داخل الملف لا روابط خارجية: مسرح المعاينة يعمل بلا
   شبكة، ورابطٌ مكسور كان سيعرض الأيقونة البديلة بدل المعاينة — فتوثّق
   المعاينةُ حالةً غير التي تدّعيها.
   ============================================================================ */

/** تدرّج بنفسجي — يقف مقام صورة غلاف حقيقية. */
const COVER_PREVIEW =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 48">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#6d28d9"/><stop offset="1" stop-color="#a78bfa"/>' +
      '</linearGradient></defs><rect width="64" height="48" fill="url(#g)"/></svg>',
  );

/** مربّع داكن بحرف — يقف مقام شعار أكاديمية. */
const LOGO_PREVIEW =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">' +
      '<rect width="40" height="40" fill="#0f172a"/>' +
      '<circle cx="20" cy="20" r="9" fill="none" stroke="#ffffff" stroke-width="3"/></svg>',
  );

export const UPLOAD_STATES_SOURCE = `
<!-- ١) قبل الرفع: منطقة الإسقاط -->
<ap-field label="صورة الغلاف" hint="لا تظهر عند تضمين النموذج في موقع خارجي.">
  <ap-upload
    shape="wide"
    (selected)="noop($event)"
  />
</ap-field>

<!-- ٢) أثناء الرفع: النسبة تحلّ محلّ الحجم، فلا يتغيّر ارتفاع البطاقة -->
<ap-field label="صورة الغلاف">
  <ap-upload shape="wide" [files]="cover" [progress]="62" />
</ap-field>

<!-- ٣) بعد الرفع: غلاف — مصغَّرة wide لأنه شيء مصوَّر -->
<ap-field label="صورة الغلاف" hint="لا تظهر عند تضمين النموذج في موقع خارجي.">
  <ap-upload shape="wide" [files]="cover" (removed)="noop($event)" />
</ap-field>

<!-- ٤) بعد رفضٍ: الرسالة من ap-field، والحدّ الأحمر من data-invalid -->
<ap-field
  label="صورة الغلاف"
  error="تعذّر رفع الصورة — رفضها الخادم. حاول بصورة أخرى."
>
  <ap-upload shape="wide" />
</ap-field>

<!-- ٥) شعار — مصغَّرة rounded لأنه شيء مربّع لا شيء مصوَّر -->
<ap-field label="الشعار" hint="يظهر في رأس الصفحة وفي نتائج البحث.">
  <ap-upload shape="rounded" [files]="logo" (removed)="noop($event)" />
</ap-field>

<!--
  ٦) صورة الملف الشخصي — circle، والمربّع الفارغ دائري مثلها.
     ⚠️ وأيقونته **صورة** لا شخص: الدائرة تصف ما سيوضع فيها لا من هو.
-->
<ap-field label="الصورة الشخصية">
  <ap-upload shape="circle" />
</ap-field>
`;

@Component({
  selector: 'docs-upload-states-demo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ApFieldComponent, ApUploadComponent],
  template: UPLOAD_STATES_SOURCE,
  styles: [
    `
      :host {
        display: grid;
        gap: var(--ap-space-6);
      }
    `,
  ],
})
export class UploadStatesDemoComponent {
  protected readonly cover: ApUploadFile = {
    name: 'course-cover.png',
    size: 204800,
    url: COVER_PREVIEW,
  };

  protected readonly logo: ApUploadFile = {
    name: 'logo-symbol.png',
    size: 32768,
    url: LOGO_PREVIEW,
  };

  /* المعاينة ساكنة عمدًا — الصور الأربع تُقرأ متجاورةً لا متعاقبة. الحقل
     الحيّ في المعاينة التالية. */
  protected noop(_event: unknown): void {}
}
