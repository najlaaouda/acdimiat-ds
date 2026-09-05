import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewEncapsulation,
  computed,
  isDevMode,
  signal,
} from '@angular/core';

/* ============================================================================
   Acadimiat UI — رأس عمود قابل للفرز
   ----------------------------------------------------------------------------
   ─── المشكلة التي يحلّها ───────────────────────────────────────────────────
   الجرد رصد 115 `mat-sort-header` في 31 ملفًا، وصفر `aria-sort` في المشروع
   كلّه. أي أن الفرز — وهو أهمّ تفاعل في جدول بيانات — غير موجود إطلاقًا
   بالنسبة لقارئ الشاشة: العمود لا يُعلن أنه قابل للفرز، ولا يُعلن اتجاهه
   بعد النقر، ولا يُعلن أن الترتيب تغيّر.

   ─── لماذا مكوّن على `th` لا موجّه ─────────────────────────────────────────
   الرأس القابل للفرز يحتاج **زرًّا** حقيقيًا داخل الخلية ومؤشّر اتجاه بجواره،
   وكلاهما بنية يجب أن يرسمها المكوّن. والموجّه لا قالب له.

   والزرّ داخل `<th>` لا `<th>` نفسه: خلية الرأس ليست عنصر تحكّم — لا تدخل
   ترتيب التنقّل، ولا تستجيب لمسافة أو Enter، ولا تُعلن دورًا قابلًا للتفعيل.
   وضع `(click)` عليها يُنتج فرزًا يعمل بالفأرة وحدها، وهو حال التنفيذ القائم.

   ─── الدورة ───────────────────────────────────────────────────────────────
   صاعد ← نازل ← بلا فرز. الثالثة ليست ترفًا: بلا عودة إلى الترتيب الأصلي
   يصير النقر بابًا ذا اتجاه واحد — يستحيل على المستخدم استعادة الترتيب الذي
   جاءت به البيانات، وهو غالبًا الترتيب ذو المعنى (الأحدث أولًا).

   ⚠️ هذا المكوّن يعلن الحالة ويطلق الحدث فقط — لا يفرز شيئًا. الفرز يبقى
      حيث هو: `MatSort` أو منطق المستهلك. استبدال العرض مع إبقاء طبقة
      البيانات، تمامًا كما تطلب خارطة الطريق.

   ⚠️ أنماطه تعيش في `ap-table.component.scss` مع بقيّة أنماط الجدول — القاعدة
      نفسها التي تحكم `[apInput]` في `<ap-field>`: استعماله يستلزم استيراد
      `ApTableComponent`، ولا مسار يُنتج رأسًا بأنماط نصف مُحمَّلة.
   ============================================================================ */

export type ApSortDirection = 'asc' | 'desc' | '';

export interface ApSortChange {
  /** معرّف العمود كما مُرِّر في `apTableSort`. */
  column: string;
  direction: ApSortDirection;
}

@Component({
  selector: 'th[apTableSort]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    /*
      `aria-sort` على `<th>` نفسه لا على الزرّ — المواصفة تربطها بخلية الرأس،
      وقارئ الشاشة يقرؤها عند دخول أي خليّة في العمود.

      و`none` تُكتب صراحةً ولا تُحذف: غيابها يعني «هذا العمود غير قابل للفرز»،
      ووجودها بقيمة `none` يعني «قابل للفرز وغير مفروز الآن» — وهو الفرق الذي
      يجعل المستخدم يعرف أن هنا شيئًا يمكن النقر عليه.
    */
    '[attr.aria-sort]': 'ariaSort()',
    '[attr.data-sorted]': 'isSorted() ? directionValue() : null',
  },
  /*
    ⚠️ صفر مسافة بيضاء حول محتوى الزرّ غير مقصود هنا — النصّ يحمل معناه.
       لكن لا backtick داخل هذا القالب ولا في تعليقاته: يُغلق النصّ الحرفي.
  */
  template: `
    <button
      type="button"
      class="ap-table__sort"
      [attr.aria-label]="buttonLabel()"
      (click)="toggle()"
    >
      <span class="ap-table__sort-label"><ng-content /></span>
      <!--
        المؤشّر مرسوم دائمًا: باهتًا حين لا فرز فيُعلن أن العمود قابل للفرز
        قبل النقر عليه، وبسهم واحد صريح حين يُفرز. والسهمان المتقابلان
        (النمط الشائع) يعرضان اتجاهين في وقت واحد فيقرأ المستخدم اثنين ليعرف
        واحدًا.
      -->
      <svg class="ap-table__sort-icon" viewBox="0 0 24 24" aria-hidden="true">
        @if (directionValue() === 'desc') {
          <path d="M12 5v14" />
          <path d="m19 12-7 7-7-7" />
        } @else {
          <path d="M12 19V5" />
          <path d="m5 12 7-7 7 7" />
        }
      </svg>
    </button>
  `,
})
export class ApTableSortComponent implements OnInit, AfterContentInit {
  constructor(private readonly host: ElementRef<HTMLElement>) {}

