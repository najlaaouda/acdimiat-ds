import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
  ViewEncapsulation,
  afterNextRender,
  computed,
  signal,
} from '@angular/core';

import {
  ArabicNounForms,
  getArabicCountedNoun,
} from 'src/app/shared/functions/arabic-count.format';

/* ============================================================================
   Acadimiat UI — حاوي الجدول
   ----------------------------------------------------------------------------
   ─── ما رصده الجرد ─────────────────────────────────────────────────────────
   ستّة أنظمة جداول متعايشة: `mat-table` (249 `matColumnDef`)، وجدول Bootstrap
   الخام (36 ملفًا)، وثلاثة تنفيذات يدوية، وجدول مبنيّ من شبكة CSS على `<div>`
   بلا أي دور دلالي — أي غير مرئي لقارئ الشاشة أصلًا. ومعها:

     • 84 حاوي تمرير أفقي، ولا واحد منها قابل للتمرير بلوحة المفاتيح.
     • 115 رأس فرز، وصفر `aria-sort`.
     • خمسة ملفات فقط فيها `scope="col"`، وصفر `<caption>` في المشروع كلّه.
     • صفر هيكل تحميل: النمط القائم يُخفي الجدول كلّه فيقفز التخطيط.

   ─── لماذا حاوٍ مستقلّ عن الجدول ───────────────────────────────────────────
   ليس تجميلًا. منطقة تمرير أفقي يجب أن تكون **قابلة للتركيز** كي يمرّرها
   مستخدم لوحة المفاتيح (WCAG 2.1.1) وأن تُعلَن كمنطقة باسم. وهذا يستلزم
   عنصرًا حول الجدول يحمل `tabindex` و`role="region"` — ولا يمكن أن يكون
   الجدول نفسه.

   ويحمل الحاوي كذلك السطح والحدّ ونصف القطر. وهذا ليس اختيارًا:
   `panel-style.css` يضع حدًّا ونصف قطر على `table` **وعلى** `.table-responsive`
   معًا، فيظهر حدّان متداخلان حول كل جدول في التطبيق. الحدّ على الحاوي وحده،
   والقصّ بـ `overflow: hidden` هو ما يجعل خلفية الرأس تتبع نصف القطر.

   ─── التقسيم بين الحاوي والجدول ────────────────────────────────────────────
       <ap-table>        السطح، التمرير، منطقة مُعلَنة، الرأس اللاصق، الحالات
       <table apTable>   الصفوف والخلايا والرأس

   والسمة `apTable` ليست موجّهًا: أنماطها تعيش في ورقة هذا المكوّن — القاعدة
   نفسها التي تحكم `[apInput]` في `<ap-field>`. فاستعمالها يستلزم استيراد
   حاويها، ولا مسار يُنتج جدولًا بأنماط نصف مُحمَّلة.

   ⚠️ وهي **اختيارية داخل `<ap-table>`**: الورقة تُنسّق `ap-table table` كذلك.
      وهذا متعمّد ويخدم الترحيل: `<table mat-table>` داخل `<ap-table>` يأخذ
      المظهر الجديد بلا لمس صفٍّ واحد من منطق بياناته — وهو ما تطلبه خارطة
      الطريق: استبدال العرض مع إبقاء `cdk/table` طبقةً للبيانات.

   ⚠️ القالب والأنماط في ملفين خارجيين لا سطريَّين — أي backtick داخل قالب
      سطري (ولو في تعليق) يُغلق النصّ الحرفي. لُدغ المشروع بذلك مرّتين.
   ============================================================================ */

export type ApTableDensity = 'md' | 'sm';

/*
  عدّاد وحدات لا `Math.random`: الخادم والمتصفّح يُصيّران بالترتيب نفسه
  فتتطابق المعرّفات ولا ينكسر الترطيب — القاعدة نفسها في `<ap-field>`.
*/
let tableCounter = 0;

