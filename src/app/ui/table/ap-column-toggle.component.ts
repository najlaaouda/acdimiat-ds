import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnDestroy,
  Output,
  PLATFORM_ID,
  ViewChild,
  ViewEncapsulation,
  computed,
  signal,
} from '@angular/core';

import { ApButtonComponent } from '../button/ap-button.component';
import { ApCheckboxDirective } from '../choice/ap-checkbox.directive';
import { ApChoiceComponent } from '../choice/ap-choice.component';
import { attachViewportSync, computePopoverPosition } from '../select/popover-position';

/* ============================================================================
   Acadimiat UI — تخصيص الأعمدة
   ----------------------------------------------------------------------------
   زرّ يفتح قائمة مربّعات اختيار، واحد لكل عمود، تُظهر العمود أو تخفيه.

   ─── لماذا عنصر كامل لا موجّه ──────────────────────────────────────────────
   لا عنصر أصليًّا يؤدّي هذا: زرّ يفتح لوحة تحمل بنية داخلية وحالة مفتوح/مغلق
   وموضعًا محسوبًا. وهو الاستثناء نفسه الذي يبرّر `<ap-select>` — بديل لا
   تحسين لعنصر قائم.

   ─── ما تصفه القائمة ───────────────────────────────────────────────────────
   أعمدة **البيانات** وحدها. عمود الأوامر وعمود التحديد ليسا عمودَي بيانات بل
   بنية الجدول نفسها — أدوات مرسومة في شكل عمود — فلا يُمرَّران إلى `columns`
   إطلاقًا. وقائمة تعرض «الأوامر» تسأل المستخدم سؤالًا لا جواب له: إظهاره
   وإخفاؤه معًا ممنوعان.

   ⚠️ والفرق بين «غير مذكور» و«مذكور ومقفل» فرق في المعنى لا في التنفيذ:
      عمود بيانات لا يُخفى (الاسم) يُذكر مقفلًا، لأن غيابه عن القائمة كان
      سيُقرأ سهوًا؛ وعمود ليس بيانات لا يُذكر أصلًا، لأن ذكره يَعِد بتحكّم لا
      وجود له.

   ─── العمود المقفل ─────────────────────────────────────────────────────────
   عمود الهويّة (الاسم) لا يُخفى، ويُعلَن ذلك بـ `disabled` على مربّعه لا
   بحذفه من القائمة: بإخفائه تصير الصفوف بلا أصحاب. والمقفل يبقى مؤشَّرًا
   ومعطَّلًا، فيُرى أنه ظاهر وأنه غير قابل للإخفاء في آن.

   ⚠️ والقفل يُفرض في المنطق لا في العرض وحده: `toggle()` يرفض المقفل حتى لو
      وصله حدث بطريقة أخرى. مربّع معطَّل لا يُرسل `change`، لكن الاعتماد على
      ذلك يجعل القاعدة خاصّية عرض — وهي قاعدة بيانات.

   ─── اللوحة لا تغادر شجرتها ────────────────────────────────────────────────
   `popover` + `position: fixed` بموضع محسوب في TS — لا `cdk-overlay` ولا
   إلحاق بـ `body`. وهي القاعدة نفسها في `<ap-select>`: ما يُلحق بـ `body`
   يخرج من مسرح الظلّ في موقع التوثيق فيفقد كل أنماطه. و`popover` يضعها في
   الطبقة العليا، فلا تنازع كاسكاد القالب المشترى على z-index.

   ⚠️ و`popover=auto` يُغلق عند `pointerdown` خارج اللوحة — والزنّاد خارجها.
      فبلا التقاط حالة الفتح عند `pointerdown` تُغلق ثم تفتحها نقرة `click`
      فورًا، فتبدو قائمة لا تُغلق بالنقر على زنّادها.

   ─── الحفظ ─────────────────────────────────────────────────────────────────
   الاختيار يُحفظ في `localStorage` تحت `storageKey`. من يخفي عمودًا يخفيه
   لأنه لا يعنيه، وعودته عند كل زيارة تُلغي الميزة من أصلها.

   ⚠️ والقراءة والكتابة كلتاهما خلف `isPlatformBrowser`: `localStorage` غير
      معرّف على الخادم، ولمسه بلا حارس يُسقط تصيير SSR للصفحة كلّها لا
      لهذا المكوّن وحده.

   ⚠️ والمحفوظ يُقاطَع مع الأعمدة الحالية عند القراءة: عمود حُذف من الشيفرة
      يبقى في التخزين إلى الأبد، وعمود أُضيف بعد الحفظ يجب أن يظهر افتراضيًا
      لا أن يُخفى لأن التخزين لا يذكره.
   ============================================================================ */

