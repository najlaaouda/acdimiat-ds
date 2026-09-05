import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewEncapsulation,
  computed,
  signal,
} from '@angular/core';

import {
  ArabicNounForms,
  getArabicCountedNoun,
} from 'src/app/shared/functions/arabic-count.format';

import { FormsModule } from '@angular/forms';

import { ApFieldComponent } from '../field/ap-field.component';
import { ApSelectComponent, ApSelectOption } from '../select/ap-select.component';

/* ============================================================================
   Acadimiat UI — شريط الترقيم
   ----------------------------------------------------------------------------
   يجيب ثلاثة أسئلة في سطر واحد، وهي ثلاثة لا واحد:

     1. أين أنا من المجموعة كلها؟   «عرض 16–30 من 150 نتيجة»  ← مدى لا رقم صفحة
     2. كيف أنتقل؟                  السابق · أرقام · التالي
     3. كم أرى في الصفحة؟           قائمة الحجم

   والأوّل هو ما تسقطه أغلب التنفيذات، وهو الذي يجيب السؤال الحقيقي: «هل
   تجاوزتُ ما أبحث عنه؟». ورقم الصفحة وحده لا معنى له بلا معرفة حجمها — ولذلك
   يُذكر الاثنان: الأرقام تقول أين أنا بين الصفحات، والمدى يقول أين أنا بين
   العناصر.

   ─── ما رصده الجرد ─────────────────────────────────────────────────────────
   42 استخدامًا لـ `mat-paginator`، كلّها اليوم خارج أي حاوٍ فتختلف مسافتها عن
   الجدول من صفحة لأخرى، ولا واحد منها يعرض مدى العناصر.

   ─── لماذا وسم مخصّص لا سمة على عنصر أصلي ─────────────────────────────────
   القاعدة في هذه المكتبة سمة على عنصر أصلي. والاستثناء هنا هو استثناء
   `<ap-breadcrumbs>` نفسه: المكوّن يملك **البنية** كلها — معلَم `<nav>` واسمه،
   ثم خليّة لكل صفحة، ثم قرار **أيّ** الصفحات تُعرض وأيّها تختفي خلف «…».
   وذلك قرار على بيانات لا على محتوى مُسقَط، فيأخذ أرقامًا ويردّ بنية.

   ⚠️ القالب والأنماط في ملفين خارجيين — أي backtick داخل قالب سطري (ولو في
      تعليق) يُغلق النصّ الحرفي. لُدغ المشروع بذلك مرّتين.
   ============================================================================ */

/**
 * ما يخرج من الشريط عند كل تفاعل.
 *
 * ⚠️ حدث واحد لا حدثان، ولا يُسمّى `pageChange`.
 *
 *    تغيير حجم الصفحة يغيّر **الرقم كذلك** (انظر `changePageSize`)، فحدثان
 *    منفصلان يجعلان المستهلك يستقبل تغييرين لتفاعل واحد ويطلب من الخادم
 *    مرّتين. والاسم `pageChange` بجوار المدخل `page` يوهم بـ `[(page)]`
 *    ثنائي الاتجاه — وحينها يعيد Angular كائنًا إلى مدخل يتوقّع رقمًا.
 */
export interface ApPaginateEvent {
  /** رقم الصفحة الجديد، يبدأ من 1. */
  page: number;
  /** عدد العناصر في الصفحة. */
  pageSize: number;
}

/** خليّة واحدة في صفّ الأرقام. */
interface PageCell {
  key: string;
  kind: 'page' | 'ellipsis';
  page: number;
  current: boolean;
}

/* عدّاد وحدات لا `Math.random`: الخادم والمتصفّح يُصيّران بالترتيب نفسه
   فتتطابق المعرّفات ولا ينكسر الترطيب — القاعدة نفسها في `<ap-field>`. */
let paginationCounter = 0;

