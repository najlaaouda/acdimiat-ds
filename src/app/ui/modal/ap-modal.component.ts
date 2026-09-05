import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  PLATFORM_ID,
  ViewChild,
  ViewEncapsulation,
  computed,
  inject,
  signal,
} from '@angular/core';

/* ============================================================================
   Acadimiat UI — النافذة المنبثقة
   ----------------------------------------------------------------------------
   الأبعاد كلها من طبقة `--ap-dialog-*`، وهي مقيسة من لقطة المرجع المعتمدة.
   انظر جدول القياس في `src/styles/tokens/_components.css § DIALOG / MODAL`.

   ─── لماذا `<dialog>` أصلي في الداخل ──────────────────────────────────────
   `showModal()` يمنح مجّانًا ما يُعاد بناؤه يدويًا في كل تنفيذ آخر — وكلّه
   عرضة للخطأ:

     • حبس التركيز داخل النافذة، وإعادته إلى العنصر الذي فتحها عند الإغلاق.
     • تعطيل ما خلفها (`inert` ضمنيًا) لقارئ الشاشة ولمؤشّر الفأرة معًا.
     • الطبقة العليا (top layer): لا صراع z-index مع القالب المشترى، ولا
       قصّ من `overflow: hidden` على أي سلف — وهي علّة كل مودال في المشروع.
     • `Esc` و`::backdrop` بلا سطر JS.

   ─── ولماذا لا تُلحق بـ `body` ────────────────────────────────────────────
   القاعدة نفسها التي حكمت `<ap-select>`: ما يُلحق بـ `body` (طبقات CDK،
   tippy) يخرج من الجذر الظلّي الذي يعزل مسرح المعاينة في موقع التوثيق،
   فيفقد كل أنماطه. `<dialog>` يبقى في شجرته ويرتفع إلى الطبقة العليا
   بالعرض وحده — فيعمل في المسرح وفي التطبيق بالسلوك نفسه.

   ─── ولماذا عنصر مخصّص رغم قاعدة «موجّه على عنصر أصلي» ────────────────────
   القاعدة وُضعت لعناصر **التحكّم**: تغليف `<button>` يكسر `type="submit"`،
   وتغليف `<input>` يفرض تمرير `disabled` يدويًا. والنافذة ليست عنصر تحكّم
   بل **بنية**: رأس وجسم وذيل بمسافات محدَّدة. لا شيء يُكسر بتغليفها،
   والمضيف نفسه `display: contents` فلا يضيف صندوقًا إلى التخطيط أصلًا.

   والعنصر الأصلي محفوظ كاملًا في الداخل — `<dialog>` حقيقي يُفتح بـ
   `showModal()`، لا `<div role="dialog">`.

   ⚠️ القالب والأنماط في ملفين خارجيين لا سطريَّين — أي backtick داخل قالب
      سطري (ولو في تعليق) يُغلق النصّ الحرفي. لُدغ المشروع بذلك مرّتين.
   ============================================================================ */

export type ApModalSize = 'sm' | 'md' | 'lg';

/** سبب الإغلاق — يُمرَّر في `(closed)` كي يفرّق المستهلك بين إلغاء وتأكيد. */
export type ApModalCloseReason = 'close-button' | 'backdrop' | 'escape' | 'programmatic';

/*
  عدّاد وحدات لا `Math.random`: الخادم والمتصفّح يُصيّران بالترتيب نفسه
  فتتطابق المعرّفات ولا ينكسر الترطيب — القاعدة نفسها في `<ap-field>`.
*/
let modalCounter = 0;

/** يمنع تمرير الصفحة خلف النافذة. عدّاد لا راية: نافذتان متداخلتان واردتان. */
let scrollLocks = 0;

