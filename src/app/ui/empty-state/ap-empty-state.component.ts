import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  ViewChild,
  ViewEncapsulation,
  computed,
  isDevMode,
  signal,
} from '@angular/core';

/* ============================================================================
   Acadimiat UI — الحالة الفارغة
   ----------------------------------------------------------------------------
   كتلة موسَّطة: أيقونة، ثم عنوان، ثم وصف، ثم فعل أو فعلان. وأيٌّ من الأربعة
   قابل للغياب — أقصرُ صورة لها وصفٌ وزرّ.

   ─── ما رصده الجرد ─────────────────────────────────────────────────────────
   42 ملفًا في `views/admin` فيه كتلة «لا يوجد …» بصنف خاصّ بها:
   `funnel-list__empty` · `lectures-empty` · `sd-empty` · `rt-empty` ·
   `pv-empty` · `step-view__empty` … لا شيء مشترك بينها إلا المعنى.

   وتسعةُ ملفات أخرى تنسخ كتلة «ترقية الباقة» حرفيًّا: صورة `upgrade.png`
   بعرض 135px وصنف `red-filter`، ثم `<h3>`، ثم `<p>`، ثم
   `<button class="btn btn-primary">ترقية الباقة الان</button>` — وأكثر هذه
   الأزرار **بلا معالج نقر إطلاقًا**: زرّ يَعِد بالترقية ولا يفعل شيئًا.

   ─── لماذا مكوّن واحد للحالتين ────────────────────────────────────────────
   «لا يوجد شيء بعد» و«هذه الميزة ليست في باقتك» لا تختلفان في **البنية** ولا
   في المظهر: كلتاهما تشرح لماذا المساحة خالية وتعرض الطريق التالي. الفرق
   في النصّ والأيقونة، وكلاهما يأتي من المستهلك.

   ⛔ ولا `tone` ولا لون هنا: الحالة الفارغة هادئة بطبعها، وتلوينها يحوّلها
      إلى إنذار عن شيء لم يقع فيه خطأ. والزرّ وحده هو ما يحمل اللون — من
      `[apButton]`، حيث تُقاس أنواعه.

   ─── لماذا الوصف محتوى مُسقَط لا نصّ مُمرَّر ────────────────────────────────
   لأن أحد نصوص اللوحة الحقيقية **قائمةٌ نقطية**: صلاحيات المشرف تُستثنى
   منها ستّة بنود تُعدّ سطرًا سطرًا. ونصٌّ ممرَّر كان سيعني إمّا فقرةً واحدة
   مكدّسة بالفواصل، أو بناءَ HTML من سلسلة نصّية — وهو باب حقن. والإسقاط
   يترك للكاتب فقرةً أو قائمةً أو الاثنتين.

   ─── التخطيط ───────────────────────────────────────────────────────────────
       [apEmptyStateIllustration] رسمة النظام     (اختياري)
       [apEmptyStateIcon]         أيقونة خطّية     (اختياري)
       heading                    عنوان           (اختياري)
       <ng-content>               الوصف           (اختياري)
       [apEmptyStateActions]      زرّ أو زرّان     (اختياري)

   ─── منفذان للرسم لا واحد، والفصل تقنيّ لا ذوقيّ ────────────────────────────
   منفذ الأيقونة تُكتب عليه في الورقة `fill: none; stroke: currentcolor` —
   وهي القاعدة الصحيحة لأيقونة خطّية، وهي التي **تمحو** `<ap-illustration>`
   محوًا تامًّا: الرسمة مسطّحة معبّأة، فتخرج كل أشكالها بلا تعبئة وبحدٍّ رفيع
   فتُقرأ هيكلًا مشوّهًا لا رسمًا — بلا خطأ في الطرفية ولا شيء يدلّ على السبب.
   ولذلك للرسمة منفذها وصندوقها، بلا دائرةٍ تحتها (الدائرة موجودة لأن خطًّا
   رفيعًا يُقرأ رسمًا ناقصًا، والرسمة تملك كتلتها) وبلا قاعدة تعبئة أو حدّ.

   ⚠️ والمنفذان لا يجتمعان: رسمةٌ فوق أيقونة رسمان يقولان الشيء نفسه مرّتين،
      ويُرمى في وضع التطوير إن أُسقِطا معًا.

   ⚠️ **المحتوى داخل كتلة تحكّم لا يُطابَق ضدّ منفذ إسقاط.** زرّ داخل `@if`
      يحمل `apEmptyStateActions` يهبط في المنفذ **الافتراضي** — أي وسط الوصف
      — بلا أي خطأ. لفّ الكتلة بـ
      `<ng-container ngProjectAs="[apEmptyStateActions]">` وأسقط السمة عن
      الزرّ. وهي اللدغة نفسها الموثّقة على `<ap-pagination>` وعلى أزرار
      `<ap-page-header>` في `users.component.html`.

   ⚠️ القالب والأنماط في ملفين خارجيين لا سطريَّين — أي backtick داخل قالب
      سطري (ولو في تعليق) يُغلق النصّ الحرفي. لُدغ المشروع بذلك مرّتين.
   ============================================================================ */

