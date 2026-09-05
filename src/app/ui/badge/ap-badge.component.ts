import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation, signal } from '@angular/core';

/* ============================================================================
   Acadimiat UI — شارة الحالة
   ----------------------------------------------------------------------------
   بطاقة بيضاء صغيرة بزوايا مستديرة وحدّ رمادي رفيع ونصّ داكن — والخمس متطابقة في ذلك. واللون في
   النقطة وحدها: قلبٌ معتِم بلون الحالة وهالةٌ أوسع منه بتدرّج فاتح.
   خمس حالات × حجمان. الجرد رصد 133 استعمالًا لنمط `.badge light badge-*`
   داخل الخلايا وحدها، بلا مواصفة تحكمه.

   ─── لماذا وسم مخصّص هنا، لا سمة على عنصر أصلي ────────────────────────────
   اصطلاح المكتبة سمةٌ على عنصر أصلي (`<button apButton>`)، والاستثناء لما
   لا عنصرَ له أو لما هو **بنية**. وهذه الثانية: نقطة + نصّ بفجوة محكومة،
   والنقطة عنصر حقيقي في القالب لا زخرفة CSS — فتحتاج قالبًا.

   ─── ما ليست عليه ─────────────────────────────────────────────────────────
   ⛔ ليست زرًّا ولا رقاقة. لا `(click)` ولا مرور ولا حالة مضغوطة ولا
      `tabindex`. مؤشّر حالة ساكن، لا أكثر. وما يُفعَّل بالنقر عنصرٌ آخر
      يدخل ترتيب التنقّل ويُعلن دوره.
   ⛔ وليست وسيلة الإخبار الوحيدة: النقطة **زخرفية**، والنصّ هو ما يُقرأ
      (WCAG 1.4.1). ولذلك لا شارة بلا نصّ — واللون فيها زينة فوق المعنى لا
      بديل عنه.
   ⛔ ولا أيقونات فيها إطلاقًا. الأيقونة داخل بطاقة بارتفاع 20px تصير بقعة
      لا شكلًا، وتزاحم النقطةَ على الدور نفسه: علامة بصرية قبل النصّ.

   ─── لماذا حالات لا «نغمات» ───────────────────────────────────────────────
   التسمية السابقة (`tone`) كانت تصف اللون، فكان الاختيار يقع على اللون لا
   على المعنى — ومن يريد أخضر يكتب `success` ولو لم تكن الحالة نجاحًا.
   و`variant` بأسماء حالات يجعل السؤال «ما حالة هذا الصفّ؟» لا «أي لون
   أريد؟».
   ============================================================================ */

/**
 * حالة الشارة.
 *
 * ⚠️ لا `brand`: البنفسجي يعني «فعل» في هذه اللوحة (الزرّ الأساسي)،
 *    واستعماله حالةً يجعل نصف الجدول يبدو قابلًا للنقر.
 */
export type ApBadgeVariant = 'default' | 'processing' | 'success' | 'warning' | 'error';

/** `sm` للجداول والقوائم، `md` للتفاصيل والبطاقات. ولا `lg`. */
export type ApBadgeSize = 'sm' | 'md';

@Component({
  selector: 'ap-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './ap-badge.component.scss',
  host: {
    '[attr.data-variant]': 'variantValue()',
    '[attr.data-size]': 'sizeValue()',
  },
  /*
    ⚠️ النقطة `aria-hidden`: هي تكرار بصري لما يقوله النصّ، وإعلانها يجعل
       قارئ الشاشة يقرأ الحالة مرّتين — أو يقرأ «نقطة» بلا معنى.

    ⚠️ وهي عنصر في القالب لا `::before` في الورقة: المحتوى المولَّد لا
       يُقاس ولا يُفحص في أدوات المطوّر، ولا يمكن إخفاؤه عن قارئ الشاشة
       بسمة. وهنا الإخفاء مقصود ومُعلَن.
  */
  template: `
    <span class="ap-badge__dot" aria-hidden="true"></span
    ><span class="ap-badge__label"><ng-content /></span>
  `,
})
export class ApBadgeComponent {
  private readonly variant$ = signal<ApBadgeVariant>('default');
  private readonly size$ = signal<ApBadgeSize>('sm');

  @Input()
  set variant(value: ApBadgeVariant) {
    this.variant$.set(value ?? 'default');
  }

  @Input()
  set size(value: ApBadgeSize) {
    this.size$.set(value ?? 'sm');
  }

  protected readonly variantValue = this.variant$.asReadonly();
  protected readonly sizeValue = this.size$.asReadonly();
}
