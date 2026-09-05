import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  Input,
  ViewEncapsulation,
  signal,
} from '@angular/core';

import { ApChoiceAppearance, ApChoiceControl } from './ap-choice-control';

/* ============================================================================
   Acadimiat UI — بنية الخيار
   ----------------------------------------------------------------------------
   حاوٍ واحد لمربّع الاختيار وزرّ الراديو والمفتاح. يملك الـ label والوصف
   والرسالة والربط الدلالي بينها وبين العنصر الأصلي المُسقَط فيه — كما يفعل
   `<ap-field>` للحقل النصّي، وللسبب نفسه: الربط اليدوي ينهار عند الحجم
   (C-05)، فالحلّ أن يصبح مستحيل النسيان.

   ─── لماذا حاوٍ واحد لثلاثة عناصر ─────────────────────────────────────────
   الثلاثة تختلف في الشكل المرسوم فقط. أمّا التخطيط (عنصر تحكّم + نصّ)،
   وهدف اللمس، وربط الـ label، وموضع الوصف والرسالة — فواحد حرفيًا. ثلاثة
   حاويات كانت ستعني ثلاث نسخ من المنطق نفسه تتباعد عند أول إصلاح.

   والشكل لا يُمرَّر مدخلًا هنا: يعلنه الموجّه الموضوع على العنصر — انظر
   `ap-choice-control.ts`.

   ─── ترتيب العناصر ────────────────────────────────────────────────────────
   عنصر التحكّم أولًا ثم النصّ، لأن العين تقرأ الحالة (محدَّد/غير محدَّد) قبل
   ما تعنيه. والاستثناء `layout="between"`: صفّ إعداد يبقى فيه العنوان في
   البداية والمفتاح في النهاية، فتصطفّ المفاتيح عموديًا في قائمة الإعدادات.

   ⚠️ ViewEncapsulation.None: أنماط `[apCheckbox]` و`[apRadio]` و`[apSwitch]`
      تعيش في ورقة هذا المكوّن لأن الموجّهات لا تملك أوراق أنماط. كل محدّد
      هنا يبدأ بـ `ap-choice`.
   ============================================================================ */

/* عدّاد وحدات لا قيمة عشوائية — يتطابق الخادم والمتصفّح فلا ينكسر الترطيب.
   انظر التعليق نفسه في `ap-field.component.ts`. */
let choiceCounter = 0;

export type ApChoiceLayout = 'start' | 'between';

@Component({
  selector: 'ap-choice',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './ap-choice.component.scss',
  host: {
    '[attr.data-layout]': 'layoutValue()',
    '[attr.data-invalid]': 'errorValue() ? "true" : null',
  },
  /*
    ⚠️ لا عنصر بين `<ng-content />` والشكل المرسوم بعده.

       كل أنماط الحالات هنا مبنيّة على محدّد الشقيق المباشر:
       `.ap-choice__native:checked + .ap-choice__visual`. أي غلاف يُدرج
       بينهما — ولو كان `<span>` تخطيطيًا — يقطع الرابط، فيبقى الشكل غير
       محدَّد مهما فعل المستخدم، بلا خطأ في أي مكان.

       والمسافة البيضاء نفسها لا تضرّ (المحدّد يتجاهل العُقد النصّية)، لكن
       الالتصاق يجعل القيد مرئيًا لمن يعدّل القالب لاحقًا.
  */
  template: `
    <div class="ap-choice__row">
      <span class="ap-choice__control"
        ><ng-content /><span class="ap-choice__visual" [attr.data-shape]="appearanceValue()" aria-hidden="true">
          @switch (appearanceValue()) {
            @case ('switch') {
              <!--
                الرمزان معًا داخل الإبهام ويتبادلان الظهور، كعلامتَي مربّع
                الاختيار. فتُقرأ الحالة بالشكل مرّتين: بموضع الإبهام وبرمزه.
              -->
              <span class="ap-choice__thumb"
                ><svg class="ap-choice__thumb-icon" viewBox="0 0 16 16">
                  <path class="ap-choice__thumb-icon-on" d="M3.5 8.5 6.5 11.5 12.5 4.5" />
                  <path class="ap-choice__thumb-icon-off" d="M5 5 11 11M11 5 5 11" />
                </svg
              ></span>
            }
            @case ('radio') {
              <span class="ap-choice__dot"></span>
            }
            @default {
              <!--
                المسارَان معًا في الشكل نفسه، ويتبادلان الظهور بالحالة.
                رسمهما شرطيًا في القالب كان سيعيد بناء العقدة عند كل تبديل،
                فتضيع أي حركة انتقال ويومض الشكل.
              -->
              <svg class="ap-choice__mark" viewBox="0 0 16 16">
                <path class="ap-choice__mark-check" d="M3.5 8.5 6.5 11.5 12.5 4.5" />
                <path class="ap-choice__mark-dash" d="M4 8h8" />
              </svg>
            }
          }
        </span></span
      >

      @if (labelValue()) {
        <span class="ap-choice__text">
          <label
            class="ap-choice__label"
            [class.ap-choice__label--hidden]="labelHiddenValue()"
            [attr.for]="controlId"
          >
            {{ labelValue() }}
            @if (requiredValue()) {
              <span class="ap-choice__required" aria-hidden="true">(مطلوب)</span>
            }
          </label>
          <!--
            الوصف مربوط بـ aria-describedby لا مضموم إلى الـ label: ضمّه
            كان سيجعل اسم الخيار في قارئ الشاشة جملتين، فيُقرأ كاملًا في كل
            تنقّل بين الخيارات — والاسم يجب أن يبقى قصيرًا مميّزًا.
          -->
          @if (descriptionValue()) {
            <span class="ap-choice__desc" [id]="descriptionId">{{ descriptionValue() }}</span>
          }
          <!--
            تفصيل يظهر **حين يُختار** الخيار وحده، بلا سطر TypeScript: الظهور
            من :has(:checked) في الورقة. وهو ما يجعل قائمة الاستثناءات تحت
            «مشرف» تُقرأ عند اختياره لا فوق كل الخيارات دائمًا.

            ⚠️ وموضعه داخل عمود النصّ لا بعد الصفّ: الصفّ ارتفاعه 40px (هدف
               اللمس)، فتفصيلٌ تحته يفصله عن تسميته فراغُ الصفّ كلّه — 12px
               مقيسة — لا فجوته المعلنة.

            ⚠️ وصفر مسافة بيضاء حوله: يُخفى بـ :empty.
          --><div class="ap-choice__detail"><ng-content select="[apChoiceDetail]" /></div>
        </span>
      }
    </div>

    @if (errorValue()) {
      <p class="ap-choice__message" role="alert" [id]="messageId">{{ errorValue() }}</p>
    }
  `,
})
export class ApChoiceComponent implements AfterContentInit {
  private readonly label$ = signal<string | null>(null);
  private readonly description$ = signal<string | null>(null);
  private readonly error$ = signal<string | null>(null);
  private readonly required$ = signal(false);
  private readonly labelHidden$ = signal(false);
  private readonly layout$ = signal<ApChoiceLayout>('start');
  private readonly appearance$ = signal<ApChoiceAppearance>('checkbox');

