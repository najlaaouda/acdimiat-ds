import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  afterNextRender,
  isDevMode,
  signal,
} from '@angular/core';

/* ============================================================================
   Acadimiat UI — شريط التنقّل بين المسارات
   ----------------------------------------------------------------------------
   ⛔ هذا ليس `<ap-tabs>`، ولا يُستعمل مكانه.

   الجرد وجد 77 ملفًا يستعمل `nav-tabs`/`nav-pills`، وأغلبها **ليس تبويبًا**:
   روابط `routerLink` وكل «لوحة» مسار مستقلّ خلف `<router-outlet>`. الفرق
   ليس تسميةً:

       شريط تنقّل   كل لوحة مسار. الملاحة حقيقية، والعنوان يتغيّر، والزرّ
                    «رجوع» يعمل، والرابط يُشارَك ويُفتح في تبويب جديد.
                    الدلالة: معلَم `<nav>` + روابط + `aria-current="page"`.

       ودجة تبويب   اللوحات كلها في الصفحة نفسها، ولا ملاحة. الدلالة:
                    `tablist`/`tab`/`tabpanel` + tabindex متجوّل + أسهم.

   وإلباس الأول دلالة الثاني عطل لا تجميل: `role="tab"` يَعِد قارئ الشاشة
   بلوحة تظهر في المكان نفسه، فإذا بالصفحة كلها تتبدّل. ولذلك لا `tablist`
   هنا إطلاقًا.

   ─── لماذا لا `<ul>`/`<li>` ───────────────────────────────────────────────
   الروابط تصل **مُسقَطة**، فلا سبيل إلى لفّ كل واحد بـ `<li>` من داخل
   القالب. والبديل — إلزام المستهلك بكتابة `<li>` حول كل رابط — يشتري
   إعلان «قائمة من 7» بثمن بنية يسهل نسيان نصفها. المعلَم المسمّى يكفي.

   ─── الاسم إلزامي ─────────────────────────────────────────────────────────
   معلَم `<nav>` بلا اسم يُعلَن «تنقّل» فقط. وصفحة اللوحة فيها ثلاثة على
   الأقل (القائمة الجانبية، ومسار التنقّل، وهذا) — فثلاثة معالم بالاسم نفسه
   أسوأ من لا معلَم. ولذلك `label` مطلوبة، ويُرمى خطأ في وضع التطوير بدونها.

   ─── لا `tabindex` على الحاوي ─────────────────────────────────────────────
   خلافًا لـ `<ap-table>`: هناك المحتوى **غير قابل للتركيز** فتحتاج منطقة
   التمرير إلى `tabindex` كي يصلها مستخدم لوحة المفاتيح (WCAG 2.1.1). وهنا
   المحتوى روابط، والتنقّل بينها يمرّر الشريط بنفسه. إضافة `tabindex` هنا
   تزيد محطّة فارغة لا أكثر.

   ⚠️ القالب والأنماط في ملفين خارجيين — أي backtick داخل قالب سطري (ولو
      في تعليق) يُغلق النصّ الحرفي. لُدغ المشروع بذلك مرّتين.
   ============================================================================ */

/** `horizontal` شريط فوق المحتوى، `vertical` عمود بجانبه (النمط الغالب في اللوحة). */
export type ApTabNavOrientation = 'horizontal' | 'vertical';

/**
 * `pill` خلفية ممتلئة للنشط — المظهر القائم في اللوحة اليوم.
 * `underline` شريط على حافّة النشط — الاصطلاح الأفقي الشائع.
 */
export type ApTabNavAppearance = 'pill' | 'underline';

@Component({
  selector: 'ap-tab-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './ap-tab-nav.component.html',
  styleUrl: './ap-tab-nav.component.scss',
  host: {
    '[attr.data-orientation]': 'orientationValue()',
    '[attr.data-appearance]': 'appearanceValue()',
  },
})
export class ApTabNavComponent implements OnInit, OnDestroy {
  @ViewChild('nav') private navRef?: ElementRef<HTMLElement>;

  private readonly label$ = signal('');
  private readonly orientation$ = signal<ApTabNavOrientation>('horizontal');
  private readonly appearance$ = signal<ApTabNavAppearance>('pill');

  private detachActiveWatch: (() => void) | null = null;
  private detachDisabledGuard: (() => void) | null = null;

  /**
   * اسم المعلَم. يجيب سؤال «تنقّل بين ماذا؟» — «أقسام المنتج»، «إعدادات
   * الأكاديمية». مطلوب: انظر تعليق الملف.
   */
  @Input()
  set label(value: string) {
    this.label$.set(value ?? '');
  }

