import {
  ChangeDetectionStrategy,
  Component,
  Input,
  ViewEncapsulation,
  computed,
  isDevMode,
  signal,
} from '@angular/core';

/* ============================================================================
   Acadimiat UI — رسومات النظام
   ----------------------------------------------------------------------------
   اثنتا عشرة رسمة مسطّحة ثنائية اللون تخدم الحالات الفارغة والمقفلة في
   اللوحة كلّها. رُسمت من سلّم البنفسج نفسه، فلا إعادة تلوين لها ولا ترخيص.

   ─── لماذا عنصر لا سمة ─────────────────────────────────────────────────────
   قاعدة المكتبة أن المكوّن سمةٌ على عنصر أصيل (`<button apButton>`)، والاستثناء
   حاوٍ أو **بديل** لا أداة تحكّم. وهذا بديل: لا يوجد عنصر أصيل يُحسَّن — إذ
   البديل الطبيعي `<img>`، وهو بالضبط ما لا نريده (انظر أدناه). فالعنصر هنا
   في صفّ `<ap-select>` و`<ap-modal>`، لا في صفّ `[apButton]`.

   ─── لماذا SVG سطريّ لا `<img src="…">` ────────────────────────────────────
   ثلاثة أسباب، كلّها تُبطل ملفّ الصورة الخارجيّ:

   1. **الصورة الخارجية لا ترث `var()`.** ألوان الرسمة تتجمّد في الملف، فتخرج
      عن طبقة التوكنات كلّها — وهو ما تمنعه قاعدة «صفر قيمة خام» صراحةً.
      وإعادة التلوين تصير تحرير ستّ عشرة صورة يدويًّا.
   2. **مسرح المعاينة في موقع التوثيق `ShadowDom`.** والخصائص المخصّصة تعبر
      الجذر الظلّي، والأوراق العامّة لا تعبره — فرسمٌ يقرأ التوكنات يعمل في
      الموضعين، وورقةٌ خارجية تعمل في أحدهما.
   3. **الوضع المفروض** (`forced-colors`) لا يبلغ محتوى ملفٍّ خارجيّ أصلًا.

   ─── لماذا `data-tone` لا لونٌ في السمة ────────────────────────────────────
   كل شكل يعلن **دوره** لا قيمته، والقيمة تُحسم في الورقة. سبع نغمات، وكل
   منها سطرٌ واحد في `ap-illustration.component.scss` — فتغيير الهوية كلّها
   سبعة أسطر، لا اثنتا عشرة رسمة. وهي الطريقة نفسها التي تكتب بها أنواع
   `<ap-badge>` خصائصها المحلّية.

   ⚠️ **لا تُسقِط هذه الرسمة في منفذ الأيقونة `[apEmptyStateIcon]`.**
      ورقة `<ap-empty-state>` تكتب على أيقونتها `fill: none; stroke:
      currentcolor` — وهي القاعدة الصحيحة لأيقونة خطّية، وهي التي تمحو رسمًا
      مسطّحًا محوًا تامًّا: كل شكل بلا تعبئة وبحدٍّ رفيع، فتظهر الرسمة هيكلًا
      مشوّهًا لا فراغًا — أي لا خطأ في الطرفية ولا شيء يدلّ على السبب.
      المنفذ الصحيح `[apEmptyStateIllustration]`، وله صندوقه وقواعده.

   ⚠️ ولا `<text>` في أيّ رسمة. نصٌّ داخل الرسم يربطه بخطٍّ قد لا يكون حُمِّل
      فيرتدّ بمقاسٍ آخر، ويُدخل اتجاه الكتابة في رسمٍ لا اتجاه له. ولذلك
      «الصفحة غير موجودة» لافتةُ طرقٍ لا الرقم 404.
   ============================================================================ */

/**
 * اسم الرسمة. المجموعة مغلقة عمدًا: رسمةٌ لكل **معنى** لا لكل شاشة، وشاشتان
 * تقولان الشيء نفسه تأخذان الرسمة نفسها. وزيادة اسمٍ هنا قرارٌ يُوثَّق في
 * صفحة `/design-system/components/empty-state`، لا إضافةٌ عابرة.
 */
export type ApIllustrationName =
  | 'no-data'
  | 'no-results'
  | 'not-found'
  | 'no-messages'
  | 'no-notifications'
  | 'no-content'
  | 'no-files'
  | 'no-analytics'
  | 'no-versions'
  | 'no-templates'
  | 'plan-locked'
  | 'nothing-selected';

const AP_ILLUSTRATION_NAMES: readonly ApIllustrationName[] = [
  'no-data',
  'no-results',
  'not-found',
  'no-messages',
  'no-notifications',
  'no-content',
  'no-files',
  'no-analytics',
  'no-versions',
  'no-templates',
  'plan-locked',
  'nothing-selected',
];

/** مقاس الرسمة. `md` داخل صفحة أو تبويب؛ `sm` داخل بطاقة أو جدول. */
export type ApIllustrationSize = 'md' | 'sm';

@Component({
  selector: 'ap-illustration',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './ap-illustration.component.html',
  styleUrl: './ap-illustration.component.scss',
  host: {
    '[attr.data-size]': 'sizeValue()',
    /*
      زخرفيّة دائمًا: المعنى في عنوان الحالة الفارغة ووصفها، والرسمة تعيد
      قوله رسمًا. وهي القاعدة نفسها المكتوبة على كل أيقونات النظام.
    */
    'aria-hidden': 'true',
  },
})
export class ApIllustrationComponent {
  private readonly name$ = signal<ApIllustrationName | ''>('');
  private readonly size$ = signal<ApIllustrationSize>('md');

  /**
   * اسم الرسمة من المجموعة المغلقة.
   *
   * ⚠️ اسمٌ خارجها لا يرسم شيئًا و`@switch` تسقط بلا حالة مطابقة — أي مساحة
   *    خالية بلا خطأ. ولذلك يُرمى في وضع التطوير برسالة تسمّي الاسم المجهول
   *    وتعدّد المتاح، لا بخطأ نوعٍ في ملفٍّ آخر. وهي الطريقة نفسها المتّبعة
   *    في `<ap-page-header heading>` بدل `@Input({ required: true })` التي
   *    تُبطل أي NgModule يستورد المكوّن.
   */
  @Input()
  set name(value: ApIllustrationName) {
    this.name$.set(value ?? '');
  }

  @Input()
  set size(value: ApIllustrationSize) {
    this.size$.set(value ?? 'md');
  }

  protected readonly sizeValue = computed(() => this.size$());

  protected readonly nameValue = computed<ApIllustrationName | ''>(() => {
    const value = this.name$();

    if (isDevMode() && value && !AP_ILLUSTRATION_NAMES.includes(value)) {
      throw new Error(
        `<ap-illustration>: لا توجد رسمة باسم «${value}». ` +
          `الأسماء المتاحة: ${AP_ILLUSTRATION_NAMES.join('، ')}.`,
      );
    }

    return value;
  });
}