  @ContentChild(ApChoiceControl) private control?: ApChoiceControl;

  readonly controlId = `ap-choice-${++choiceCounter}`;
  readonly descriptionId = `${this.controlId}-desc`;
  readonly messageId = `${this.controlId}-message`;

  @Input()
  set label(value: string | null) {
    this.label$.set(value);
  }

  /** يُخفي الـ label بصريًا ويُبقيه لقارئ الشاشة. لا يُحذف أبدًا. */
  @Input()
  set labelHidden(value: boolean) {
    this.labelHidden$.set(!!value);
  }

  /** سطر تحت الـ label يشرح أثر الخيار. مربوط بـ `aria-describedby`. */
  @Input()
  set description(value: string | null) {
    this.description$.set(value);
    this.sync();
  }

  @Input()
  set error(value: string | null) {
    this.error$.set(value);
    this.sync();
  }

  @Input()
  set required(value: boolean) {
    this.required$.set(!!value);
    this.sync();
  }

  /** `between` = صفّ إعداد: النصّ في البداية والعنصر في النهاية. */
  @Input()
  set layout(value: ApChoiceLayout) {
    this.layout$.set(value ?? 'start');
  }

  protected readonly labelValue = this.label$.asReadonly();
  protected readonly labelHiddenValue = this.labelHidden$.asReadonly();
  protected readonly descriptionValue = this.description$.asReadonly();
  protected readonly errorValue = this.error$.asReadonly();
  protected readonly requiredValue = this.required$.asReadonly();
  protected readonly layoutValue = this.layout$.asReadonly();
  protected readonly appearanceValue = this.appearance$.asReadonly();

  /*
    الشكل يُقرأ من الموجّه المُسقَط، ولذلك لا يمكن قراءته قبل تهيئة المحتوى.

    ⚠️ ولذلك أيضًا لا يُربط `data-appearance` على المضيف: ربط المضيف
       يُقيَّم ضمن تحديث العرض الأب، أي **قبل** هذه اللحظة — فتكون القيمة
       متأخّرة دورةً كاملة وتُطلق تحذير التغيير بعد الفحص في وضع التطوير.
       الشكل يعيش على `.ap-choice__visual` داخل قالب هذا المكوّن، حيث
       يُقيَّم بعد `ngAfterContentInit` مباشرةً.
  */
  ngAfterContentInit(): void {
    if (this.control) {
      this.appearance$.set(this.control.appearance);
    }
    this.sync();
  }

  /** يربط المعرّف والوصف وحالة الخطأ بالعنصر المُسقَط. */
  private sync(): void {
    const control = this.control;
    if (!control) {
      return;
    }

    const invalid = !!this.error$();

    /* الرسالة تحلّ محلّ الوصف عند الخطأ — لا يُجمعان، للسبب نفسه المشروح
       في `ap-field.component.ts`. */
    const describedBy = invalid
      ? this.messageId
      : this.description$()
        ? this.descriptionId
        : null;

    control.wire(this.controlId, describedBy, this.required$());
    control.setInvalid(invalid);
    control.setAriaInvalid(invalid);
  }
}
