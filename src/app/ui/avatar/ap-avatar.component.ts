import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation, computed, signal } from '@angular/core';

/* ============================================================================
   Acadimiat UI — الأفاتار
   ----------------------------------------------------------------------------
   ─── لماذا الشكل ليس تفصيلًا تجميليًا ─────────────────────────────────────
       دائري  → شخص (متدرّب، مدرّب، مستخدم)
       بزوايا → شيء  (منتج، دورة، ملف، أكاديمية)

   هذا التمييز مستقرّ عبر الواجهات كلها ويقرؤه المستخدم قبل النصّ. خلطه
   يجعل صفّ الجدول يقول شيئًا وصورته تقول آخر.

   ─── الأحرف الأولى ليست زخرفًا ────────────────────────────────────────────
   الجرد وجد صورًا في 17 ملفًا، ولا واحد منها يعالج غياب الصورة: الرابط
   المكسور يترك أيقونة المتصفّح المشوّهة داخل الخليّة. وهنا:

     • بلا `src` → الأحرف الأولى فورًا، بلا طلب شبكة أصلًا.
     • مع `src` يفشل → `(error)` يُسقط الصورة وتظهر الأحرف مكانها.

   والأحرف تُشتقّ من `name` نفسه الذي يصير `alt` — فمصدر واحد لا اثنان
   يتباعدان.

   ─── الاسم مرّة واحدة في شجرة إمكانية الوصول ───────────────────────────────
   الأفاتار في خليّة الجدول يجاور الاسم مكتوبًا. فلو حمل `alt="سارة العتيبي"`
   لقُرئ الاسم مرّتين متتاليتين. ولذلك `alt=""` افتراضًا (صورة زخرفية)،
   ويُمرَّر `decorative=false` صراحةً حين يقف الأفاتار وحده بلا نصّ بجواره.
   ============================================================================ */

/**
 * `circle`  شخص — الوجه يقع في مربّع، والقصّ الدائري لا يبتر منه شيئًا.
 * `rounded` شيء مربّع — أيقونة ملف، شعار أكاديمية.
 * `wide`    شيء **مصوَّر** — غلاف دورة، لقطة، بانر. مستطيل 4:3.
 *
 * ⚠️ صورة المنتج ليست أفاتارًا مربّعًا: هي تُلتقط أفقيًا في الغالب،
 *    والقصّ المربّع يبتر طرفيها ويترك وسطًا بلا معنى.
 */
export type ApAvatarShape = 'circle' | 'rounded' | 'wide';
export type ApAvatarSize = 'xs' | 'sm' | 'md' | 'lg';

@Component({
  selector: 'ap-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './ap-avatar.component.scss',
  host: {
    '[attr.data-shape]': 'shapeValue()',
    '[attr.data-size]': 'sizeValue()',
  },
  template: `
    @if (showImage()) {
      <img
        class="ap-avatar__img"
        [src]="srcValue()"
        [attr.alt]="decorativeValue() ? '' : nameValue()"
        [attr.role]="decorativeValue() ? 'presentation' : null"
        loading="lazy"
        decoding="async"
        (error)="onImageError()"
      />
    } @else {
      <!--
        منفذ الأيقونة قبل الأحرف: من يُسقط أيقونة يقصدها بديلًا صريحًا، ولا
        معنى لأن تُحسب له أحرفٌ ثم تُخفى. والغلاف يُخفى بـ :empty حين لا
        يُسقَط فيه شيء — ولذلك صفر مسافة بيضاء داخله.
      -->
      <span class="ap-avatar__icon" aria-hidden="true"><ng-content /></span>

      <!--
        الأحرف مخفيّة عن قارئ الشاشة دائمًا: هي بديل **بصري** عن الصورة،
        ونطقها («س ع») ضجيج لا معنى له. والاسم يصل من النصّ المجاور أو من
        سمة alt حين لا يكون الأفاتار زخرفيًا.
      -->
      @if (usesInitials()) {
        <span class="ap-avatar__initials" aria-hidden="true">{{ initials() }}</span>
      } @else {
        <!--
          البديل يقول **ما الغائب**، فيختلف باختلاف ما يمثّله الأفاتار:

            شخص بلا اسم  ⇐ أيقونة شخص
            شيء بلا غلاف ⇐ أيقونة صورة

          والأحرف تسبقهما للأشخاص وحدهم: الاسم يختصر إلى حرفيه فيبقى دالًّا
          على صاحبه. أمّا غلاف الدورة فلا يُختصر — «كتابة المحتوى التسويقي»
          ⇐ «كت» لا تقول شيئًا عن الصورة الغائبة، وتُقرأ خطأً في الرسم لا
          غيابًا في البيانات.
        -->
        <span class="ap-avatar__fallback" aria-hidden="true">
          @if (isPerson()) {
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
            </svg>
          } @else {
            <svg viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <circle cx="8.5" cy="9.5" r="1.5" />
              <path d="m3 16 4.5-4.5a2 2 0 0 1 2.8 0L16 17M14 14l1.5-1.5a2 2 0 0 1 2.8 0L21 15" />
            </svg>
          }
        </span>
      }
      @if (!decorativeValue() && nameValue()) {
        <span class="ap-avatar__sr">{{ nameValue() }}</span>
      }
    }
  `,
})
export class ApAvatarComponent {
  private readonly src$ = signal('');
  private readonly name$ = signal('');
  private readonly shape$ = signal<ApAvatarShape>('circle');
  private readonly size$ = signal<ApAvatarSize>('md');
  private readonly decorative$ = signal(true);
  /** يُرفع حين يفشل تحميل الصورة، فتحلّ الأحرف محلّها. */
  private readonly failed$ = signal(false);