export interface ApColumnDef {
  /** مفتاح العمود كما في `matColumnDef`. */
  key: string;
  /** التسمية المعروضة — نفس نصّ رأس العمود. */
  label: string;
  /** عمود لا يُخفى (الهويّة). يظهر مؤشَّرًا ومعطَّلًا. */
  locked?: boolean;
}

let columnToggleCounter = 0;

@Component({
  selector: 'ap-column-toggle',
  standalone: true,
  imports: [ApButtonComponent, ApChoiceComponent, ApCheckboxDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './ap-column-toggle.component.html',
  styleUrl: './ap-column-toggle.component.scss',
})
export class ApColumnToggleComponent implements OnDestroy {
  /*
    ⚠️ `{ read: ElementRef }` ليس تزيّدًا هنا وحده من بين مكوّنات المكتبة.

    الزنّاد `<button apButton>`، و`apButton` **مكوّن** لا موجّه. ومتغيّر
    القالب الموضوع على عنصر يستضيف مكوّنًا يُرجع نسخة المكوّن لا عنصره —
    فتصير `triggerRef.nativeElement` غير معرَّفة، ويخرج `position()` صامتًا
    قبل أن يكتب `top`/`left`، فتقع اللوحة عند الزاوية العليا من الصفحة (يمينها
    في RTL) لا تحت زرّها، ويرمي إرجاع التركيز عند الإغلاق.

    والعطل صامت مرّتين: لا خطأ ترجمة لأن `ElementRef` نوع مُعلَن يدويًّا،
    ولا خطأ تشغيل لأن `position()` يخرج بـ`return` عادي. ولذلك بقي مكتوبًا.

    وبقيّة زنّادات المكتبة (`<ap-select>`، `<ap-phone-field>`) لا تحتاجه:
    أزرارها عناصر عارية بلا مكوّن مضيف.
  */
  @ViewChild('trigger', { read: ElementRef })
  private triggerRef?: ElementRef<HTMLButtonElement>;
  @ViewChild('panel') private panelRef?: ElementRef<HTMLElement>;

  private readonly uid = ++columnToggleCounter;
  protected readonly panelId = `ap-column-toggle-${this.uid}`;

  private readonly columns$ = signal<ApColumnDef[]>([]);
  private readonly hidden$ = signal<ReadonlySet<string>>(new Set());
  /** ترتيب المفاتيح كما يعرضه المستخدم. فارغًا يعني «كما وردت». */
  private readonly order$ = signal<string[]>([]);
  private readonly open$ = signal(false);
  private storageKey = '';
  private detachViewportListeners: (() => void) | null = null;
  private wasOpenOnPointerDown = false;

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {}

  /** كل أعمدة الجدول بالترتيب، بما فيها المقفلة. */
  @Input()
  set columns(value: ApColumnDef[]) {
    this.columns$.set(value ?? []);
    this.restore();
  }

  /**
   * مفتاح التخزين. بلا قيمة لا يُحفظ شيء — وهو الصحيح لجدول عابر.
   */
  @Input()
  set storage(value: string) {
    this.storageKey = value ?? '';
    this.restore();
  }

  /** المفاتيح الظاهرة بالترتيب. يُطلق عند كل تبديل وعند الاسترجاع. */
  @Output() readonly visibleChange = new EventEmitter<string[]>();

  protected readonly openValue = this.open$.asReadonly();

  /*
    الأعمدة بترتيب العرض الحالي.

    ⚠️ الترتيب المحفوظ يُستعمل **مرشِّحًا** لا مصدرًا: يُقرأ منه ما يوجد في
       `columns` اليوم، ثم يُلحق به ما ليس فيه. فعمود حُذف من الشيفرة يسقط
       تلقائيًا، وعمود أُضيف بعد الحفظ يظهر في موضعه الأصلي بدل أن يختفي
       لأن التخزين لا يذكره.
  */
  protected readonly orderedColumns = computed<ApColumnDef[]>(() => {
    const columns = this.columns$();
    const order = this.order$();
    if (!order.length) {
      return columns;
    }
    const byKey = new Map(columns.map(column => [column.key, column]));
    const ordered = order.map(key => byKey.get(key)).filter((c): c is ApColumnDef => !!c);
    const seen = new Set(ordered.map(column => column.key));
    return [...ordered, ...columns.filter(column => !seen.has(column.key))];
  });

  protected readonly visible = computed(() =>
    this.orderedColumns()
      .filter(column => !this.hidden$().has(column.key))
      .map(column => column.key),
  );

  /* عدد المخفيّ على الزرّ: بلا عدّاد لا شيء يقول إن الجدول منقوص، فيبحث
     المستخدم عن عمود غائب في البيانات لا في هذه القائمة. */
  protected readonly hiddenCount = computed(
    () => this.columns$().filter(column => this.hidden$().has(column.key)).length,
  );

  protected isVisible(key: string): boolean {
    return !this.hidden$().has(key);
  }

  protected toggle(column: ApColumnDef): void {
    /* القفل قاعدة بيانات لا خاصّية عرض — انظر التعليق في رأس الملف. */
    if (column.locked) {
      return;
    }

    const next = new Set(this.hidden$());
    if (next.has(column.key)) {
      next.delete(column.key);
    } else {
      next.add(column.key);
    }

    this.hidden$.set(next);
    this.persist();
    this.visibleChange.emit(this.visible());
  }

  /* ── إعادة الترتيب ──────────────────────────────────────────────────── */

  /**
   * هل يمكن نقل هذا العمود خطوةً في هذا الاتجاه؟
   *
   * ⚠️ الشرط على **الجار** لا على العمود وحده: العمود المقفل لا يُنقَل، ولا
   *    يُتخطّى كذلك. فمن يقف بجوار «الاسم» لا يصعد فوقه — ويبقى المقفل في
   *    طرفه بلا حساب مواضع.
   *
   *    ولو كان الشرط على الفهرس («لا تتجاوز 0») لانكسر متى صار المقفل في
   *    غير طرفه — والقائمة تصف أعمدة البيانات وحدها، وعددها يتغيّر.
   *
   * ⚠️ ولا يحرس هذا عمود الأوامر: هو ليس في القائمة أصلًا، والمستهلك يُلحقه
   *    بالأعمدة الظاهرة بعد الترتيب — فيبقى آخرًا مهما رُتّب ما قبله.
   */
  protected canMove(column: ApColumnDef, delta: number): boolean {
    if (column.locked) {
      return false;
    }
    const columns = this.orderedColumns();
    const index = columns.findIndex(c => c.key === column.key);
    const neighbour = columns[index + delta];
    return !!neighbour && !neighbour.locked;
  }

  /* ── السحب ──────────────────────────────────────────────────────────
     مقبض واحد يعمل بالسحب وبلوحة المفاتيح. والثاني ليس بديلًا مكافئًا بل
     المسار الوحيد لمن لا يستعمل فأرة — وهو شرط WCAG 2.1.1، لا رفاهية.
  */

  /** الصفّ الذي ضُغط مقبضه — به وحده تُرفع سمة `draggable`. */
  protected readonly armedKey = signal<string | null>(null);
  /** الصفّ المحمول حاليًا. */
  protected readonly dragKey = signal<string | null>(null);

  protected onDragStart(column: ApColumnDef): void {
    if (column.locked) {
      return;
    }
    this.dragKey.set(column.key);
  }

  /*
    ⚠️ `preventDefault` شرط وقوع `drop` أصلًا: الافتراضي في HTML أن العنصر
       لا يقبل الإفلات، فبدونه لا يقع الحدث ويعود الصفّ إلى مكانه.

    والنقل يقع هنا لا عند الإفلات: الترتيب يتبع المؤشّر أثناء السحب، فيرى
    المستخدم أين سيستقرّ العمود قبل أن يترك الزرّ لا بعده.
  */
  protected onDragOver(event: DragEvent, over: ApColumnDef): void {
    const from = this.dragKey();
    if (!from || from === over.key || over.locked) {
      return;
    }
    event.preventDefault();

    const keys = this.orderedColumns().map(c => c.key);
    const fromIndex = keys.indexOf(from);
    const toIndex = keys.indexOf(over.key);
    if (fromIndex < 0 || toIndex < 0) {
      return;
    }

    keys.splice(toIndex, 0, ...keys.splice(fromIndex, 1));
    this.order$.set(keys);
    this.persist();
    this.visibleChange.emit(this.visible());
  }

  protected onDragEnd(): void {
    this.dragKey.set(null);
    this.armedKey.set(null);
  }

  /*
    السهمان على المقبض ينقلان العمود خطوةً.

    ⚠️ و`preventDefault` يمنع تمرير اللوحة مع كل ضغطة — وبدونه ينزلق ما
       تحت المؤشّر بينما ينتقل الصفّ، فيفقد المستخدم موضعه مرّتين.
  */
  protected onGripKey(event: KeyboardEvent, column: ApColumnDef): void {
    const delta = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
    if (!delta) {
      return;
    }
    event.preventDefault();
    this.move(column, delta);
  }

  protected move(column: ApColumnDef, delta: number): void {
    if (!this.canMove(column, delta)) {
      return;
    }

    const keys = this.orderedColumns().map(c => c.key);
    const index = keys.indexOf(column.key);
    const target = index + delta;
    [keys[index], keys[target]] = [keys[target], keys[index]];

    this.order$.set(keys);
    this.persist();
    this.visibleChange.emit(this.visible());

    /*
      ⚠️ التركيز يتبع العمود المنقول لا موضعه.

      الزرّ المضغوط ينتقل مع صفّه إلى مكان آخر في القائمة، والمتصفّح يُبقي
      التركيز على العنصر نفسه — لكن Angular يعيد بناء الصفوف عند تغيّر
      الترتيب، فيسقط التركيز إلى `body` ويخسر مستخدم لوحة المفاتيح موضعه
      بعد كل نقلة. و`track column.key` في القالب يحفظ العناصر، فيبقى
      التركيز على زرّه — وهذا هو سبب وجوده هناك.
    */
  }

  /* ── الفتح والإغلاق ─────────────────────────────────────────────────── */

  protected onTriggerPointerDown(): void {
    this.wasOpenOnPointerDown = this.open$();
  }

  protected onTriggerClick(): void {
    if (this.wasOpenOnPointerDown) {
      this.wasOpenOnPointerDown = false;
      this.close();
      return;
    }
    this.openPanel();
  }

  protected onPanelToggle(event: Event): void {
    /* الإغلاق قد يأتي من المتصفّح (Esc، نقرة خارجية) لا من الكود. */
    if ((event as ToggleEvent).newState === 'closed' && this.open$()) {
      this.close();
    }
  }

  private openPanel(): void {
    if (this.open$()) {
      return;
    }
    this.open$.set(true);

    queueMicrotask(() => {
      const panel = this.panelRef?.nativeElement as HTMLElement & {
        showPopover?: () => void;
      };
      panel?.showPopover?.();
      /*
        ⚠️ التموضع **بعد** الإظهار لا قبله: اللوحة المغلقة `display: none`
           فعرضها صفر، والمحاذاة على عرض صفر تضعها عند حافّة الزنّاد تمامًا
           ثم تنمو في الاتجاه الخطأ. والاستدعاء هنا يقع قبل الرسم، فلا تومض
           في موضع خاطئ.
      */
      this.position();
    });

    this.detachViewportListeners = attachViewportSync(() => this.position());
  }

  private close(): void {
    if (!this.open$()) {
      return;
    }
    const panel = this.panelRef?.nativeElement as HTMLElement & {
      hidePopover?: () => void;
    };
    try {
      panel?.hidePopover?.();
    } catch {
      /* يرمي إن كانت مغلقة أصلًا (وصلنا من حدث toggle) — لا يعني شيئًا. */
    }

    this.detachViewportListeners?.();
    this.detachViewportListeners = null;
    this.open$.set(false);
    /* التركيز يعود إلى الزنّاد: اللوحة اختفت، وتركه فيها يُسقطه إلى body. */
    this.triggerRef?.nativeElement.focus();
  }

  private position(): void {
    const trigger = this.triggerRef?.nativeElement;
    const panel = this.panelRef?.nativeElement;
    if (!trigger || !panel) {
      return;
    }

    /*
      ⚠️ اللوحة تُمرَّر إلى الحساب لا الزنّاد وحده: هي أوسع من زرّها وأقصر من
         السقف، وكلاهما لا يُعرف من الزنّاد. وكانت المحاذاة الأفقية محسوبة
         هنا نسخةً ثانية بهامش مختلف (8px مقابل 16px) — فانتقلت إلى
         `computePopoverPosition` حيث تصل إلى الستّ لوحات دفعةً واحدة.
    */
    const placement = computePopoverPosition(trigger, panel);
    panel.dataset['placement'] = placement.placement;
    panel.style.top = placement.top + 'px';
    panel.style.left = placement.left + 'px';
    panel.style.maxHeight = placement.maxHeight + 'px';
    /*
      العرض من الزنّاد **حدًّا أدنى** لا مساواة: زرّ «تخصيص الأعمدة» أضيق من
      أطول تسمية عمود، ومساواته تقصّ التسميات. و`<ap-select>` يساوي عرضه
      لأن لوحته تعرض قيم الحقل نفسه.
    */
    panel.style.minWidth = placement.width + 'px';
  }

  ngOnDestroy(): void {
    this.detachViewportListeners?.();
    this.detachViewportListeners = null;
  }

  /* ── التخزين ────────────────────────────────────────────────────────── */

  private restore(): void {
    if (!this.storageKey || !isPlatformBrowser(this.platformId) || !this.columns$().length) {
      return;
    }

    let stored: unknown = null;
    try {
      const raw = localStorage.getItem(this.storageKey);
      stored = raw ? JSON.parse(raw) : null;
    } catch {
      /* قيمة تالفة أو تخزين ممنوع — يُعامَل كأن لا حفظ. */
      stored = null;
    }

    /*
      ⚠️ الشكل القديم كان مصفوفة المخفيّ وحدها، والجديد كائن فيه الترتيب
         كذلك. وقراءة الاثنين ليست تزيّدًا: من استعمل الميزة قبل إضافة
         الترتيب يجد إخفاءه محفوظًا لا مُلغى — والترقية الصامتة تفقد بيانات
         مستخدم لم يفعل شيئًا خطأ.
    */
    const legacy = Array.isArray(stored);
    const hiddenRaw = legacy ? (stored as string[]) : (stored as any)?.hidden;
    const orderRaw = legacy ? [] : (stored as any)?.order;

    /*
      المقاطعة مع الأعمدة الحالية: مفتاح لم يعد موجودًا يُهمَل، وعمود جديد
      لم يُحفظ يظهر — فالتخزين يذكر **المخفيّ** لا الظاهر، والغياب عنه يعني
      «ظاهر» وهو الافتراضي الصحيح لعمود أُضيف بعد الحفظ.
    */
    const known = new Set(this.columns$().map(column => column.key));
    const locked = new Set(this.columns$().filter(c => c.locked).map(c => c.key));

    this.hidden$.set(
      new Set(
        (Array.isArray(hiddenRaw) ? hiddenRaw : []).filter(
          (key: unknown): key is string =>
            typeof key === 'string' && known.has(key) && !locked.has(key),
        ),
      ),
    );

    this.order$.set(
      (Array.isArray(orderRaw) ? orderRaw : []).filter(
        (key: unknown): key is string => typeof key === 'string' && known.has(key),
      ),
    );

    this.visibleChange.emit(this.visible());
  }

  private persist(): void {
    if (!this.storageKey || !isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify({
          hidden: [...this.hidden$()],
          order: this.orderedColumns().map(column => column.key),
        }),
      );
    } catch {
      /* وضع التصفّح الخاصّ يمنع الكتابة — الميزة تعمل، والحفظ وحده يسقط. */
    }
  }
}