/** حجم الكتلة. `md` تملأ مساحة صفحة أو تبويب؛ `sm` داخل بطاقة أو جدول. */
export type ApEmptyStateSize = 'md' | 'sm';

/**
 * `plain` نصٌّ في مكانه بلا سطح — للاستعمال داخل حاوٍ يملك حدَّه أصلًا
 * (`<ap-table>` مثلًا). و`card` تحمل سطحها وحدَّها ونصف قطرها، للحالة التي
 * تحلّ فيها الكتلة محلّ محتوى صفحة أو تبويب كامل.
 */
export type ApEmptyStateAppearance = 'plain' | 'card';

/** مستوى عنوان الكتلة داخل شجرة عناوين الصفحة. */
export type ApEmptyStateHeadingLevel = 2 | 3 | 4;

@Component({
  selector: 'ap-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './ap-empty-state.component.html',
  styleUrl: './ap-empty-state.component.scss',
  host: {
    '[attr.data-size]': 'sizeValue()',
    '[attr.data-appearance]': 'appearanceValue()',
  },
})
export class ApEmptyStateComponent implements AfterContentInit {
  @ViewChild('illustrationSlot', { static: true })
  private readonly illustrationSlot?: ElementRef<HTMLElement>;

  @ViewChild('iconSlot', { static: true })
  private readonly iconSlot?: ElementRef<HTMLElement>;

  private readonly heading$ = signal('');
  private readonly headingLevel$ = signal<ApEmptyStateHeadingLevel>(2);
  private readonly size$ = signal<ApEmptyStateSize>('md');
  private readonly appearance$ = signal<ApEmptyStateAppearance>('plain');

  /**
   * عنوان الكتلة — جملة واحدة تقول **لماذا** المساحة خالية، لا «لا توجد
   * بيانات».
   *
   * اختياري: أقصر صورة للكتلة وصفٌ وزرّ بلا عنوان، وهي الصحيحة داخل بطاقة
   * صغيرة يسمّيها عنوانٌ فوقها أصلًا — فعنوانٌ ثانٍ يكرّره.
   */
  @Input()
  set heading(value: string) {
    this.heading$.set(value ?? '');
  }

  /**
   * مستوى العنوان في شجرة الصفحة. الافتراضي `2`.
   *
   * ⚠️ ليس اختيارًا مظهريًّا: المقاس واحد في المستويات الثلاثة (من
   *    `--ap-empty-title-size`)، والمستوى يخصّ **التنقّل بالعناوين** وحده.
   *    الكتلة تحت `<ap-page-header>` (وهو `<h1>`) تأخذ `2`؛ وداخل قسم له
   *    عنوانه تأخذ `3`. وقفزُ مستوًى يكسر الشجرة لمن يتصفّح بها.
   */
  @Input()
  set headingLevel(value: ApEmptyStateHeadingLevel) {
    this.headingLevel$.set(value ?? 2);
  }

  @Input()
  set size(value: ApEmptyStateSize) {
    this.size$.set(value ?? 'md');
  }

  @Input()
  set appearance(value: ApEmptyStateAppearance) {
    this.appearance$.set(value ?? 'plain');
  }

  protected readonly headingValue = computed(() => this.heading$());
  protected readonly sizeValue = computed(() => this.size$());
  protected readonly appearanceValue = computed(() => this.appearance$());

  /*
    ⚠️ ثلاث إشارات منفصلة لا تعبير واحد في القالب: `strictTemplates` يرفض
       المقارنة على نوع مُضيَّق داخل `@switch` حين يكون المصدر `computed`
       بنوع اتحاد — والثلاث تُقرأ في القالب كما تُقرأ الرايات.
  */
  protected readonly isLevel3 = computed(() => this.headingLevel$() === 3);
  protected readonly isLevel4 = computed(() => this.headingLevel$() === 4);

  /*
    ⚠️ الفحص على **المحتوى المُسقَط** لا على مدخل، فلا سبيل إليه إلا بقراءة
       الغلافين بعد أن يمتلئا — و`ngAfterContentInit` هي أول لحظة يكون فيها
       المُسقَط في مكانه. و`static: true` لأن الغلافين خارج أي كتلة تحكّم،
       فيُحلّان قبل أول دورة كشف تغيير.
  */
  ngAfterContentInit(): void {
    if (!isDevMode()) {
      return;
    }

    const hasIllustration = (this.illustrationSlot?.nativeElement.childElementCount ?? 0) > 0;
    const hasIcon = (this.iconSlot?.nativeElement.childElementCount ?? 0) > 0;

    if (hasIllustration && hasIcon) {
      throw new Error(
        '<ap-empty-state>: أُسقِطت رسمة وأيقونة معًا. ' +
          'الكتلة تحمل رسمًا واحدًا — احذف [apEmptyStateIcon] أو [apEmptyStateIllustration].',
      );
    }
  }
}
