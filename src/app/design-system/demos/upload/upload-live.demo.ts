import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { ApFieldComponent, ApUploadComponent, ApUploadFile } from 'src/app/ui';

/* ============================================================================
   معاينة حيّة — حقل عامل بالفعل
   ----------------------------------------------------------------------------
   الثابت هو القالب نفسه — انظر التعليق في `button-variants.demo.ts`.

   اختر صورة من جهازك، أو اسحبها وأفلتها على المنطقة. وجرّبها بلوحة المفاتيح:
   Tab يصل إلى الحقل — العنصر المُركَّز هو `<input type="file">` المخفيّ
   بصريًّا، والحلقة تُرسم على المنطقة — وSpace أو Enter يفتح المنتقي بلا سطر
   JS واحد.

   ─── المستهلك يملك القيمة ─────────────────────────────────────────────────
   المكوّن لا يحتفظ بالملف لنفسه: يُطلق `(selected)` ويستقبل ما يُعاد إليه
   في `[files]`. وهذا ما يجعل الرفض ممكنًا أصلًا — لو عرض ما اختير فورًا
   لعرض ملفًا لم يُقبل بعد.

   ─── ولا فحص ولا سطر قيود هنا: قرارٌ معتمد ────────────────────────────────
   حدُّ الحجم يقرّره **الخادم** لا العميل، فلا `MAX_BYTES` في هذه المعاينة.
   ولا مدخل `constraints` على المكوّن أصلًا — انظر الكتلة في
   `ap-upload.component.ts`: كل ما كان يمكن أن يُكتب فيه كذبٌ مُثبَت في هذا
   المشروع، فحُذف المدخل نفسه بدل الاعتماد على انضباط الكاتب.

   وما يخصّ الحقل حقًّا يعيش في `<ap-field hint>` — «لا تظهر عند تضمين
   النموذج»: وصفٌ لأثر الحقل، لا وعدٌ بما سيُقبل.

   ⚠️ وحين يرفض الخادم، تُنقَل **رسالته** إلى `<ap-field error>` كما هي. رقمٌ
      يخترعه العميل قبل أن يسأل الخادم يخطئ في الاتّجاهين: يرفض ما يقبله
      الخادم، ويَعِد بقبول ما يرفضه.

   ⚠️ `URL.createObjectURL` يحجز ذاكرة حتى `revokeObjectURL` — والإلغاء هنا
      عند الحذف وعند الاستبدال معًا، لا عند الحذف وحده.
   ============================================================================ */

export const UPLOAD_LIVE_SOURCE = `
<ap-field
  label="صورة الغلاف"
  hint="لا تظهر عند تضمين النموذج في موقع خارجي."
  [error]="error()"
>
  <ap-upload
    shape="wide"
    [files]="file()"
    (selected)="pick($event[0])"
    (removed)="clear()"
  />
</ap-field>
`;

@Component({
  selector: 'docs-upload-live-demo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ApFieldComponent, ApUploadComponent],
  template: UPLOAD_LIVE_SOURCE,
  styles: [
    `
      :host {
        display: block;
        max-width: 480px;
      }
    `,
  ],
})
export class UploadLiveDemoComponent {
  protected readonly file = signal<ApUploadFile | null>(null);
  protected readonly error = signal('');

  /**
   * في شاشة حقيقية يقع هنا الرفع إلى الخادم، ويُعاد ما يردّه:
   * رابطًا فيُكتب في `file`، أو رسالة رفض فتُكتب في `error`.
   *
   * ⚠️ ولا فحص حجم قبل ذلك — انظر تعليق الرأس. و`accept` الافتراضية
   *    (`image/*`) تصفّي في المنتقي وحده، وهي تصفية لا تحقّق: تُتجاوَز
   *    باختيار «كل الملفات»، ولا تسري على الإسقاط. الحكم النهائي للخادم.
   */
  protected pick(picked: File | undefined): void {
    if (!picked) {
      return;
    }

    this.revoke();
    this.error.set('');
    this.file.set({
      name: picked.name,
      size: picked.size,
      url: URL.createObjectURL(picked),
    });
  }

  protected clear(): void {
    this.revoke();
    this.file.set(null);
    this.error.set('');
  }

  private revoke(): void {
    const url = this.file()?.url;
    if (url?.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }
}
