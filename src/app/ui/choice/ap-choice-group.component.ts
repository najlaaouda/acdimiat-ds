import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  Input,
  QueryList,
  ViewEncapsulation,
  signal,
} from '@angular/core';

import { ApRadioDirective } from './ap-radio.directive';

/* ============================================================================
   Acadimiat UI — مجموعة الخيارات
   ----------------------------------------------------------------------------
   عنوان واحد فوق عدّة خيارات، وربطه بها ربطًا دلاليًا حقيقيًا.

   ─── لماذا `<fieldset>` و`<legend>` ───────────────────────────────────────
   العنوان فوق مجموعة راديو ليس زخرفًا: هو السؤال الذي تجيب عنه الخيارات
   («مستوى الظهور»)، ومن دونه يسمع مستخدم قارئ الشاشة «عام»، «خاص»،
   «برابط» بلا معرفة بما تجيب عنه.

   و`<legend>` هو الوسيلة الوحيدة في HTML لإسناد اسم إلى مجموعة عناصر تحكّم:
   يُعلَن مع كل خيار داخلها فيُقرأ «مستوى الظهور، عام، زرّ اختيار، 1 من 3».
   والبديل الشائع — `<div>` بعنوان بجانبه — لا ينتج أي رابط.

   ⚠️ `<fieldset>` يحمل أنماطًا افتراضية من المتصفّح ومن `bootstrap.css`
      (حدّ، حشوة، هوامش على `legend`) — كلّها مُصفّرة في الورقة أدناه.

   ─── الاسم المشترك ────────────────────────────────────────────────────────
   المجموعة تضبط `name` على كل راديو داخلها. هذا ليس تسهيلًا: راديوهات بلا
   اسم مشترك تتصرّف كمربّعات اختيار — تُحدَّد كلّها معًا — وهو خلل صامت لا
   يُنتج خطأً في أي مكان، ويُكتشف عادةً بعد وصول بيانات خاطئة إلى الخادم.

   الاسم المكتوب صراحةً في القالب يفوز دائمًا — انظر `setName`.
   ============================================================================ */

let groupCounter = 0;

/**
 * مظهر المجموعة.
 *
 * `card` يضع كل خيار في بطاقة بحدّ يُلوَّن عند الاختيار — للخيارات
 * **المصيرية** القليلة التي تحمل شرحًا: الدور، الباقة، طريقة الدفع. وهو
 * مظهر المجموعة لا مظهر الخيار الواحد عمدًا: بطاقةٌ بين صفوف عارية تُقرأ
 * عطلًا لا تمييزًا.
 *
 * ⛔ ولا يُستعمل لقائمة خيارات قصيرة بلا وصف — عشر بطاقات لكلمة واحدة في
 *    كلٍّ منها تُطيل القائمة ثلاثة أضعاف بلا معلومة إضافية.
 */
export type ApChoiceGroupAppearance = 'plain' | 'card';

@Component({
  selector: 'ap-choice-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './ap-choice-group.component.scss',
  host: {
    '[attr.data-appearance]': 'appearanceValue()',
    '[attr.data-orientation]': 'orientationValue()',
    '[attr.data-invalid]': 'errorValue() ? "true" : null',
  },
  template: `
    <fieldset
      class="ap-choice-group__set"
      [attr.aria-describedby]="describedBy()"
      [attr.aria-invalid]="errorValue() ? 'true' : null"
    >
      @if (labelValue()) {
        <legend
          class="ap-choice-group__legend"
          [class.ap-choice-group__legend--hidden]="labelHiddenValue()"
        >
          {{ labelValue() }}
          @if (requiredValue()) {
            <span class="ap-choice-group__required" aria-hidden="true">(مطلوب اختياره)</span>
          }
        </legend>
      }

      <!-- التعليمة قبل الخيارات: تُقرأ قبل الاختيار لا بعده. -->
      @if (hintValue() && !errorValue()) {
        <p class="ap-choice-group__hint" [id]="hintId">{{ hintValue() }}</p>
      }

      <div class="ap-choice-group__options"><ng-content /></div>

      @if (errorValue()) {
        <p class="ap-choice-group__message" role="alert" [id]="messageId">{{ errorValue() }}</p>
      }
    </fieldset>
  `,
})
export class ApChoiceGroupComponent implements AfterContentInit {
  private readonly label$ = signal<string | null>(null);
  private readonly hint$ = signal<string | null>(null);
  private readonly error$ = signal<string | null>(null);
  private readonly required$ = signal(false);
  private readonly labelHidden$ = signal(false);
  private readonly appearance$ = signal<ApChoiceGroupAppearance>('plain');
  private readonly orientation$ = signal<'vertical' | 'horizontal'>('vertical');
  private readonly name$ = signal<string | null>(null);

  /* `descendants` مطلوب: الخيارات تعيش داخل `<ap-choice>` لا مباشرةً هنا. */
  @ContentChildren(ApRadioDirective, { descendants: true })
  private radios?: QueryList<ApRadioDirective>;

  readonly groupId = `ap-choice-group-${++groupCounter}`;
  readonly hintId = `${this.groupId}-hint`;
  readonly messageId = `${this.groupId}-message`;

  @Input()
  set label(value: string | null) {
    this.label$.set(value);
  }

  /** يُخفي العنوان بصريًا ويُبقيه لقارئ الشاشة. */
  @Input()
  set labelHidden(value: boolean) {
    this.labelHidden$.set(!!value);
  }

  @Input()
  set hint(value: string | null) {
    this.hint$.set(value);
  }

  @Input()
  set error(value: string | null) {
    this.error$.set(value);
  }

  @Input()
  set required(value: boolean) {
    this.required$.set(!!value);
  }

  /**
   * اسم مجموعة الراديو. يُضبط على كل راديو داخلها.
   *
   * تركه فارغًا يولّد اسمًا فريدًا — فمجموعتان في الصفحة نفسها لا تندمجان
   * حتى لو نُسي الاسم في الاثنتين.
   */
  @Input()
  set name(value: string | null) {
    this.name$.set(value);
  }

  @Input()
  set appearance(value: ApChoiceGroupAppearance) {
    this.appearance$.set(value ?? 'plain');
  }

  /** أفقي للخيارين أو الثلاثة القصيرة فقط — ما زاد يُقرأ صفًّا مزدحمًا. */
  @Input()
  set orientation(value: 'vertical' | 'horizontal') {
    this.orientation$.set(value ?? 'vertical');
  }

  protected readonly labelValue = this.label$.asReadonly();
  protected readonly labelHiddenValue = this.labelHidden$.asReadonly();
  protected readonly hintValue = this.hint$.asReadonly();
  protected readonly errorValue = this.error$.asReadonly();
  protected readonly requiredValue = this.required$.asReadonly();
  protected readonly orientationValue = this.orientation$.asReadonly();
  protected readonly appearanceValue = this.appearance$.asReadonly();

  /* الرسالة تحلّ محلّ التعليمة ولا تُضاف إليها — انظر `ap-field`. */
  protected readonly describedBy = () =>
    this.error$() ? this.messageId : this.hint$() ? this.hintId : null;

  ngAfterContentInit(): void {
    const name = this.name$() || this.groupId;
    this.radios?.forEach(radio => radio.setName(name));
    /* المجموعة قد تُبنى من قائمة ديناميكية — الاسم يلحق بكل خيار يُضاف. */
    this.radios?.changes.subscribe(() => this.radios?.forEach(radio => radio.setName(name)));
  }
}
