import {
  ChangeDetectionStrategy,
  Component,
  Input,
  ViewEncapsulation,
  computed,
  signal,
} from '@angular/core';

import { truncateWords } from '../text/truncate-words';
import { ApAvatarComponent, ApAvatarShape, ApAvatarSize } from './ap-avatar.component';

/* ============================================================================
   Acadimiat UI — خليّة الوسائط
   ----------------------------------------------------------------------------
   صورة/أفاتار + عنوان + سطر ثانوي. هي النمط الغالب في عمودَي «الاسم»
   و«المنتج» في جداول الإدارة، وكان مكرَّرًا يدويًا في كل جدول بمسافات
   ومقاسات مختلفة.

   ─── الشكل يتبع المحتوى، لا رغبة كاتب الشاشة ──────────────────────────────
       shape="circle"  → شخص (متدرّب، مدرّب)
       shape="rounded" → شيء  (منتج، دورة، ملف)

   والأفاتار داخلها **زخرفي دائمًا** (`decorative`): العنوان بجواره مكتوب،
   فلو حمل الأفاتار الاسم في `alt` لقُرئ مرّتين متتاليتين.

   ─── القصّ لا اللفّ ───────────────────────────────────────────────────────
   العنوان الطويل يُقصّ بثلاث نقاط ولا يلفّ إلى سطرين: ارتفاع الصفوف يبقى
   متساويًا فيبقى مسح العمود بالعين ممكنًا — وهو الغرض الوحيد من الجدول.
   والنصّ الكامل يبقى في `title` وفي الـ DOM، فلا يفقده قارئ الشاشة.

   ⚠️ أنماطها تعيش في `ap-avatar.component.scss` مع الأفاتار: لا تُستعمل
      خليّة الوسائط بلا أفاتار، وفصل الورقتين كان سيفرض استيرادين لبنية واحدة.
   ============================================================================ */

@Component({
  selector: 'ap-media-cell',
  standalone: true,
  imports: [ApAvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <ap-avatar
      [src]="srcValue()"
      [name]="titleValue()"
      [shape]="shapeValue()"
      [size]="sizeValue()"
      [decorative]="true"
    />

    <span class="ap-media-cell__text">
      <!--
        السمة title تحمل النصّ الكامل لأن العرض مقصوص بصريًا. وهي تلميح المتصفّح
        لا بديلًا دلاليًا — النصّ نفسه موجود في الـ DOM كاملًا.
      -->
      <span class="ap-media-cell__title" aria-hidden="true" [attr.title]="titleValue()">{{
        shownTitle()
      }}</span>

      <!--
        النسخة الكاملة لقارئ الشاشة حين يُقصّ المعروض.

        القصّ بالكلمات يحذف نصًّا من الـ DOM — بخلاف قصّ CSS الذي يُخفيه
        بصريًا ويُبقيه. فبلا هذه النسخة يفقد قارئ الشاشة بقيّة الاسم فعلًا،
        ويصير «محمد عبدالله بن…» هو كل ما يسمعه.
      -->
      @if (shownTitle() !== titleValue()) {
        <span class="ap-media-cell__sr">{{ titleValue() }}</span>
      }
      <span class="ap-media-cell__subtitle" [attr.title]="subtitleValue() || null">{{
        subtitleValue()
      }}</span>
    </span>
  `,
})
export class ApMediaCellComponent {
  private readonly src$ = signal('');
  private readonly title$ = signal('');
  private readonly subtitle$ = signal('');
  private readonly shape$ = signal<ApAvatarShape>('circle');
  private readonly size$ = signal<ApAvatarSize>('md');
  private readonly maxWords$ = signal(0);

  /** بلا قيمة تظهر الأحرف الأولى من `title` — لا رابط مكسور. */
  @Input()
  set src(value: string) {
    this.src$.set(value ?? '');
  }

  @Input({ required: true })
  set title(value: string) {
    this.title$.set(value ?? '');
  }

  /**
   * أقصى عدد كلمات يُعرض من العنوان قبل القصّ بثلاث نقاط.
   *
   * ⚠️ للأسماء وحدها. أمّا البريد والهاتف والتاريخ فلا تُقصّ إطلاقًا: الاسم
   *    الناقص يبقى معرّفًا («محمد عبدالله…» يكفي للتمييز)، والبريد الناقص
   *    لا يُنسخ ولا يُرسل إليه، والرقم الناقص لا يُتّصل به.
   *
   * صفر (الافتراضي) يُعطّل القصّ بالكلمات، ويبقى قصّ CSS عند الفيض وحده.
   */
  @Input()
  set maxWords(value: number) {
    this.maxWords$.set(Math.max(0, Number(value) || 0));
  }

  /** بريد، أو تصنيف، أو عدد — يُخفى السطر كاملًا بلا قيمة. */
  @Input()
  set subtitle(value: string) {
    this.subtitle$.set(value ?? '');
  }

  /** `circle` لشخص، `rounded` لشيء. */
  @Input()
  set shape(value: ApAvatarShape) {
    this.shape$.set(value ?? 'circle');
  }

  @Input()
  set size(value: ApAvatarSize) {
    this.size$.set(value ?? 'md');
  }

  protected readonly srcValue = this.src$.asReadonly();
  protected readonly titleValue = this.title$.asReadonly();
  protected readonly subtitleValue = this.subtitle$.asReadonly();
  protected readonly shapeValue = this.shape$.asReadonly();
  protected readonly sizeValue = this.size$.asReadonly();

  /*
    العنوان المعروض بعد القصّ بالكلمات.

    والقصّ لا يقع إلّا إذا كانت هناك كلمة **زائدة** فعلًا: اسم من ثلاث كلمات
    مع حدّ ثلاث كلمات يبقى كما هو بلا نقاط — والنقاط بعد نصّ كامل تَعِد بمزيد
    لا وجود له.
  */
  protected readonly shownTitle = computed(() =>
    truncateWords(this.titleValue(), this.maxWords$()),
  );
}
