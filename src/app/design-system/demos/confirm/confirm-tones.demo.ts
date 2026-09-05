import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { ApButtonComponent, ApConfirmComponent, ApConfirmRefusal } from 'src/app/ui';

/* ============================================================================
   معاينة حيّة — نافذة التأكيد بنغمتيها
   ----------------------------------------------------------------------------
   الثابت هو القالب نفسه — انظر التعليق في `button-variants.demo.ts`.

   ─── ما يُقاس هنا ──────────────────────────────────────────────────────────
   الفرق بين النغمتين **لون الزرّ وحده**: البنية واحدة، والنصّ هو ما يفرّق
   بينهما. جرّب الاثنتين بلوحة المفاتيح: التركيز يدخل ولا يغادر، وEsc يغلق،
   ويعود التركيز إلى الزرّ الذي فتح — كلّه من `<dialog>` الأصلي داخل
   `<ap-modal>`.

   والثالثة تُظهر الانتظار: الزرّ يدور والنافذة **تبقى مفتوحة** حتى «يردّ
   الخادم» (ثانيتان هنا). وهذا هو سبب أن المكوّن لا يغلق نفسه عند التأكيد.

   والرابعة تُكمل الاحتمال الآخر: الخادم يردّ **بالرفض**، فتصير النافذة نفسها
   خبرًا — العنوان «تعذّر …»، والسبب محلّ الوصف، وزرٌّ واحد. جرّبها بلوحة
   المفاتيح: التركيز ينتقل إلى «إغلاق» لأن الزرّ الذي كان تحته قد نُزع.
   ============================================================================ */

export const CONFIRM_TONES_SOURCE = `
<button apButton variant="danger" (click)="danger.set(true)">حذف المدرب</button>
<button apButton variant="secondary" (click)="normal.set(true)">إيقاف تفعيل عميل</button>
<button apButton variant="secondary" (click)="slow.set(true)">حذف يستغرق وقتًا</button>
<button apButton variant="secondary" (click)="openRefused()">حذف يرفضه الخادم</button>

<ap-confirm
  tone="danger"
  confirmLabel="حذف"
  heading="هل أنت متأكد من حذف «محمد العتيبي»؟"
  description="سيتم حذف جميع بيانات المدرب نهائيًا، ولا يمكن التراجع عن ذلك."
  [open]="danger()"
  (openChange)="danger.set($event)"
  (confirmed)="danger.set(false)"
/>

<ap-confirm
  confirmLabel="إيقاف التفعيل"
  heading="إيقاف تفعيل حساب العميل «نورة الدوسري»"
  description="لن يتمكن العميل من الوصول إلى حسابه واستخدام المنصة."
  [open]="normal()"
  (openChange)="normal.set($event)"
  (confirmed)="normal.set(false)"
/>

<ap-confirm
  tone="danger"
  confirmLabel="حذف"
  heading="حذف المدربين المحدَّدين؟"
  description="سيُحذف 3 مدربين، ولا يمكن الاستعادة. ولن يُحذف مدرب هو مالك الأكاديمية أو رُبطت به منتجات."
  [open]="slow()"
  [loading]="busy()"
  (openChange)="slow.set($event)"
  (confirmed)="run()"
/>

<ap-confirm
  tone="danger"
  confirmLabel="حذف"
  heading="هل أنت متأكد من حذف «سارة القحطاني»؟"
  description="سيتم حذف جميع بيانات المدرب نهائيًا، ولا يمكن التراجع عن ذلك."
  [open]="refused()"
  [loading]="refusing()"
  [refusal]="refusal()"
  (openChange)="onRefusedOpen($event)"
  (confirmed)="refuse()"
/>
`;

@Component({
  selector: 'demo-confirm-tones',
  standalone: true,
  imports: [ApButtonComponent, ApConfirmComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    ':host { display: flex; flex-wrap: wrap; gap: var(--ap-space-3); align-items: center; }',
  ],
  template: CONFIRM_TONES_SOURCE,
})
export class ConfirmTonesDemo {
  protected readonly danger = signal(false);
  protected readonly normal = signal(false);
  protected readonly slow = signal(false);
  protected readonly busy = signal(false);
  protected readonly refused = signal(false);
  protected readonly refusing = signal(false);
  protected readonly refusal = signal<ApConfirmRefusal | null>(null);

  /** ⚠️ الخبر يُصفَّر عند الفتح: نافذةٌ تُفتح وفيها رفض المرّة الماضية تكذب. */
  protected openRefused(): void {
    this.refusal.set(null);
    this.refused.set(true);
  }

  protected onRefusedOpen(open: boolean): void {
    this.refused.set(open);
    if (!open) {
      this.refusal.set(null);
    }
  }

  /** يحاكي الردّ السالب: انتظار، ثم خبرٌ محلّ السؤال — والنافذة لم تُغلق. */
  protected refuse(): void {
    this.refusing.set(true);
    setTimeout(() => {
      this.refusing.set(false);
      this.refusal.set({
        heading: 'تعذّر حذف «سارة القحطاني»',
        description:
          'هذا المدرب مالك للأكاديمية أو مرتبط بمنتجات. ' +
          'إن كانت له منتجات، غيّر مدرّبها ثم أعد المحاولة.',
      });
    }, 1200);
  }


  /** يحاكي طلبًا: الزرّ يدور والنافذة تبقى حتى ينتهي. */
  protected run(): void {
    this.busy.set(true);
    setTimeout(() => {
      this.busy.set(false);
      this.slow.set(false);
    }, 2000);
  }
}
