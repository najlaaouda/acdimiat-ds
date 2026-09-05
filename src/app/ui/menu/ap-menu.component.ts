import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  ViewEncapsulation,
  signal,
} from '@angular/core';

import { attachViewportSync, computePopoverPosition } from '../select/popover-position';

/* ============================================================================
   Acadimiat UI — اللوحة المنسدلة
   ----------------------------------------------------------------------------
   بطاقة عائمة تُعلَّق تحت زنّاد وتُسقَط فيها **أي** محتوى. تملك الشكل والموضع
   والطبقة، ولا تملك المعنى.

   ─── لماذا مكوّن، والشكل مشترك أصلًا ──────────────────────────────────────
   كان المشترك بين القوائم الأربع في المشروع ورقةَ أنماط وحدها
   (`ui/select/_menu.scss`). فتطابق **مظهرها** وتفرّق **سلوكها**: كلٌّ منها
   يحسب موضعه، ويربط مزامنة التمرير، ويصفّر `inset` — أو ينسى.

   ونسيانه كان عطلًا حقيقيًّا: ورقة الوكيل تعطي `[popover]` قاعدة `inset: 0`،
   فتصير اللوحة مفرَطة القيد أفقيًا، وCSS تُهمل عندها الإزاحة المحسوبة في
   RTL — فتلتصق اللوحة بحافّة الشاشة. ثلاث لوحات كانت تحمل العطل، ولم يُرَ
   إلّا في واحدة.

   فما يُوحَّد هنا هو **السلوك**: الموضع، والانقلاب عند ضيق المساحة، ومزامنة
   التمرير، والطبقة العليا، وفكّ كل ذلك عند الإغلاق.

   ─── وما لا تملكه: المعنى ─────────────────────────────────────────────────
   لا `role` على اللوحة ولا على ما بداخلها. المستهلكون الأربعة يختلفون فيه
   اختلافًا جوهريًّا — `listbox` للقائمة، و`listbox` مع `combobox` قابل
   للتحرير في الهاتف والبحث، و`menu` لأوامر الصفّ. ولوحةٌ تفرض `role` واحدًا
   تُنتج ثلاثة استهلاكات خاطئة من أربعة.

   فالمستهلك يُسقِط حاويه بدوره الصحيح، واللوحة ترسمه.

   ─── ولماذا لا تُلحق بـ `body` ────────────────────────────────────────────
   القاعدة نفسها التي حكمت `<ap-select>` و`<ap-modal>`: ما يُلحق بـ `body`
   (طبقات CDK، tippy) يخرج من الجذر الظلّي الذي يعزل مسرح المعاينة في موقع
   التوثيق فيفقد أنماطه كلّها. وسمة `popover` ترفعها إلى الطبقة العليا وهي
   باقية في شجرتها.

   ⚠️ القالب والأنماط في ملفين خارجيين — قاعدة الـ backtick.
   ============================================================================ */

@Component({
  selector: 'ap-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './ap-menu.component.html',
  styleUrl: './ap-menu.component.scss',
})
export class ApMenuComponent implements OnDestroy {
  @ViewChild('panel') private panelRef?: ElementRef<HTMLElement>;

  private readonly open$ = signal(false);
  private readonly placement$ = signal<'below' | 'above'>('below');
  private readonly top$ = signal(0);
  private readonly left$ = signal(0);
  private readonly width$ = signal(0);
  private readonly maxHeight$ = signal(0);
  private readonly matchWidth$ = signal(true);

  private trigger$: HTMLElement | null = null;
  private detachViewport: (() => void) | null = null;

  /**
   * العنصر الذي تُعلَّق اللوحة تحته.
   *
   * ⚠️ يُمرَّر **العنصر** لا مرجعًا للقالب: متغيّر مرجعي على وسم يستضيف
   *    مكوّنًا يُحلّ إلى **نسخة المكوّن** لا إلى عنصره. فمن يكتب
   *    `#t` على `<button apButton>` ثم يمرّر `t` يمرّر `ApButtonComponent`.
   *    والحلّ عند المستهلك: `@ViewChild('t', { read: ElementRef })`.
   *    وهنا يُفحص النوع صراحةً كي يفشل ذلك بصمتٍ أقلّ.
   */
  @Input()
  set trigger(value: HTMLElement | ElementRef<HTMLElement> | null) {
    this.trigger$ = value instanceof ElementRef ? value.nativeElement : (value ?? null);
    if (this.open$()) {
      this.position();
    }
  }