@Component({
  selector: 'ap-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './ap-table.component.html',
  styleUrl: './ap-table.component.scss',
  host: {
    '[attr.data-density]': 'densityValue()',
    '[attr.data-sticky]': 'stickyValue() ? "true" : null',
    '[attr.data-zebra]': 'zebraValue() ? "true" : null',
    /* يقود ظهور فاصل الأعمدة المثبَّتة: بلا تمرير لا شيء يمرّ خلفها
       فالفاصل حينها خطّ بلا معنى. */
    '[attr.data-scrolled]': 'scrolledValue() ? "true" : null',
    '[attr.data-scrolled-end]': 'scrolledEndValue() ? "true" : null',
    /* يكتب الـ token محلّيًا على هذا الجدول وحده — لا على الطبقة كلها. */
    '[style.--ap-table-min-width]': 'minWidthValue()',
    '[attr.data-state]': 'stateValue()',
    /* قارئ الشاشة يُعلن انشغال الجدول بدل صمت أثناء الانتظار. */
    '[attr.aria-busy]': 'loadingValue() ? "true" : null',
  },
})
export class ApTableComponent implements OnDestroy {
  @ViewChild('scroll') private scrollRef?: ElementRef<HTMLElement>;

  private readonly uid = ++tableCounter;
  protected readonly captionId = `ap-table-${this.uid}-caption`;

  private readonly caption$ = signal('');
  private readonly label$ = signal('');
  private readonly density$ = signal<ApTableDensity>('md');
  private readonly sticky$ = signal(false);
  private readonly zebra$ = signal(false);
  private readonly minWidth$ = signal<string | null>(null);
  private readonly selectedCount$ = signal(0);
  private readonly totalCount$ = signal(0);
  private readonly itemNoun$ = signal<ArabicNounForms | null>(null);
  private readonly loading$ = signal(false);
  private readonly empty$ = signal(false);
  private readonly skeletonRows$ = signal(5);
  private readonly skeletonColumns$ = signal(4);
  /** هل تفيض المنطقة أفقيًا فعلًا؟ يُقاس، ولا يُفترض. */
  private readonly scrollable$ = signal(false);
  /** هل أُزيح التمرير الأفقي عن بدايته؟ */
  private readonly scrolled$ = signal(false);
  /** ما زال هناك ما ينزلق تحت عمود النهاية. */
  private readonly scrolledEnd$ = signal(false);

  private detachOverflowWatch: (() => void) | null = null;
  private detachPinning: (() => void) | null = null;

  /**
   * وصف الجدول. يُعرض فوقه ويُربط بالمنطقة عبر `aria-labelledby`.
   *
   * الجرد وجد صفر `<caption>` في المشروع كلّه — وهو العنصر الذي يجيب سؤال
   * «جدول ماذا؟» لمن يصل إليه بقارئ الشاشة بلا رؤية ما حوله في الصفحة.
   */
  @Input()
  set caption(value: string) {
    this.caption$.set(value ?? '');
  }

  /** اسم المنطقة حين لا يُراد عرض تعليق مرئي. يُتجاهل إن وُجد `caption`. */
  @Input()
  set label(value: string) {
    this.label$.set(value ?? '');
  }

  /** `sm` تضغط الحشوة الرأسية إلى 8px — لجداول الإدارة الطويلة. */
  @Input()
  set density(value: ApTableDensity) {
    this.density$.set(value ?? 'md');
  }

  /**
   * يثبّت صفّ الرأس عند التمرير الرأسي.
   *
   * ⚠️ لا أثر له ما لم يكن للحاوي ارتفاع محدود (`max-height` مثلًا) أو يكن
   *    التمرير في الصفحة نفسها: اللصق نسبةً إلى أقرب حاوي تمرير.
   */
  @Input()
  set sticky(value: boolean) {
    this.sticky$.set(!!value);
  }

  /**
   * أضيق عرض يُقرأ به هذا الجدول قبل أن يبدأ التمرير الأفقي.
   *
   * الافتراضي (560px) يناسب أربعة أعمدة أو خمسة. وجدول بسبعة أعمدة
   * دونه لا يمرّر بل **ينسحق**: يضغط المتصفّح أضيق عمود حتى يلفّ
   * محتواه — فيصير التاريخ ثلاثة أسطر. رُصد هذا في اللقطة.
   *
   * ⚠️ قدّرها من مجموع أضيق عرض مقبول لكل عمود، لا من عرض الشاشة:
   *    القيمة أرضية للمحتوى، والشاشة هي التي تقرّر متى يبدأ التمرير.
   */
  @Input()
  set minWidth(value: string) {
    this.minWidth$.set(value || null);
  }

  /**
   * عدد الصفوف المحدَّدة. متى تجاوز صفرًا ظهر شريط الإجراءات الجماعية.
   *
   * ⚠️ العدد من المستهلك لا من المكوّن: التحديد قد يمتدّ عبر الصفحات
   *    («3 من 200»)، والمكوّن لا يرى إلّا صفوف صفحته.
   */
  @Input()
  set selectedCount(value: number) {
    this.selectedCount$.set(Math.max(0, Number(value) || 0));
  }