  @Input()
  set orientation(value: ApTabNavOrientation) {
    this.orientation$.set(value ?? 'horizontal');
  }

  @Input()
  set appearance(value: ApTabNavAppearance) {
    this.appearance$.set(value ?? 'pill');
  }

  protected readonly labelValue = this.label$.asReadonly();
  protected readonly orientationValue = this.orientation$.asReadonly();
  protected readonly appearanceValue = this.appearance$.asReadonly();

  /*
    `afterNextRender` لا `ngAfterViewInit`: لا يعمل على الخادم إطلاقًا فلا
    يلزم حارس `isPlatformBrowser`، ويقع بعد مرور كشف التغيير لا داخله.
  */
  constructor() {
    afterNextRender(() => {
      this.watchActive();
      this.guardDisabled();
    });
  }

  ngOnInit(): void {
    if (isDevMode() && !this.label$()) {
      throw new Error(
        '[ap-tab-nav] معلَم تنقّل بلا اسم. مرّر label — مثل: label="أقسام المنتج".',
      );
    }
  }

  ngOnDestroy(): void {
    this.detachActiveWatch?.();
    this.detachActiveWatch = null;
    this.detachDisabledGuard?.();
    this.detachDisabledGuard = null;
  }

  /* ─────────────────────────────────────────────────────────────────────
     إحضار الرابط النشط إلى العرض
     ─────────────────────────────────────────────────────────────────────
     شريط أفقي بسبعة أقسام يفيض على الجوّال، والنشط قد يكون خارج الشاشة
     تمامًا عند فتح الصفحة — فيبدو الشريط بلا قسم نشط أصلًا.

     ─── لماذا مراقب طفرات لا استدعاء واحد ─────────────────────────────
     الملاحة بين الأقسام لا تُعيد بناء الشريط: القوالب هي هي، وما يتغيّر
     سمة `aria-current` على رابطين. فمراقبة تلك السمة هي مراقبة الحدث
     نفسه لا انعكاسًا له — ولا تحتاج الاشتراك في `Router` ولا معرفة كيف
     يقرّر كل رابط نشاطه (مسار أو معامل استعلام).

     ⚠️ `nearest` في المحورين: لا يمرّر شيئًا إن كان الرابط ظاهرًا أصلًا،
        فلا يقفز تمرير الصفحة الرأسي عند كل تنقّل.
     ───────────────────────────────────────────────────────────────────── */
  /* ─────────────────────────────────────────────────────────────────────
     حارس الرابط المعطَّل
     ─────────────────────────────────────────────────────────────────────
     ⚠️ الحارس في الحاوي وفي **طور الالتقاط**، لا على الرابط نفسه.

     السبب أن `RouterLink` يسجّل مستمع نقر على العنصر نفسه ويُبحر بلا أن
     يسأل عن `defaultPrevented`. ومستمعان على العنصر نفسه يقعان كلاهما في
     طور الهدف، فيُستدعيان بترتيب التسجيل — وهو ترتيب مطابقة الموجّهات، لا
     ترتيب كتابة السمات. أي أن منع الملاحة من الموجّه يعمل أو لا يعمل بحسب
     تفصيلة لا يتحكّم بها كاتب القالب.

     والحاوي **سلف**، ومستمع الالتقاط عليه يسبق كل مستمعي الهدف يقينًا.

     ويغطّي هذا لوحة المفاتيح كذلك: Enter على رابط يُطلق حدث نقر حقيقيًا.
     ───────────────────────────────────────────────────────────────────── */
  private guardDisabled(): void {
    const box = this.navRef?.nativeElement;
    if (!box) {
      return;
    }

    const block = (event: Event) => {
      const target = event.target as Element | null;
      const link = target?.closest?.('.ap-tab-nav__link[aria-disabled="true"]');
      if (link && box.contains(link)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    box.addEventListener('click', block, { capture: true });
    this.detachDisabledGuard = () => box.removeEventListener('click', block, { capture: true });
  }

  private watchActive(): void {
    const box = this.navRef?.nativeElement;
    const view = box?.ownerDocument?.defaultView;
    if (!box || !view) {
      return;
    }

    const reveal = () => {
      /* لا معنى للإحضار قبل وجود فيض — ولا في الوضع العمودي. */
      if (box.scrollWidth <= box.clientWidth + 1) {
        return;
      }
      box
        .querySelector('[aria-current="page"]')
        ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    };
    reveal();

    const observer =
      typeof view.MutationObserver === 'function' ? new view.MutationObserver(reveal) : null;
    observer?.observe(box, { attributes: true, subtree: true, attributeFilter: ['aria-current'] });

    this.detachActiveWatch = () => observer?.disconnect();
  }
}