  /** ثنائي الاتجاه: الإغلاق الخارجي (نقرة خارج اللوحة) يعود إلى المستهلك. */
  @Input()
  set open(value: boolean) {
    const next = !!value;
    if (next === this.open$()) {
      return;
    }
    this.open$.set(next);
    next ? this.show() : this.hide();
  }

  /**
   * `false` ⇐ اللوحة بعرض محتواها لا بعرض الزنّاد.
   *
   * قائمة الأوامر (⋯) زنّادها أيقونة 32px، فمطابقة عرضه تُنتج لوحة أضيق من
   * كلمة «حذف». والقائمة المنسدلة عكسها: عرضها **يجب** أن يطابق الحقل وإلّا
   * قُرئت طبقةً غريبة لا امتدادًا له.
   */
  @Input()
  set matchTriggerWidth(value: boolean) {
    this.matchWidth$.set(value !== false);
  }

  @Output() readonly openChange = new EventEmitter<boolean>();

  protected readonly isOpen = this.open$.asReadonly();
  protected readonly placement = this.placement$.asReadonly();
  protected readonly panelTop = this.top$.asReadonly();
  protected readonly panelLeft = this.left$.asReadonly();
  protected readonly panelWidth = this.width$.asReadonly();
  protected readonly panelMaxHeight = this.maxHeight$.asReadonly();
  protected readonly matchWidth = this.matchWidth$.asReadonly();

  /*
    الهدم واللوحة مفتوحة يحدث كثيرًا — تنقّل بين المسارات أو `@if` حول
    المستهلك. مستمعا التمرير والمقاس يبقيان معلّقين على مستندٍ لم يعد لهما
    فيه شيء، ويُعاد الحساب عند كل تمرير في الصفحة إلى الأبد.
  */
  ngOnDestroy(): void {
    this.detachViewport?.();
    this.detachViewport = null;
  }

  /** إغلاق برمجي — المخرج الوحيد، فتُطلق `(openChange)` مرّة واحدة. */
  close(): void {
    if (!this.open$()) {
      return;
    }
    this.open$.set(false);
    this.hide();
    this.openChange.emit(false);
  }

  /**
   * إغلاق اللوحة من المتصفّح نفسه — نقرة خارجها، أو Esc، أو فتح لوحة
   * `popover="auto"` أخرى.
   *
   * ⚠️ الحارس على الحالة لا على راية: حدث `toggle` غير متزامن، فأي راية
   *    تُرفع وتُخفض حول `hidePopover()` تكون قد عادت صفرًا قبل وصوله. وهي
   *    اللدغة نفسها الموثّقة على حدث `close` في `<ap-modal>`.
   */
  protected onToggle(event: Event): void {
    const open = (event as ToggleEvent).newState === 'open';
    if (open || !this.open$()) {
      return;
    }
    this.open$.set(false);
    this.detachViewport?.();
    this.detachViewport = null;
    this.openChange.emit(false);
  }

  private show(): void {
    /*
      القياس قبل العرض: `getBoundingClientRect` على زنّاد موجود صحيح في
      كل الأحوال، ولا حاجة إلى انتظار إطار.
    */
    this.position();
    /*
      ⚠️ التأجيل: قد تصل `[open]="true"` قبل تهيئة العرض (مستهلك يفتح اللوحة
         في `ngOnInit`)، فيكون `panelRef` غير معرَّف — القاعدة نفسها المتّبعة
         في `<ap-modal>`.

      ⚠️ والحارس على `:popover-open` لا على راية: `showPopover()` **ترمي**
         `InvalidStateError` إن كان العنصر معروضًا أصلًا، وحدث `toggle` غير
         متزامن فأي راية تُرفع حوله تكون قد عادت قبل وصوله.
    */
    queueMicrotask(() => {
      const panel = this.panelRef?.nativeElement;
      if (!panel || panel.matches(':popover-open')) {
        return;
      }
      panel.showPopover?.();
      this.position();
    });
    this.detachViewport?.();
    this.detachViewport = attachViewportSync(() => this.position());
  }

  private hide(): void {
    this.detachViewport?.();
    this.detachViewport = null;
    const panel = this.panelRef?.nativeElement;
    if (panel?.matches(':popover-open')) {
      panel.hidePopover?.();
    }
  }

  private position(): void {
    const trigger = this.trigger$;
    if (!trigger) {
      return;
    }
    const pos = computePopoverPosition(trigger, this.panelRef?.nativeElement);
    this.placement$.set(pos.placement);
    this.top$.set(pos.top);
    this.left$.set(pos.left);
    this.width$.set(pos.width);
    this.maxHeight$.set(pos.maxHeight);
  }
}