  /** الإجمالي عبر الصفحات كلها. صفر يُخفي جزء «من N». */
  @Input()
  set totalCount(value: number) {
    this.totalCount$.set(Math.max(0, Number(value) || 0));
  }

  /**
   * صيغ اسم الصفّ المعدود في العدّاد: «تم تحديد 10 من 48 عميل».
   *
   * ⚠️ الصيغ من المستهلك لا من المكوّن، لأن الاسم يتبع **الشاشة**: الجدول
   *    نفسه يعدّ «عملاء» في تبويب و«مشرفين» في آخر.
   *
   * ⚠️ وهي صيغ لا كلمة واحدة: تمييز العدد في العربية يتغيّر بالعدد
   *    (‎getArabicCountedNoun‎ المشترك)، وكلمة واحدة تُنتج «3 عميل».
   *
   * وبتركها فارغة يبقى العدّاد بلا اسم: «تم تحديد 10 من 48».
   */
  @Input()
  set itemNoun(value: ArabicNounForms | null) {
    this.itemNoun$.set(value ?? null);
  }

  /**
   * تظليل الصفوف بالتناوب.
   *
   * ⚠️ اختياري وليس افتراضيًا: يساعد على تتبّع الصفّ في جدول **عريض**
   *    كثير الأعمدة، ويُشوّش الجدول الضيّق بضجيج بصري بلا مقابل. الجرد
   *    وجده في تنفيذين فقط، وبجواره كلاس `.cellbgwt` (9 استخدامات) لا
   *    وظيفة له إلا **إلغاؤه** — أي أنه فُرض حيث لا يُراد.
   */
  @Input()
  set zebra(value: boolean) {
    this.zebra$.set(!!value);
  }

  /**
   * يستبدل الجدول بهيكل تحميل **بالأبعاد نفسها**.
   *
   * النمط القائم في المشروع يُخفي الجدول كلّه خلف `@if (!loading)`، فتنهار
   * الصفحة إلى ارتفاع صفر ثم تقفز عند وصول البيانات. الهيكل يحجز المساحة.
   */
  @Input()
  set loading(value: boolean) {
    this.loading$.set(!!value);
  }

  /** يعرض المنفذ `apTableEmpty` بدل الجدول. */
  @Input()
  set empty(value: boolean) {
    this.empty$.set(!!value);
  }

  /** عدد صفوف الهيكل — اجعله قريبًا من عدد الصفوف المتوقّع. */
  @Input()
  set skeletonRows(value: number) {
    this.skeletonRows$.set(Math.max(1, Number(value) || 1));
  }

  @Input()
  set skeletonColumns(value: number) {
    this.skeletonColumns$.set(Math.max(1, Number(value) || 1));
  }

  protected readonly captionValue = this.caption$.asReadonly();
  protected readonly densityValue = this.density$.asReadonly();
  protected readonly stickyValue = this.sticky$.asReadonly();
  protected readonly zebraValue = this.zebra$.asReadonly();
  protected readonly minWidthValue = this.minWidth$.asReadonly();
  protected readonly selectedCountValue = this.selectedCount$.asReadonly();
  protected readonly totalCountValue = this.totalCount$.asReadonly();
  protected readonly hasSelection = computed(() => this.selectedCount$() > 0);

  /*
    التمييز يتبع العدد الذي يليه في الجملة لا عدد التحديد: «تم تحديد 3 من 48
    عميل» — الاسم بعد 48. فإن غاب الإجمالي صارت الجملة «تم تحديد 3 عملاء»
    ولحق الاسم بعدد التحديد.
  */
  protected readonly countedNoun = computed(() => {
    const forms = this.itemNoun$();
    if (!forms) {
      return '';
    }
    return getArabicCountedNoun(this.totalCount$() || this.selectedCount$(), forms);
  });
  protected readonly loadingValue = this.loading$.asReadonly();
  protected readonly emptyValue = this.empty$.asReadonly();

  /* الحالة الظاهرة واحدة لا ثلاث رايات: التحميل يسبق الفراغ — جدول قيد
     التحميل ليس فارغًا، وعرض «لا توجد نتائج» أثناء الانتظار كذبة قصيرة. */
  protected readonly stateValue = computed(() =>
    this.loading$() ? 'loading' : this.empty$() ? 'empty' : 'ready',
  );

  protected readonly skeletonRowList = computed(() =>
    Array.from({ length: this.skeletonRows$() }, (_, i) => i),
  );