@Component({
  selector: 'ap-pagination',
  standalone: true,
  imports: [ApFieldComponent, ApSelectComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './ap-pagination.component.html',
  styleUrl: './ap-pagination.component.scss',
  host: {
    /* ما يسعه أصغرُ صفحة لا يُقسَّم — انظر `unpaged` أدناه. */
    '[attr.data-unpaged]': 'unpaged() ? "true" : null',
  },
})
export class ApPaginationComponent {
  private readonly uid = ++paginationCounter;
  protected readonly summaryId = `ap-pagination-${this.uid}-summary`;

  private readonly page$ = signal(1);
  private readonly pageSize$ = signal(10);
  private readonly total$ = signal(0);
  private readonly pageSizes$ = signal<readonly number[]>([]);
  private readonly label$ = signal('ترقيم الصفحات');
  private readonly itemNoun$ = signal<ArabicNounForms>({
    singular: 'نتيجة',
    dual: 'نتيجتين',
    plural: 'نتائج',
  });

  /** رقم الصفحة الحالية، يبدأ من 1. */
  @Input()
  set page(value: number) {
    this.page$.set(Math.max(1, Math.trunc(Number(value)) || 1));
  }

  /** عدد العناصر في الصفحة الواحدة. */
  @Input()
  set pageSize(value: number) {
    this.pageSize$.set(Math.max(1, Math.trunc(Number(value)) || 1));
  }

  /** إجمالي العناصر عبر الصفحات كلها — لا عدد ما في هذه الصفحة. */
  @Input()
  set total(value: number) {
    this.total$.set(Math.max(0, Math.trunc(Number(value)) || 0));
  }

  /**
   * خيارات حجم الصفحة. مصفوفة فارغة تُخفي القائمة كلّها.
   *
   * وإخفاؤها هو الصواب حين يكون الحجم مفروضًا من الخادم: قائمة بخيار واحد
   * سؤالٌ بلا جواب.
   */
  @Input()
  set pageSizes(value: readonly number[]) {
    this.pageSizes$.set((value ?? []).filter(n => Number(n) > 0));
  }

  /**
   * اسم المعلَم — يصير اسم `<nav>`.
   *
   * صفحة فيها جدولان لها شريطا ترقيم، و«ترقيم الصفحات» مرّتين لا يميّز
   * أحدهما عن الآخر لمن يتنقّل بالمعالم.
   */
  @Input()
  set label(value: string) {
    this.label$.set(value || 'ترقيم الصفحات');
  }

  /**
   * صيغ اسم المعدود في جملة المدى: «عرض 16–30 من 150 عميل».
   *
   * ⚠️ ثلاث صيغ لا كلمة واحدة: تمييز العدد في العربية يتغيّر بالعدد، وكلمة
   *    واحدة تُنتج «3 نتيجة». وهو المشترك نفسه الذي يستهلكه عدّاد
   *    `<ap-table>` — القاعدة واحدة فلا تُكتب مرّتين.
   */
  @Input()
  set itemNoun(value: ArabicNounForms | null) {
    if (value) {
      this.itemNoun$.set(value);
    }
  }

  /** يخرج مرّة واحدة لكل تفاعل، بالرقم والحجم معًا. */
  @Output() readonly paginate = new EventEmitter<ApPaginateEvent>();

  protected readonly labelValue = this.label$.asReadonly();
  protected readonly totalValue = this.total$.asReadonly();
  protected readonly pageSizeValue = this.pageSize$.asReadonly();
  protected readonly pageSizesValue = this.pageSizes$.asReadonly();

  /**
   * خيارات القائمة المرسومة — القيمة رقم والتسمية جملة.
   *
   * «10 لكل صفحة» لا «10» مجرَّدًا: رقمٌ وحده في لائحة فوق جدول لا يقول أهو
   * حجم صفحة أم رقمها أم عدد النتائج. والتسمية تحمل معناها معها، فتُقرأ في
   * الزنّاد وفي اللائحة سواء.
   */
  protected readonly pageSizeOptions = computed<ApSelectOption[]>(() =>
    this.pageSizes$().map(size => ({ value: size, label: size + ' لكل صفحة' })),
  );

  /* ─────────────────────────────────────────────────────────────────────
     متى يغيب الشريط أصلًا
     ─────────────────────────────────────────────────────────────────────
     يغيب متى وسِع **أصغرُ حجم صفحة متاح** الصفوفَ كلَّها: لا ترتيب أوراق
     ممكن أصلًا، فالشريط حينها ثلاثة أسئلة لا واحد منها له جواب — «أين أنا من
     المجموعة؟» والمجموعة كلّها على الشاشة، و«كيف أنتقل؟» ولا وجهة، و«كم أرى
     في الصفحة؟» ولا خيار يغيّر شيئًا.

     ⚠️ والحدّ **أصغر الخيارات** لا حجم الصفحة الحالي، وهذا هو الفرق الذي
        يمنع فخًّا: لو كان الشرط «صفحة واحدة» لاختفى الشريط متى اختار
        المستخدم «100 لكل صفحة» على جدول من خمسين صفًّا — ومعه تختفي قائمةُ
        الحجم نفسها، فلا طريق للعودة إلى عشرة. وبالحدّ الأصغر يبقى الشريط
        ظاهرًا في تلك الحالة، ولا يغيب إلّا حيث لا اختيار يفيد.

     ⚠️ وهو يشمل الصفر: الجدول يقول «لا توجد نتائج» بحالته الفارغة، وشريطٌ
        فوقها أثاثٌ يشغل مساحة. (كان هذا وحده شرط الإخفاء قبل هذا القرار.)

     ⚠️ والإخفاء هنا لا عند المستهلك: القرار يخصّ المكوّن — يقرأ `total`
        و`pageSizes` ويعرف وحده أن لا شيء يُقسَّم. وشرطٌ يُكتب في كل قالب
        يُنسى في أوّل جدول جديد.
     ───────────────────────────────────────────────────────────────────── */
  private readonly smallestPageSize = computed(() => {
    const sizes = this.pageSizes$();
    /* بلا قائمة خيارات فالحجم مفروض، وهو أصغر ما يُمكن. */
    return sizes.length ? Math.min(...sizes) : this.pageSize$();
  });

  protected readonly unpaged = computed(() => this.total$() <= this.smallestPageSize());

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.total$() / this.pageSize$())),
  );

  /* الرقم المعروض مقيَّد دائمًا: مستهلك يمرّر 9 بعد تصفية هبطت بالنتائج إلى
     صفحتين يجب أن يرى 2، لا صفحةً فارغةً برقم لا وجود له. */
  protected readonly currentPage = computed(() =>
    Math.min(this.page$(), this.pageCount()),
  );

  protected readonly isFirst = computed(() => this.currentPage() <= 1);
  protected readonly isLast = computed(() => this.currentPage() >= this.pageCount());

  /* ─────────────────────────────────────────────────────────────────────
     المدى المعروض
     ───────────────────────────────────────────────────────────────────── */
  protected readonly rangeFrom = computed(() =>
    this.total$() === 0 ? 0 : (this.currentPage() - 1) * this.pageSize$() + 1,
  );

  /* الحدّ الأعلى مقصوص على الإجمالي: الصفحة الأخيرة ناقصة غالبًا، و«141–150»
     على مجموعة من 147 عنصرًا وعدٌ بثلاثة لا وجود لها. */
  protected readonly rangeTo = computed(() =>
    Math.min(this.currentPage() * this.pageSize$(), this.total$()),
  );

  protected readonly countedNoun = computed(() =>
    getArabicCountedNoun(this.total$(), this.itemNoun$()),
  );

  /* ─────────────────────────────────────────────────────────────────────
     صفّ الأرقام
     ─────────────────────────────────────────────────────────────────────
     ⚠️ عدد الخلايا **ثابت** عند سبع متى تجاوزت الصفحات سبعًا — لا يتغيّر مع
        الانتقال. وهذا ليس تجميلًا: من ينقر «التالي» مرّات متتابعة يجد الصفّ
        يطول ويقصر تحت مؤشّره، فيزحف الزرّ من مكانه وتقع النقرة التالية على
        رقم صفحة. والثبات هو ما يجعل النقر المتكرّر ممكنًا أصلًا.

        الجوار = 1 والطرف = 1، فالمجموع = 1 + 1 + 3 + 1 + 1 = 7: صفحة أولى،
        وحذف، وثلاث حول الحالية، وحذف، وصفحة أخيرة.

        وعند الطرفين يُمدّ الشوط بدل الحذف كي يبقى المجموع سبعًا:
          الحالية ≤ 4          ⇐ 1 2 3 4 5 … ق
          الحالية ≥ ق-3        ⇐ 1 … ق-4 ق-3 ق-2 ق-1 ق
          غير ذلك              ⇐ 1 … ح-1 ح ح+1 … ق
     ───────────────────────────────────────────────────────────────────── */
  protected readonly cells = computed<PageCell[]>(() => {
    const count = this.pageCount();
    const current = this.currentPage();

    const cell = (page: number): PageCell => ({
      key: `page-${page}`,
      kind: 'page',
      page,
      current: page === current,
    });
    const gap = (id: string): PageCell => ({
      key: `gap-${id}`,
      kind: 'ellipsis',
      page: 0,
      current: false,
    });
    const range = (from: number, to: number) =>
      Array.from({ length: to - from + 1 }, (_, i) => cell(from + i));

    /* سبع صفحات أو أقلّ ⇐ تُعرض كلها. لا حذف يظهر ويختفي، فلا ثبات مطلوب. */
    if (count <= 7) {
      return range(1, count);
    }

    if (current <= 4) {
      return [...range(1, 5), gap('end'), cell(count)];
    }

    if (current >= count - 3) {
      return [cell(1), gap('start'), ...range(count - 4, count)];
    }

    return [
      cell(1),
      gap('start'),
      ...range(current - 1, current + 1),
      gap('end'),
      cell(count),
    ];
  });

  /* ─────────────────────────────────────────────────────────────────────
     الأفعال
     ───────────────────────────────────────────────────────────────────── */

  protected goTo(page: number): void {
    const next = Math.min(Math.max(1, page), this.pageCount());
    /* النقر على الصفحة الحالية لا يُخرج شيئًا: طلبُ شبكةٍ يعيد ما هو معروض. */
    if (next === this.currentPage()) {
      return;
    }
    this.paginate.emit({ page: next, pageSize: this.pageSize$() });
  }

  /* السهمان يحملان `aria-disabled` لا `disabled`، فيصلان إلى هنا عند الطرف —
     والحارس هنا هو ما يجعلهما بلا أثر. انظر تعليق القالب. */
  protected previous(): void {
    if (this.isFirst()) {
      return;
    }
    this.goTo(this.currentPage() - 1);
  }

  protected next(): void {
    if (this.isLast()) {
      return;
    }
    this.goTo(this.currentPage() + 1);
  }

  /**
   * تغيير حجم الصفحة **يحفظ الموضع** ولا يعيد إلى الأولى.
   *
   * من يقف على العناصر 100–115 ثم يختار 50 لكل صفحة يريد أن يرى العنصر 100
   * لا العنصر 1. فالصفحة الجديدة هي التي تحوي أوّل عنصر معروض الآن. والعودة
   * إلى الأولى تُلقي به إلى بداية قائمة قطع نصفها للتوّ.
   */
  protected changePageSize(raw: unknown): void {
    const size = Math.max(1, Math.trunc(Number(raw)) || 1);
    if (size === this.pageSize$()) {
      return;
    }
    const firstItem = this.rangeFrom();
    const page = firstItem === 0 ? 1 : Math.floor((firstItem - 1) / size) + 1;
    this.paginate.emit({ page, pageSize: size });
  }
}
