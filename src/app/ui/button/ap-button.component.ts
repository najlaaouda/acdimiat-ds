import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation, computed, signal } from '@angular/core';

/* ============================================================================
   Acadimiat UI — الزرّ
   ----------------------------------------------------------------------------
   أول مكوّن في مكتبة نظام التصميم. يستهلك طبقة `--ap-button-*` حصرًا.

   ─── لماذا محدّد سمة لا وسم مخصّص ──────────────────────────────────────────
   `<button apButton>` لا `<ap-button>`:

   • الوسم المخصّص يضيف عنصرًا حاويًا حول الزرّ الحقيقي، فينكسر `type="submit"`
     داخل النموذج، وتحتاج `disabled` تمريرًا يدويًا، ويصبح هدف اللمس عنصرين.
   • محدّد السمة يُبقي `<button>` أصليًا: النموذج يعمل، ولوحة المفاتيح تعمل،
     وقارئ الشاشة يعلن الدور بلا `role` مضاف.

   ─── لماذا ViewEncapsulation.None ──────────────────────────────────────────
   الأنماط مربوطة بالمحدّد `[apButton]` (خصوصية 0,1,0) فتهزم قواعد
   `button { … }` العارية في `bootstrap.css` و`panel-style.css` (0,0,1) بلا
   `!important`. والتغليف المُحاكى يضيف سمة إضافية ترفع الخصوصية بلا داعٍ
   وتعقّد الفرز عند تصحيح الأخطاء.

   ⚠️ الثمن نفسه المعروف: كل محدّد في ورقة هذا المكوّن يبدأ بـ `[apButton]`.

   ─── الحالات ───────────────────────────────────────────────────────────────
   لا تُكتب `:hover` في الورقة مباشرةً. كلها عبر mixins في `ui/_state.scss`
   كي تُولَّد مع مقابلها `[data-state~='…']` — انظر تعليق ذلك الملف.
   ============================================================================ */

export type ApButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'link';
export type ApButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'button[apButton], a[apButton]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './ap-button.component.scss',
  host: {
    '[attr.data-variant]': 'variantValue()',
    '[attr.data-size]': 'sizeValue()',
    '[attr.data-loading]': 'loadingValue() ? "true" : null',
    '[attr.data-icon-only]': 'iconOnlyValue() ? "true" : null',
    '[attr.data-full-width]': 'fullWidthValue() ? "true" : null',
    /* قارئ الشاشة يعلن انشغال الزرّ بدل صمت أثناء الانتظار. */
    '[attr.aria-busy]': 'loadingValue() ? "true" : null',
    /* أثناء التحميل يُمنع التفعيل المتكرّر، مع بقاء الزرّ في ترتيب التنقّل
       ليُعلن سبب تعذّر التفاعل — ولذلك `aria-disabled` لا `disabled`. */
    '[attr.aria-disabled]': 'loadingValue() ? "true" : null',
  },
  /*
    ⚠️ صفر مسافة بيضاء داخل أغلفة الأيقونات — متعمّد.
       الغلاف يُخفى بـ `:empty` حين لا يُسقَط فيه شيء، ومسافة واحدة داخله
       تُبطل `:empty` فيظهر غلاف فارغ يأكل `gap` ويزيح النصّ عن المنتصف.
  */
  template: `
    <!--
      المؤشّر يحلّ محلّ الأيقونة الأمامية ولا يُزال النصّ، فيبقى عرض الزرّ
      ثابتًا ولا يقفز ما حوله — وهو العطل الذي رُصد في التنفيذات الحالية.
    -->
    @if (loadingValue()) {
      <span class="ap-button__spinner" aria-hidden="true"></span>
    } @else {
      <span class="ap-button__icon" data-pos="start"><ng-content select="[apIconStart]" /></span>
    }
    <span class="ap-button__label"><ng-content /></span>
    <span class="ap-button__icon" data-pos="end"><ng-content select="[apIconEnd]" /></span>
  `,
})
export class ApButtonComponent {
  private readonly variant$ = signal<ApButtonVariant>('primary');
  private readonly size$ = signal<ApButtonSize>('md');
  private readonly loading$ = signal(false);
  private readonly iconOnly$ = signal(false);
  private readonly fullWidth$ = signal(false);

  @Input()
  set variant(value: ApButtonVariant) {
    this.variant$.set(value ?? 'primary');
  }

  @Input()
  set size(value: ApButtonSize) {
    this.size$.set(value ?? 'md');
  }

  /** يعرض مؤشّرًا ويمنع التفعيل، بعرض ثابت. */
  @Input()
  set loading(value: boolean) {
    this.loading$.set(!!value);
  }

  /** أيقونة بلا نصّ. يستلزم `aria-label` على العنصر — انظر التوثيق. */
  @Input()
  set iconOnly(value: boolean) {
    this.iconOnly$.set(!!value);
  }

  @Input()
  set fullWidth(value: boolean) {
    this.fullWidth$.set(!!value);
  }

  protected readonly variantValue = this.variant$.asReadonly();
  protected readonly sizeValue = this.size$.asReadonly();
  protected readonly loadingValue = this.loading$.asReadonly();
  protected readonly iconOnlyValue = this.iconOnly$.asReadonly();
  protected readonly fullWidthValue = this.fullWidth$.asReadonly();

  /** يستهلكه التوثيق لعرض التركيبة الحالية. */
  readonly descriptor = computed(
    () => `${this.variant$()} · ${this.size$()}${this.loading$() ? ' · loading' : ''}`,
  );
}