  protected readonly skeletonColumnList = computed(() =>
    Array.from({ length: this.skeletonColumns$() }, (_, i) => i),
  );

  protected readonly regionLabel = computed(() => this.label$() || this.caption$() || null);

  /*
    ── المنطقة قابلة للتركيز حين تمرّ فعلًا، لا دائمًا ────────────────────

    `tabindex="0"` على منطقة لا تمرّ يضيف محطّة فارغة في ترتيب التنقّل عند
    كل جدول في الصفحة. وغيابه عن منطقة **تمرّ** يحبس محتواها عن مستخدم لوحة
    المفاتيح تمامًا (WCAG 2.1.1) — وهو حال 84 حاوي تمرير في المشروع اليوم.

    ولذلك يُقاس الفيض ولا يُفترض: العرض المتاح يتغيّر مع الشاشة، وعدد الأعمدة
    يتغيّر مع البيانات. والقياس نفسه يقود `role="region"`: منطقة مُعلَنة بلا
    محتوى قابل للتمرير ضجيج في شجرة إمكانية الوصول.
  */
  protected readonly scrollableValue = this.scrollable$.asReadonly();
  protected readonly scrolledValue = this.scrolled$.asReadonly();
  protected readonly scrolledEndValue = this.scrolledEnd$.asReadonly();

  /*
    `afterNextRender` لا `ngAfterViewInit`: الأوّل لا يعمل على الخادم إطلاقًا
    (فلا يلزم حارس `isPlatformBrowser`)، وهو يقع **بعد** مرور كشف التغيير
    لا داخله — فكتابة إشارة يقرؤها القالب لا تصطدم بفحص «تغيّر بعد الفحص».
  */
  constructor() {
    afterNextRender(() => {
      this.watchOverflow();
      this.watchPinning();
    });
  }

  ngOnDestroy(): void {
    this.detachOverflowWatch?.();
    this.detachOverflowWatch = null;
    this.detachPinning?.();
    this.detachPinning = null;
  }

  private watchOverflow(): void {
    const box = this.scrollRef?.nativeElement;
    const view = box?.ownerDocument?.defaultView;
    if (!box || !view) {
      return;
    }

    const measure = () => this.scrollable$.set(box.scrollWidth > box.clientWidth + 1);
    measure();

    /* `ResizeObserver` على الصندوق **وعلى الجدول** معًا: الأوّل يلتقط تغيّر
       الشاشة، والثاني يلتقط تغيّر البيانات — عمود أُضيف أو نصّ طال. مراقبة
       الصندوق وحده تفوت الثاني لأن عرضه لا يتغيّر. */
    const observer =
      typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(measure) : null;
    observer?.observe(box);
    const inner = box.firstElementChild;
    if (inner) {
      observer?.observe(inner);
    }

    view.addEventListener('resize', measure);
    this.detachOverflowWatch = () => {
      observer?.disconnect();
      view.removeEventListener('resize', measure);
    };
  }

  /* ─────────────────────────────────────────────────────────────────────
     الأعمدة المثبَّتة
     ─────────────────────────────────────────────────────────────────────
     المطلوب: يبقى الشيك بوكس وعمود الاسم ثابتين بينما تنزلق بقيّة الأعمدة
     تحتهما — فيُقرأ الصفّ ويُعرف صاحبه مهما بَعُد العمود المقروء.

     ─── لماذا سمة على الخليّة لا عدد على الحاوي ───────────────────────
     عمود الشيك بوكس **شرطي**: يظهر في الجدول القابل للتحديد ويغيب في
     غيره. فـ «ثبّت أوّل عمودين» يثبّت العمود الخطأ في نصف الحالات —
     الاسم والدورة بدل الشيك بوكس والاسم. والسمة تقول أيّ عمود بعينه.

     ─── ولماذا تُعلَن على `th` وحده ───────────────────────────────────
     العمود وحدة واحدة، والإعلان عليه مرّة أصدق من تكراره في كل صفّ —
     وأقلّ عرضةً لصفٍّ يُنسى فينكسر العمود عند التمرير. المكوّن ينشر السمة
     على خلايا الجسم بنفسه.

     ⚠️ الإزاحات محسوبة لا مكتوبة: عرض عمود الاسم يتغيّر مع المحتوى ومع
        الشاشة، وأي قيمة ثابتة تترك فجوة أو تُخفي جزءًا من العمود التالي.

     ⚠️ حدّ معروف: يفترض أن كل صفّ يملك الخلايا نفسها بالترتيب نفسه —
        أي لا `colspan` في الأعمدة المثبَّتة. صفّ «لا نتائج» بخليّة واحدة
        ممتدّة يُتخطّى بأمان لأن الفهرس لا يوجد فيه.
     ───────────────────────────────────────────────────────────────────── */

