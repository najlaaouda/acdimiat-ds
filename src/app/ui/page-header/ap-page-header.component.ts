import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  ViewEncapsulation,
  isDevMode,
  signal,
} from '@angular/core';

/* ============================================================================
   Acadimiat UI — رأس الصفحة
   ----------------------------------------------------------------------------
   عنوان الصفحة وجملة تقول **ما هي**، وأفعالها الرئيسية في الطرف المقابل.

   ─── ما رصده الجرد ─────────────────────────────────────────────────────────
   106 ملفات تستعمل `form-head`، منها 87 فيه عنوان `<h2>` — وصفر وصف. فمن
   يفتح الشاشة أوّل مرّة يستنتج وظيفتها من الجدول الذي تحتها، ومن يبحث عن
   «الصلاحيات» لا يعرف أنها هنا.

   والوصف ليس زينة: هو أوّل ما يُقرأ بعد العنوان، وأرخص مكان يُجاب فيه سؤال
   «هل أنا في الصفحة الصحيحة؟».

   ─── لماذا `<h1>` لا `<h2>` ───────────────────────────────────────────────
   عنوان الصفحة هو عنوانها الأعلى. النمط القائم يبدأ من `<h2>` بلا `<h1>`
   فوقه إطلاقًا — أي أن شجرة العناوين تبدأ من المستوى الثاني، ومن يتصفّح
   بقائمة العناوين (وهي أشيع وسيلة تنقّل لدى مستخدمي قارئات الشاشة) يجد
   الصفحة بلا رأس. ولا `<h1>` في هيكل اللوحة يزاحمه: سبعة فقط في اللوحة كلّها.

   ─── لماذا الوصف نصّ مُمرَّر والرابط مُسقَط ────────────────────────────────
   الجملة نصّ ثابت، والرابط عنصر تفاعلي له مظهره من `[apButton]`. فصلهما
   يعني أن المكوّن لا يبني HTML من سلسلة نصّية (وهو باب حقن)، ويترك للكاتب
   أن يضع رابطًا أو زرًّا أو لا شيء.

   ⚠️ القالب والأنماط في ملفين خارجيين — أي backtick داخل قالب سطري (ولو في
      تعليق) يُغلق النصّ الحرفي. لُدغ المشروع بذلك مرّتين.
   ============================================================================ */

@Component({
  selector: 'ap-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './ap-page-header.component.html',
  styleUrl: './ap-page-header.component.scss',
})
export class ApPageHeaderComponent implements OnInit {
  private readonly heading$ = signal('');
  private readonly description$ = signal('');

  /**
   * عنوان الصفحة. يُصيَّر `<h1>`.
   *
   * ⚠️ مطلوب — لكن **ليس** بـ `@Input({ required: true })`.
   *
   * جُرِّبت فأسقطت الوحدة كلّها: يرفض مصرّف Angular هنا المكوّن في مصفوفة
   * `imports` لوحدة `NgModule`، فتصير `UsersModule` غير صالحة، ويتسلسل الخطأ
   * إلى كل مكوّن standalone يستوردها (NG2012 على `manage-articles`). والرسالة
   * تشير إلى الملف البعيد لا إلى المصدر، فيضيع الوقت في مطاردتها.
   *
   * والإلزام هنا بالرمي في وضع التطوير — وهو ما تفعله `<ap-tab-nav>` بـ
   * `label`، ويعطي رسالة عربية تقول ما الناقص بدل خطأ نوع.
   */
  @Input()
  set heading(value: string) {
    this.heading$.set(value ?? '');
  }

  /**
   * جملة واحدة تقول ما هذه الصفحة.
   *
   * تبدأ بفعل الإدارة لا باسم الصفحة مكرَّرًا: «إدارة العملاء والمدربين…»
   * لا «صفحة المستخدمين». وتذكر ما **يُفعل** هنا لا ما يُعرض فقط.
   */
  @Input()
  set description(value: string) {
    this.description$.set(value ?? '');
  }

  protected readonly headingValue = this.heading$.asReadonly();
  protected readonly descriptionValue = this.description$.asReadonly();

  ngOnInit(): void {
    if (isDevMode() && !this.heading$()) {
      throw new Error('[ap-page-header] رأس صفحة بلا عنوان. مرّر heading.');
    }
  }
}