  @Input()
  set src(value: string) {
    this.src$.set(value ?? '');
    /* مصدر جديد يستحقّ محاولة جديدة — وإلّا بقي الفشل لاصقًا بعد تصحيحه. */
    this.failed$.set(false);
  }

  /** الاسم الكامل. منه تُشتقّ الأحرف الأولى، وهو نصّ `alt` عند اللزوم. */
  @Input()
  set name(value: string) {
    this.name$.set(value ?? '');
  }

  /** انظر تعليق `ApAvatarShape` — الشكل يحمل معنى ولا يُختار تجميلًا. */
  @Input()
  set shape(value: ApAvatarShape) {
    this.shape$.set(value ?? 'circle');
  }

  @Input()
  set size(value: ApAvatarSize) {
    this.size$.set(value ?? 'md');
  }

  /**
   * `true` (الافتراضي) حين يجاور الأفاتارَ اسمٌ مكتوب — فلا يُقرأ مرّتين.
   * مرّر `false` حين يقف وحده في خليّة أو زرّ.
   */
  @Input()
  set decorative(value: boolean) {
    this.decorative$.set(value !== false);
  }

  protected readonly srcValue = this.src$.asReadonly();
  protected readonly nameValue = this.name$.asReadonly();
  protected readonly shapeValue = this.shape$.asReadonly();
  protected readonly sizeValue = this.size$.asReadonly();
  protected readonly decorativeValue = this.decorative$.asReadonly();

  protected readonly showImage = computed(() => !!this.src$() && !this.failed$());

  /*
    الشكل يحسم ما يمثّله الأفاتار، ولا يُسأل المستهلك عنه مرّة ثانية:
    الدائري شخص، وما عداه شيء.
  */
  protected readonly isPerson = computed(() => this.shape$() === 'circle');

  /*
    الأحرف للأشخاص **ذوي الأسماء** وحدهم.

    فلا مسار يُنتج غلاف دورة بحرفين — وهو خطأ لا يظهر في المراجعة لأن الحرفين
    يبدوان «تصميمًا» حتى ينظر أحدهم ويسأل ماذا يعنيان. ولا مسار يُنتج شخصًا
    بلا اسم بأيقونة صورة: الغائب هو الشخص لا صورته.
  */
  protected readonly usesInitials = computed(() => this.isPerson() && !!this.initials());

  /*
    حرفان من كلمتين، أو حرف واحد من كلمة.

    ⚠️ أداة التعريف «ال» تُتخطّى — وهذا ليس تحسينًا لغويًا بل إصلاح عطل.

       اللقب العربي يبدأ بها في الغالب الأعمّ: «العتيبي»، «المطيري»،
       «الدوسري»، «القحطاني». وأخذ أوّل حرف حرفيًا يعطي «ا» في كلّها، فتصير
       كل الأفاتارات في العمود «سا» و«خا» و«نا» و«عا» — حرف واحد مميّز
       بدل حرفين، وهو ما رُصد في اللقطة قبل الإصلاح.

       والشرط `length > 2` يحمي كلمةً هي «ال» نفسها أو تقاربها.

    ⚠️ بلا `slice(0, 2)` على السلسلة كاملةً: الحرف قد يكون زوجًا من الوحدات
       (surrogate pair)، وقصّ السلسلة يشطره فيظهر محرف تالف. الأخذ من أوّل
       كل كلمة يتجنّب ذلك أصلًا.

    ⚠️ ولا `charAt`: تعامل [...str] مع النصّ نقاطَ ترميز لا وحدات UTF-16.
  */
  protected readonly initials = computed(() => {
    const words = this.name$().trim().split(/\s+/).filter(Boolean);
    if (!words.length) {
      return '';
    }
    const first = firstLetter(words[0]);
    if (words.length === 1) {
      return first;
    }
    return first + firstLetter(words[words.length - 1]);
  });

  protected onImageError(): void {
    this.failed$.set(true);
  }
}

/**
 * أوّل حرف **دالّ** في كلمة، بتخطّي أداة التعريف العربية.
 *
 * «العتيبي» ⇐ ع   ·   «سارة» ⇐ س   ·   «Ahmed» ⇐ A
 */
function firstLetter(word: string): string {
  const letters = [...word];
  if (letters.length > 2 && letters[0] === 'ا' && letters[1] === 'ل') {
    return letters[2];
  }
  return letters[0] ?? '';
}
