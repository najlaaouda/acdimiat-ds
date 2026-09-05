import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  Input,
  ViewEncapsulation,
  computed,
  signal,
} from '@angular/core';

import {
  ApFieldLabelIconDirective,
  ApFieldPrefixDirective,
  ApFieldSuffixDirective,
} from './ap-field-affix.directive';
import { ApFieldControl } from './ap-field-control';

/* ============================================================================
   Acadimiat UI — بنية الحقل
   ----------------------------------------------------------------------------
   يملك الحقل الـ label والرسائل والربط الدلالي بينها وبين عنصر الإدخال.

   ─── لماذا مكوّن حاوٍ لا مجرّد أنماط ──────────────────────────────────────
   الرقم الذي يبرّر وجود هذا المكوّن: من 1280 حقلًا في لوحة الإدارة، **24 فقط**
   له `id`، ومن 1329 label، **166 فقط** له `for`. أي أن قارئ الشاشة يقرأ
   «مربّع نصّ» بلا اسم في الأغلبية الساحقة من النماذج.

   السبب أن الربط اليدوي يتطلّب انضباطًا في كل موضع، والانضباط يفشل عند
   الحجم. الحلّ أن يصبح الربط **مستحيل النسيان**: الحقل يولّد المعرّف ويربطه
   بنفسه، فلا يوجد مسار يُنتج حقلًا بلا اسم.

   ─── ترتيب العناصر ────────────────────────────────────────────────────────
   Label → Hint → Input → Message. في المشروع اليوم نمطان متعاكسان:
   `form-errors` (133 استخدامًا) يضع الخطأ **قبل** الـ label، و`invalid-feedback`
   (95) يضعه بعد الحقل. الأول خاطئ بصريًا ودلاليًا: يقرأ المستخدم «يرجى تعبئة
   الحقل» قبل أن يعرف أي حقل، وقارئ الشاشة يقرأ ثلاثة عناصر بلا رابط بينها.

   ⚠️ ViewEncapsulation.None: أنماط `[apInput]` تعيش في ورقة هذا المكوّن لأن
      الموجّهات لا تملك أوراق أنماط. كل محدّد هنا يبدأ بـ `ap-field` أو
      `[apInput]`.
   ============================================================================ */

/*
  عدّاد وحدات لا `Math.random`: الخادم والمتصفّح يُصيّران بالترتيب نفسه،
  فتتطابق المعرّفات ولا ينكسر الترطيب. القيمة العشوائية تُنتج معرّفين
  مختلفين للعنصر نفسه فيفقد الـ label ارتباطه بعد الترطيب.
*/
let fieldCounter = 0;

@Component({
  selector: 'ap-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './ap-field.component.scss',
  host: { '[attr.data-invalid]': 'hasError() ? "true" : null' },
  template: `
    @if (labelValue()) {
      <label
        class="ap-field__label"
        [id]="labelId"
        [class.ap-field__label--hidden]="labelHiddenValue()"
        [attr.for]="controlId"
      >
        {{ labelValue() }}
        <!-- منفذ أيقونة الـ label: يُخفى بـ :empty حين لا يُسقَط فيه شيء. -->
        <span class="ap-field__label-icon"><ng-content select="[apFieldLabelIcon]" /></span>
        @if (requiredValue()) {
          <span class="ap-field__required" aria-hidden="true">(مطلوب إدخاله)</span>
        } @else if (showOptionalValue()) {
          <span class="ap-field__optional">(اختياري)</span>
        }
      </label>
    }

    <!--
      النصّ المساعد قبل الحقل: هو تعليمة تُقرأ قبل الكتابة لا بعدها.
      وضعه تحت الحقل يجعله يظهر بعد أن يكون المستخدم قد أخطأ بالفعل.

      الأيقونة محدَّدة وترث لون النصّ، وaria-hidden لأن النصّ يحمل المعنى.
    -->
    @if (hintValue() && !hasError()) {
      <p class="ap-field__hint" [id]="hintId">
        <svg class="ap-field__hint-icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5" />
          <path d="M12 8h.01" />
        </svg>
        <span>{{ hintValue() }}</span>
      </p>
    }

    <!--
      صفّ الحقل: لاصقة بداية، ثم عنصر الإدخال، ثم لاصقة نهاية.

      dir على الصفّ لا على الصفحة: حقل الرابط أو السعر محتواه لاتيني، فيجب أن
      تتجاور لاصقته مع نصّه وتُقرآ متّصلين. لو بقي الصفّ RTL لانفصلت
      «//:https» عن الرابط بفجوة وقُرئا معكوسين.
    -->
    <div
      class="ap-field__control"
      [attr.data-affixed]="hasAffix() ? 'true' : null"
      [attr.dir]="rowDir()"
    ><ng-content select="[apFieldPrefix]" /><ng-content /><ng-content select="[apFieldSuffix]" />@if (hasChevron()) {
      <!--
        السهم داخل الصفّ لا صورة خلفية على العنصر: يرث لونه من token،
        ويبهت مع الحالة المعطَّلة، ويتبع مقاس الأيقونات — وأيٌّ من ذلك
        مستحيل في صورة خلفية بلون مدفون فيها.

        pointer-events: none في الورقة، فالنقر على السهم يفتح القائمة.
      -->
      <span class="ap-field__chevron" aria-hidden="true"
        ><svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg
      ></span>
    }</div>

    @if (errorValue()) {
      <!--
        role="alert" هنا صحيح — بخلاف صناديق التوثيق: الرسالة تظهر استجابةً
        لحدث تحقّق، ويجب أن تقاطع قارئ الشاشة فورًا ليعرف المستخدم أن إدخاله
        رُفض. رُصد صفر role="alert" على رسائل الخطأ في المشروع.
      -->
      <p class="ap-field__message" data-tone="error" role="alert" [id]="messageId">
        {{ errorValue() }}
      </p>
    } @else if (successValue()) {
      <p class="ap-field__message" data-tone="success" [id]="messageId">
        {{ successValue() }}
      </p>
    }
  `,
})
export class ApFieldComponent implements AfterContentInit {
  private readonly label$ = signal<string | null>(null);
  private readonly hint$ = signal<string | null>(null);
  private readonly error$ = signal<string | null>(null);
  private readonly success$ = signal<string | null>(null);
  private readonly required$ = signal(false);
  private readonly labelHidden$ = signal(false);
  private readonly showOptional$ = signal(false);