@Component({
  selector: 'ap-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './ap-modal.component.html',
  styleUrl: './ap-modal.component.scss',
})
export class ApModalComponent implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  @ViewChild('dialog') private dialogRef?: ElementRef<HTMLDialogElement>;
  @ViewChild('body') private bodyRef?: ElementRef<HTMLElement>;

  private readonly uid = ++modalCounter;
  protected readonly titleId = `ap-modal-${this.uid}-title`;
  protected readonly descriptionId = `ap-modal-${this.uid}-desc`;

  private readonly open$ = signal(false);
  private readonly heading$ = signal('');
  private readonly description$ = signal('');
  private readonly size$ = signal<ApModalSize>('md');
  private readonly fitContent$ = signal(false);
  private readonly dismissible$ = signal(true);
  private readonly closeLabel$ = signal('إغلاق');
  /** يفيض الجسم عن ارتفاعه المتاح ⇐ تظهر الفواصل. يُقاس، لا يُخمَّن. */
  private readonly overflowing$ = signal(false);

  private lockedScroll = false;
  /** حارس ضدّ دوران لا نهائي لو لم يُهيّأ العرض إطلاقًا — انظر `sync`. */
  private syncRetries = 0;
  private detachOverflowWatch: (() => void) | null = null;

  /**
   * يفتح النافذة ويغلقها. ثنائي الاتجاه مع `(openChange)` — فالإغلاق
   * بـ Esc أو بالنقر على الخلفية يجب أن يعود إلى حالة المستهلك، وإلّا بقيت
   * رايته `true` واستحال إعادة الفتح.
   */
  @Input()
  set open(value: boolean) {
    const next = !!value;
    if (next === this.open$()) {
      return;
    }
    this.open$.set(next);
    this.sync(next, 'programmatic');
  }

  /**
   * عنوان النافذة. `heading` لا `title`: الأخيرة سمة HTML عامّة تُنتج
   * تلميحًا أصفر من المتصفّح على المضيف، فيصبح للعنوان مظهران متنافسان.
   */
  @Input()
  set heading(value: string) {
    this.heading$.set(value ?? '');
  }

  /** سطر تحت العنوان. يُربط بـ `aria-describedby` فيُقرأ مع فتح النافذة. */
  @Input()
  set description(value: string) {
    this.description$.set(value ?? '');
  }

  @Input()
  set size(value: ApModalSize) {
    this.size$.set(value ?? 'md');
  }

  /**
   * العرض يتبع المحتوى بدل أن يملأ المقاس، والمقاس يبقى سقفًا له.
   *
   * لمحتوًى **له عرض طبيعي** — قائمة، جدول، بطاقات خيارات. النافذة حينها
   * تقف عند ما يحتاجه المحتوى فلا يبقى فراغ في الجانب.
   *
   * ⛔ ولا تُستعمل في نافذة **نموذج**: حقول `<ap-field>` عرضها 100% من
   *    البطاقة، وعرضٌ تابع للمحتوى يهبط بها إلى أضيق ما يسع أطول كلمة.
   */
  @Input()
  set fitContent(value: boolean) {
    this.fitContent$.set(!!value);
  }

  /**
   * `false` يمنع الإغلاق بـ Esc وبالنقر على الخلفية ويُخفي زرّ الإغلاق.
   *
   * ⚠️ لا تستخدمها إلّا حين يكون في الذيل مخرج صريح (زرّ إلغاء). نافذة بلا
   *    أي مخرج تحبس المستخدم — وهي مخالفة صريحة لـ WCAG 2.1.2.
   */
  @Input()
  set dismissible(value: boolean) {
    this.dismissible$.set(value !== false);
  }

  /** الاسم المقروء لزرّ الإغلاق — الزرّ أيقونة بلا نصّ مرئي. */
  @Input()
  set closeLabel(value: string) {
    this.closeLabel$.set(value || 'إغلاق');
  }

  @Output() readonly openChange = new EventEmitter<boolean>();
  @Output() readonly closed = new EventEmitter<ApModalCloseReason>();

  protected readonly openValue = this.open$.asReadonly();
  protected readonly headingValue = this.heading$.asReadonly();
  protected readonly descriptionValue = this.description$.asReadonly();
  protected readonly sizeValue = this.size$.asReadonly();
  protected readonly dismissibleValue = this.dismissible$.asReadonly();
  protected readonly fitContentValue = this.fitContent$.asReadonly();
  protected readonly closeLabelValue = this.closeLabel$.asReadonly();
  protected readonly overflowingValue = this.overflowing$.asReadonly();

  /* الرأس يُحذف كاملًا حين لا عنوان ولا وصف ولا زرّ إغلاق — لا يُترك فارغًا
     يأكل فجوة. */
  protected readonly hasHeader = computed(
    () => !!this.heading$() || !!this.description$() || this.dismissible$(),
  );

  /** يستهلكه التوثيق لعرض التركيبة الحالية. */
  readonly descriptor = computed(
    () => `${this.size$()}${this.dismissible$() ? '' : ' · مُلزِمة'}`,
  );

  /**
   * إغلاق برمجي من المستهلك.
   *
   * ⚠️ هي **المخرج الوحيد**: كل مسار إغلاق (الزرّ، الخلفية، Esc) يمرّ بها،
   *    فتُطلَق `(openChange)` و`(closed)` مرّة واحدة لا مرّتين.
   */
  close(reason: ApModalCloseReason = 'programmatic'): void {
    if (!this.open$()) {
      return;
    }
    this.open$.set(false);
    this.sync(false, reason);
    this.openChange.emit(false);
    this.closed.emit(reason);
  }

  /*
    الهدم والنافذة مفتوحة: يحدث كثيرًا — تنقّل بين المسارات أو @if حول
    المكوّن. العنصر يختفي معه، لكن قفل تمرير الصفحة ومراقب الفيض يبقيان
    معلّقين على مستندٍ لم يعد لهما فيه شيء: الصفحة تعجز عن التمرير إلى
    الأبد، ولا شيء في الواجهة يشرح السبب.
  */
  ngOnDestroy(): void {
    this.releaseScroll();
    this.detachOverflowWatch?.();
    this.detachOverflowWatch = null;
  }

  /* ─────────────────────────────────────────────────────────────────────
     التزامن مع العنصر الأصلي
     ───────────────────────────────────────────────────────────────────── */

  private sync(open: boolean, reason: ApModalCloseReason): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    /*
      `ViewChild` قد يكون `undefined` إذا وصلت القيمة قبل تهيئة العرض —
      وهو الحال حين يُفتح المستهلك النافذة في `ngOnInit`. التأجيل إلى
      الإطار التالي أبسط من دورة حياة كاملة، ولا يُرى فرقه.
    */
    const dialog = this.dialogRef?.nativeElement;
    if (!dialog) {
      if (this.syncRetries++ < 3) {
        queueMicrotask(() => this.sync(open, reason));
      }
      return;
    }
    this.syncRetries = 0;

    if (open) {
      if (!dialog.open) {
        dialog.showModal();
        this.lockScroll();
        this.watchOverflow();
      }
      return;
    }

    this.releaseScroll();
    this.detachOverflowWatch?.();
    this.detachOverflowWatch = null;

    if (dialog.open) {
      dialog.close(reason);
    }
  }

  /* ─────────────────────────────────────────────────────────────────────
     أحداث العنصر الأصلي
     ───────────────────────────────────────────────────────────────────── */

  /**
   * `cancel` هو Esc. منعه هو الطريقة **الوحيدة** لجعل النافذة مُلزِمة —
   * ولا يوجد ما يقابله للنقر على الخلفية، فذاك يُعالَج في `onDialogClick`.
   */
  protected onCancel(event: Event): void {
    if (!this.dismissible$()) {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    this.close('escape');
  }

  /**
   * يصل إلى هنا الإغلاق الذي لم يمرّ بـ `close()` أعلاه — أي إغلاق فرضه
   * المتصفّح (مراقب الإغلاق في Android مثلًا). تُصحَّح الحالة كي لا يبقى
   * المستهلك يظنّ النافذة مفتوحة.
   *
   * ⚠️ لا راية `closing` تحرس هذا: حدث `close` الأصلي **غير متزامن**
   *    (المواصفة تُدرجه مهمّة عنصر)، فأي راية تُرفع وتُخفض حول
   *    `dialog.close()` تكون قد عادت صفرًا قبل وصوله. الحارس الصحيح هو
   *    الحالة نفسها: من أغلق عبر `close()` صفّر `open$` قبل ذلك.
   */
  protected onNativeClose(): void {
    if (!this.open$()) {
      return;
    }
    this.open$.set(false);
    this.releaseScroll();
    this.openChange.emit(false);
    this.closed.emit('escape');
  }

  /*
    النقر على الخلفية.

    العنصر `<dialog>` نفسه يملأ إطار العرض (انظر الورقة)، والبطاقة ابنه.
    فحين يكون هدف الحدث هو `<dialog>` عينه، فالنقرة وقعت خارج البطاقة.

    ⚠️ الهدفان معًا — `pointerdown` و`click`: السحب الذي يبدأ داخل البطاقة
       (تحديد نصّ) وينتهي خارجها يُنتج `click` هدفه `<dialog>`، فتُغلق
       النافذة على المستخدم وهو ينسخ نصًّا منها. اشتراط أن تكون البداية
       أيضًا خارج البطاقة يُنهي هذه الحالة.
  */
  private pressedOnBackdrop = false;

  protected onDialogPointerDown(event: PointerEvent): void {
    this.pressedOnBackdrop = event.target === this.dialogRef?.nativeElement;
  }

  protected onDialogClick(event: MouseEvent): void {
    const wasBackdrop = this.pressedOnBackdrop;
    this.pressedOnBackdrop = false;

    if (!this.dismissible$() || !wasBackdrop) {
      return;
    }
    if (event.target !== this.dialogRef?.nativeElement) {
      return;
    }
    this.close('backdrop');
  }

  protected onCloseButton(): void {
    this.close('close-button');
  }

  /* ─────────────────────────────────────────────────────────────────────
     قفل التمرير خلف النافذة
     ─────────────────────────────────────────────────────────────────────
     `showModal()` يعطّل التفاعل مع ما خلف النافذة لكنه **لا يمنع تمرير
     الصفحة** بعجلة الفأرة. والصفحة التي تنزلق خلف نافذة ثابتة تُقرأ عطلًا.

     العدّاد لا الراية: نافذة تفتح نافذة (تأكيد فوق نموذج) واردة، وإغلاق
     الثانية يجب ألّا يحرّر القفل والأولى ما زالت مفتوحة.
     ───────────────────────────────────────────────────────────────────── */

  private lockScroll(): void {
    if (this.lockedScroll) {
      return;
    }
    this.lockedScroll = true;
    if (++scrollLocks === 1) {
      this.document()?.documentElement.setAttribute('data-ap-modal-open', 'true');
    }
  }

  private releaseScroll(): void {
    if (!this.lockedScroll) {
      return;
    }
    this.lockedScroll = false;
    if (--scrollLocks <= 0) {
      scrollLocks = 0;
      this.document()?.documentElement.removeAttribute('data-ap-modal-open');
    }
  }

  private document(): Document | null {
    return this.host.nativeElement.ownerDocument ?? null;
  }

  /* ─────────────────────────────────────────────────────────────────────
     فيض الجسم
     ─────────────────────────────────────────────────────────────────────
     الفاصلان فوق الجسم وتحته يظهران عند الفيض وحده. وجودهما دائمًا يقسم
     نافذة قصيرة إلى ثلاث شرائح بلا سبب، وغيابهما عند الفيض يقصّ المحتوى
     بلا إشارة إلى أن تحته المزيد.

     القياس لا التخمين: `scrollHeight > clientHeight` بعد الفتح وعند كل
     تغيّر حجم.
     ───────────────────────────────────────────────────────────────────── */

  private watchOverflow(): void {
    const body = this.bodyRef?.nativeElement;
    const view = this.document()?.defaultView;
    if (!body || !view) {
      return;
    }

    const measure = () => this.overflowing$.set(body.scrollHeight > body.clientHeight + 1);
    measure();

    /* `ResizeObserver` يلتقط تغيّر المحتوى نفسه (حقل خطأ ظهر) لا حجم
       النافذة فقط — وهو ما لا يفعله `resize` على `window`. */
    const observer =
      typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(measure) : null;
    observer?.observe(body);

    view.addEventListener('resize', measure);
    this.detachOverflowWatch = () => {
      observer?.disconnect();
      view.removeEventListener('resize', measure);
    };
  }
}