  private watchPinning(): void {
    const box = this.scrollRef?.nativeElement;
    const view = box?.ownerDocument?.defaultView;
    if (!box || !view) {
      return;
    }

    const apply = () => this.applyPinning(box);
    apply();

    /*
      `scrollLeft` سالب في RTL في المحرّكات الحديثة، وموجب في LTR.
      القيمة المطلقة تُسوّي الاتجاهين بقاعدة واحدة بدل فرعٍ لكل اتجاه.
    */
    const onScroll = () => {
      this.scrolled$.set(Math.abs(box.scrollLeft) > 1);
      /* بلغ النهاية ⇐ لا شيء ينزلق تحت عمود النهاية، فيسقط فاصله. */
      const max = box.scrollWidth - box.clientWidth;
      this.scrolledEnd$.set(max > 1 && Math.abs(box.scrollLeft) < max - 1);
    };
    box.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* تغيّر الحجم يغيّر عرض العمود المثبَّت، وتغيّر الصفوف يضيف خلايا لم
       تُنشر عليها السمة بعد. الاثنان يعيدان الحساب. */
    const resize =
      typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(apply) : null;
    resize?.observe(box);

    const mutation =
      typeof view.MutationObserver === 'function' ? new view.MutationObserver(apply) : null;
    mutation?.observe(box, { childList: true, subtree: true });

    this.detachPinning = () => {
      box.removeEventListener('scroll', onScroll);
      resize?.disconnect();
      mutation?.disconnect();
    };
  }

  private applyPinning(box: HTMLElement): void {
    const table = box.querySelector('table');
    const headRow = table?.querySelector('thead tr');
    if (!table || !headRow) {
      return;
    }

    const headCells = Array.from(headRow.children) as HTMLElement[];
    const pinnedIndexes = headCells.reduce<number[]>((acc, cell, index) => {
      if (cell.dataset['pinned'] === 'true') {
        acc.push(index);
      }
      return acc;
    }, []);

    if (!pinnedIndexes.length) {
      return;
    }

    /* الإزاحة التراكمية: أوّل عمود مثبَّت عند 0، والذي يليه بعرض ما قبله. */
    let offset = 0;
    const offsets = pinnedIndexes.map(index => {
      const current = offset;
      offset += headCells[index].getBoundingClientRect().width;
      return current;
    });

    /*
      عمود النهاية (الإجراءات) يُثبَّت من الجهة المقابلة.

      وهو ليس ترفًا: زرّ النقاط في آخر الصفّ، وبلا تثبيته يختفي خارج الشاشة
      في أي جدول عريض — فيضطرّ المستخدم إلى التمرير أفقيًا قبل أن يستطيع
      فتح قائمة الصفّ، وهو ما رُصد في اللقطة الأولى.
    */
    const endIndexes = headCells.reduce<number[]>((acc, cell, index) => {
      if (cell.dataset['pinnedEnd'] === 'true') {
        acc.push(index);
      }
      return acc;
    }, []);

    let endOffset = 0;
    const endOffsets = [...endIndexes].reverse().map(index => {
      const current = endOffset;
      endOffset += headCells[index].getBoundingClientRect().width;
      return current;
    });
    endOffsets.reverse();

    for (const row of Array.from(table.querySelectorAll('tr'))) {
      endIndexes.forEach((columnIndex, order) => {
        const cell = row.children[columnIndex] as HTMLElement | undefined;
        if (!cell) {
          return;
        }
        cell.dataset['pinnedEnd'] = 'true';
        cell.dataset['pinnedEndEdge'] = order === 0 ? 'true' : 'false';
        cell.style.insetInlineEnd = endOffsets[order] + 'px';
      });

      pinnedIndexes.forEach((columnIndex, order) => {
        const cell = row.children[columnIndex] as HTMLElement | undefined;
        if (!cell) {
          return;
        }
        cell.dataset['pinned'] = 'true';
        /* الأخير يحمل الفاصل — وهو الحدّ الفاصل بين الثابت والمنزلق. */
        cell.dataset['pinnedEdge'] = order === pinnedIndexes.length - 1 ? 'true' : 'false';
        cell.style.insetInlineStart = offsets[order] + 'px';
      });
    }
  }
}