  @ContentChild(ApFieldControl) private control?: ApFieldControl;
  @ContentChild(ApFieldPrefixDirective) private prefix?: ApFieldPrefixDirective;
  @ContentChild(ApFieldSuffixDirective) private suffix?: ApFieldSuffixDirective;

  private readonly affixed$ = signal(false);
  private readonly rowDir$ = signal<'rtl' | 'ltr' | null>(null);
  private readonly chevron$ = signal(false);

  /** وجود لاصقة ينقل الحدّ والتعبئة من عنصر الإدخال إلى الصفّ كلّه. */
  protected readonly hasAffix = this.affixed$.asReadonly();
  protected readonly rowDir = this.rowDir$.asReadonly();
  /** القائمة المنسدلة وحدها ترسم سهمًا — يعلنه عنصر التحكّم لا الحقل. */
  protected readonly hasChevron = this.chevron$.asReadonly();

  readonly controlId = `ap-field-${++fieldCounter}`;
  readonly hintId = `${this.controlId}-hint`;
  readonly messageId = `${this.controlId}-message`;
  /*
    معرّف الـ label نفسه — يعرّضه العقد ليشير إليه عنصر مركّب بـ
    `aria-labelledby` على مجموعته. بلا ذلك يصل مستخدم قارئ الشاشة إلى الزرّ
    الداخلي فيسمع وظيفته بلا انتمائه إلى أي حقل.
  */
  readonly labelId = `${this.controlId}-label`;

  @Input()
  set label(value: string | null) {
    this.label$.set(value);
  }

  /** يُخفي الـ label بصريًا ويُبقيه لقارئ الشاشة. لا يُحذف أبدًا. */
  @Input()
  set labelHidden(value: boolean) {
    this.labelHidden$.set(!!value);
  }

  @Input()
  set hint(value: string | null) {
    this.hint$.set(value);
  }

  /** وجود نصّ هنا يضع الحقل في حالة خطأ ويربطه بالرسالة. */
  @Input()
  set error(value: string | null) {
    this.error$.set(value);
    this.sync();
  }

  @Input()
  set success(value: string | null) {
    this.success$.set(value);
  }

  @Input()
  set required(value: boolean) {
    this.required$.set(!!value);
    this.sync();
  }

  /**
   * يعلّم الحقل بأنه اختياري.
   *
   * القاعدة: علّم الأقلّ عددًا. في نموذج أغلب حقوله إلزامية، تعليم الاختياري
   * أهدأ بصريًا من نجمة على كل حقل — والعكس بالعكس.
   */
  @Input()
  set showOptional(value: boolean) {
    this.showOptional$.set(!!value);
  }

  protected readonly labelValue = this.label$.asReadonly();
  protected readonly labelHiddenValue = this.labelHidden$.asReadonly();
  protected readonly hintValue = this.hint$.asReadonly();
  protected readonly errorValue = this.error$.asReadonly();
  protected readonly successValue = this.success$.asReadonly();
  protected readonly requiredValue = this.required$.asReadonly();
  protected readonly showOptionalValue = this.showOptional$.asReadonly();

  protected readonly hasError = computed(() => !!this.error$());

  ngAfterContentInit(): void {
    /* المكوّن المركّب يطلب معاملة الصفّ صراحةً — انظر `affixed` في العقد. */
    this.affixed$.set(!!this.prefix || !!this.suffix || !!this.control?.affixed);
    /*
      اتجاه الصفّ يتبع نوع الحقل لا الصفحة: النوعان price و url محتواهما
      لاتيني، فيُقرأ صفّهما من اليسار لتتجاور اللاصقة مع النصّ.
    */
    this.rowDir$.set(this.control?.ltrRow() ? 'ltr' : null);
    this.chevron$.set(this.control?.indicator === 'chevron');
    this.sync();
  }

  /** يربط المعرّف والوصف وحالة الخطأ بعنصر الإدخال المُسقَط. */
  private sync(): void {
    const control = this.control;
    if (!control) {
      return;
    }

    const invalid = !!this.error$();

    /*
      `aria-describedby` يشير إلى الرسالة إن وُجدت، وإلى النصّ المساعد وإلّا.
      لا يُجمعان: الرسالة تحلّ محلّ النصّ المساعد بصريًا، فجمعهما يجعل قارئ
      الشاشة يقرأ تعليمة لم تعد ظاهرة.
    */
    const describedBy = invalid || this.success$()
      ? this.messageId
      : this.hint$()
        ? this.hintId
        : null;

    control.wire(this.controlId, describedBy, this.required$());
    control.setLabelId(this.labelId);
    control.setInvalid(invalid);
    control.setAriaInvalid(invalid);
  }
}
