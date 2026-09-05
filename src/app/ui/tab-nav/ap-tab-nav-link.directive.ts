import {
  Directive,
  Input,
  OnInit,
  booleanAttribute,
  computed,
  inject,
  isDevMode,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLinkActive } from '@angular/router';

/* ============================================================================
   Acadimiat UI — رابط شريط التنقّل
   ----------------------------------------------------------------------------
   سمة على `<a>` أصلي، لا وسم مخصّص: الرابط يجب أن يبقى رابطًا — يُفتح في
   تبويب جديد بالزرّ الأوسط، ويُنسخ عنوانه، ويُفهرَس، ويعمل قبل ترطيب
   JavaScript. وأي غلاف حوله يكسر ذلك كلّه.

   ─── ما يحلّه هذا الموجّه ──────────────────────────────────────────────────
   الجرد وجد 77 ملفًا فيه `nav-tabs`/`nav-pills`، و`aria-current` موجودة في
   المشروع كلّه **ثلاث مرّات**. أي أن التبويب المفتوح كان يُبلَّغ **باللون
   وحده**: من لا يرى اللون لا يعرف أين هو (WCAG 1.4.1 و4.1.2).

   ─── لماذا لا يُترك للمستهلك أن يكتب aria-current ─────────────────────────
   لأن ذلك هو بالضبط ما فشل 74 مرّة. هنا مصدر الحقيقة **واحد** داخل الموجّه،
   ومنه تُشتقّ السمة وحالة التنسيق معًا:

       [aria-current='page']   ← المحدّد الذي تُرسم به الحالة النشطة

   فالخطّاف البصري **هو** خطّاف الوصول. لا مسار يُنتج رابطًا يبدو نشطًا وهو
   صامت لقارئ الشاشة، ولا العكس.

   ─── وضعان، ولا ثالث ──────────────────────────────────────────────────────
     1) وضع المسار: يُكتب `routerLinkActive` بجانبه، فيُقرأ منه `isActive`.
        هذا هو الوضع الغالب (12 شاشة في اللوحة).

     2) وضع يدوي: تُمرَّر القيمة `[apTabNavLink]="expr"` — لتبويب مقاد
        بمعامل استعلام مثلًا، وهو نمط `page-edit`.

   وإن غاب الاثنان يُرمى خطأ في وضع التطوير: رابط بلا مصدر حالة هو بالضبط
   العطل الذي وُجد الموجّه ليمنعه، فلا يصحّ أن يمرّ صامتًا.

   ⚠️ لا تُمرَّر `ariaCurrentWhenActive` على `routerLinkActive` بجانب هذا
      الموجّه: كاتبان لسمة واحدة. الموجّه يكتبها وحده.
   ============================================================================ */
@Directive({
  selector: 'a[apTabNavLink]',
  standalone: true,
  host: {
    class: 'ap-tab-nav__link',
    '[attr.aria-current]': 'activeValue() ? "page" : null',
    /*
      `aria-disabled` لا `disabled`: العنصر `<a>` لا يقبل `disabled` أصلًا،
      والإخراج من ترتيب التنقّل يخفي السبب — فيبقى قابلًا للتركيز ليُعلن
      أنه معطَّل.

      ⚠️ ومنع الملاحة **ليس هنا**: مستمع على العنصر نفسه لا يسبق مستمع
         `RouterLink` عليه — كلاهما في طور الهدف، والترتيب ترتيب تسجيل لا
         يضمنه شيء. الحارس في الحاوي، في طور الالتقاط. انظر تعليقه.
    */
    '[attr.aria-disabled]': 'disabledValue() ? "true" : null',
  },
})
export class ApTabNavLinkDirective implements OnInit {
  private readonly routerActive$ = signal(false);
  private readonly manualActive$ = signal(false);
  private readonly disabled$ = signal(false);

  /** هل رُبطت القيمة صراحةً؟ يفصل الوضع اليدوي عن السمة العارية. */
  private readonly manualBound$ = signal(false);

  private readonly routerLinkActive = inject(RouterLinkActive, { optional: true, self: true });

  /**
   * الوضع اليدوي: حالة النشاط صراحةً.
   *
   * تُترك فارغة في وضع المسار — تُكتب السمة عارية `apTabNavLink`.
   */
  @Input({ alias: 'apTabNavLink' })
  set active(value: boolean | '') {
    /* السمة العارية تصل كسلسلة فارغة، وهي **ليست** ربطًا يدويًا. */
    if (value === '') {
      return;
    }
    this.manualBound$.set(true);
    this.manualActive$.set(value === true || (value as unknown) === 'true');
  }

  @Input({ transform: booleanAttribute })
  set disabled(value: boolean) {
    this.disabled$.set(value);
  }

  protected readonly disabledValue = this.disabled$.asReadonly();

  /** مصدر الحقيقة الوحيد — منه السمة والتنسيق معًا. */
  protected readonly activeValue = computed(() =>
    this.manualBound$() ? this.manualActive$() : this.routerActive$(),
  );

  constructor() {
    /*
      يُقرأ من `isActiveChange` لا بـ `ariaCurrentWhenActive`: لو أُسندت تلك
      لصار للسمة كاتبان — الموجّه هنا و`RouterLinkActive` — ولغلب آخِرُهما
      كتابةً في كل دورة كشف تغيير. القراءة تُبقي كاتبًا واحدًا.

      ولا حاجة إلى قراءة أوّلية: `RouterLinkActive` يبدأ من `false` ويُطلق
      عند أوّل حساب في `ngAfterContentInit`، فالانتقال إلى `true` مُلتقَط.
    */
    this.routerLinkActive?.isActiveChange
      .pipe(takeUntilDestroyed())
      .subscribe(active => this.routerActive$.set(active));
  }

  ngOnInit(): void {
    if (isDevMode() && !this.routerLinkActive && !this.manualBound$()) {
      throw new Error(
        '[apTabNavLink] رابط بلا مصدر لحالة النشاط. أضف routerLinkActive بجانبه، ' +
          'أو مرّر الحالة صراحةً: [apTabNavLink]="expr".',
      );
    }
  }
}