  private readonly column$ = signal('');
  private readonly direction$ = signal<ApSortDirection>('');

  /**
   * معرّف العمود. يُمرَّر في `(sortChange)` كي يعرف المستهلك أيّ عمود تغيّر.
   *
   * ⚠️ `@Input()` عادي لا `{ required: true }`: الأخيرة تُبطل أي NgModule
   *    يستورد المكوّن، والخطأ يظهر NG2012 في ملف **آخر** لا هنا. الشرط
   *    يُفرض في `ngOnInit` برسالة عربية تقول ما الناقص — وهو الاصطلاح نفسه
   *    في `<ap-page-header heading>` و`<ap-tab-nav label>`.
   */
  @Input()
  set apTableSort(value: string) {
    this.column$.set(value ?? '');
  }

  /**
   * اتجاه الفرز الحالي. **مُتحكَّم به من الخارج**: هذا المكوّن يعرض ما يُعطى
   * ولا يحتفظ بحقيقة خاصّة به — فلا يمكن أن يظهر عمودان مفروزَين معًا.
   */
  @Input()
  set direction(value: ApSortDirection) {
    this.direction$.set(value ?? '');
  }

  /** اسم العمود المقروء، لبناء اسم الزرّ. يُشتقّ من النصّ إن لم يُمرَّر. */
  @Input()
  set columnLabel(value: string) {
    this.columnLabel$.set(value ?? '');
  }

  private readonly columnLabel$ = signal('');

  @Output() readonly sortChange = new EventEmitter<ApSortChange>();

  protected readonly directionValue = this.direction$.asReadonly();
  protected readonly isSorted = computed(() => this.direction$() !== '');

  protected readonly ariaSort = computed(() => {
    const d = this.direction$();
    return d === 'asc' ? 'ascending' : d === 'desc' ? 'descending' : 'none';
  });

  /*
    اسم الزرّ يقول **ما سيحدث**، لا ما هو حادث الآن.

    الحالة الراهنة يقرؤها `aria-sort` على الخلية أصلًا، فتكرارها في اسم الزرّ
    إطالة بلا فائدة. والمستخدم قبل النقر يحتاج أن يعرف نتيجة النقر.
  */
  protected readonly buttonLabel = computed(() => {
    const name = this.columnLabel$() || this.column$();
    const next = this.nextDirection();
    if (!name) {
      return null;
    }
    return next === 'asc'
      ? `ترتيب تصاعدي حسب ${name}`
      : next === 'desc'
        ? `ترتيب تنازلي حسب ${name}`
        : `إلغاء الترتيب حسب ${name}`;
  });

  private nextDirection(): ApSortDirection {
    const current = this.direction$();
    return current === '' ? 'asc' : current === 'asc' ? 'desc' : '';
  }

  protected toggle(): void {
    this.sortChange.emit({ column: this.column$(), direction: this.nextDirection() });
  }

  /*
    ⚠️ رأس قابل للفرز **لا يحتوي عنصرًا تفاعليًّا آخر**.

    الزرّ يملأ الخليّة كلّها (‎width: 100%‎) وكل ما يُسقَط في `<ng-content>`
    يقع **داخله**. فمربّع اختيار «تحديد الكل» في رأس الاسم يصير زرًّا داخل
    زرّ: HTML غير صالح، والمتصفّح ينزعه من الشجرة أو يمنع نقره — وقارئ
    الشاشة يُعلن الاثنين شيئًا واحدًا.

    وهذا فخّ صامت: الشكل يبدو سليمًا تمامًا، ولا يُكتشف إلّا بمحاولة النقر.
    ولذلك يُفحص المحتوى المُسقَط في وضع التطوير — والحلّ عمود مستقلّ
    لمربّع التحديد، لا رأسًا يجمع الأمرين.
  */
  ngAfterContentInit(): void {
    if (!isDevMode()) {
      return;
    }
    const nested = this.host.nativeElement.querySelector(
      '.ap-table__sort a, .ap-table__sort button, .ap-table__sort input,' +
        ' .ap-table__sort select, .ap-table__sort textarea, .ap-table__sort [tabindex]',
    );
    if (nested) {
      throw new Error(
        'ap-table-sort: رأس قابل للفرز لا يحتوي عنصرًا تفاعليًّا آخر — ' +
          'زرّ الفرز يملأ الخليّة، فيصير ما بداخله عنصرًا داخل زرّ. ' +
          'انقل مربّع التحديد إلى عمود مستقلّ.',
      );
    }
  }

  ngOnInit(): void {
    if (isDevMode() && !this.column$()) {
      throw new Error(
        'ap-table-sort: مطلوب معرّف عمود — [apTableSort]="\'name\'". ' +
          'وهو ما يُمرَّر في (sortChange) كي يعرف المستهلك أيّ عمود تغيّر.',
      );
    }
  }
}
