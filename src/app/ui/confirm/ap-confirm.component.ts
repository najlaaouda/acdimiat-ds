import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  ViewEncapsulation,
  computed,
  effect,
  isDevMode,
  signal,
} from '@angular/core';

import { ApButtonComponent } from '../button/ap-button.component';
import { ApModalComponent, ApModalSize } from '../modal/ap-modal.component';

/* ============================================================================
   Acadimiat UI — نافذة التأكيد
   ----------------------------------------------------------------------------
   سؤال، ثم ما سيحدث، ثم فعلان: الفعل نفسه و«إلغاء». لا أكثر.

   ─── لماذا مكوّن فوق `<ap-modal>` لا نسخة منها في كل شاشة ─────────────────
   التأكيد أكثر نافذة تكرارًا في اللوحة، وكلّ نسخة منه تعيد كتابة الأشياء
   الأربعة نفسها: العنوان سؤالًا، والوصف جملةً، وزرًّا هادمًا، و«إلغاء». وأيّ
   منها يُنسى بصمت — والمنسيّ غالبًا هو نغمة الزرّ الهادم.

   وهي **بنية لا خدمة**: تُكتب في قالب المستهلك وتُقاد بـ `[(open)]`، تمامًا
   كـ `<ap-modal>`. الخدمة (‏`swal.fire(...).then(...)`‏) تُخفي النافذة عن
   القالب، فلا يعرف قارئ الشاشة ما فيها إلّا بتشغيل الشيفرة.

   ⛔ ولا تُغلق نفسها عند التأكيد. المستهلك يغلقها — وهو ما يجعل الانتظار
      ممكنًا أصلًا: `[loading]` يُبقيها مفتوحة والزرّ يدور حتى يردّ الخادم،
      فلا تختفي النافذة قبل أن يُعرف أوقع الفعل أم رُفض. وإغلاقها من الداخل
      كان سيجعل كل نداء يعرض نتيجته في مكان آخر.

   ─── قواعد النصّ (مالكها مهارة `acadimiat-ux-writing`) ─────────────────────
     العنوان   سؤال بلا نقطة — «حذف «محمد العتيبي»؟»
     الوصف     ما سيحدث فعلًا، جملة أو جملتان بنقطة
     المؤكِّد   الفعل — «حذف» · «تفعيل» — لا «نعم» ولا «موافق»
     الملغي    «إلغاء» بلا استثناء

   ⚠️ والعنوان لا يساوي زرّه هنا — عكس نوافذ الإدخال حيث الزرّ نصّ العنوان
      حرفيًّا. لأن العنوان **سؤال** والزرّ **فعل**، فلا يتطابقان.

   ⚠️ القالب والأنماط في ملفين خارجيين لا سطريَّين — أي backtick داخل قالب
      سطري (ولو في تعليق) يُغلق النصّ الحرفي. لُدغ المشروع بذلك مرّتين.
   ============================================================================ */

/**
 * نغمة الفعل المؤكَّد.
 *
 * `danger` للهادم وحده (حذف، إزالة). و«إيقاف التفعيل» ليس هادمًا: يُستعاد
 * بنقرة، فيأخذ النغمة العادية — ولون الخطر على فعل قابل للتراجع يجعل الأحمر
 * بلا معنى حين يقع الحذف فعلًا.
 */
export type ApConfirmTone = 'default' | 'danger';

/**
 * رفضٌ من الخادم، يُقال داخل النافذة نفسها.
 *
 * ─── لماذا في النافذة لا في إشعار ─────────────────────────────────────────
 * الرفض قرارٌ عن الصفّ الذي سُئل عنه هنا، فمكانه حيث وقع السؤال. وشريطٌ أحمر
 * في زاوية الصفحة يقول القاعدة نفسها التي قالها الوصف قبل النقر يُقرأ إخبارًا
 * بعطل لا تذكيرًا بقاعدة — ولذلك بقي الإشعار ممنوعًا، وحلّت النافذة محلّه.
 *
 * والصمت وحده لم يكن كافيًا: إغلاقٌ بلا كلمة يترك المستخدم أمام صفٍّ لم يتحرّك
 * بلا ما يفسّر بقاءه، فيعيد المحاولة على أمل أن تنجح هذه المرّة.
 *
 * ⚠️ والنصّ هنا **خبرٌ عن هذا الصفّ** لا القاعدة المشروطة التي في `description`:
 *    تلك تقول «لا يمكن حذف المدرب إذا كان…» قبل النقر، وهذا يقول «هذا المدرب
 *    مالك…» بعده. وإعادةُ الجملة نفسها حرفيًّا تجعل النافذة تدور على نفسها.
 */
export interface ApConfirmRefusal {
  /** بديل السؤال: «تعذّر [الفعل] «الاسم»» — سطر واحد بلا نقطة. */
  heading: string;
  /** ما منع الفعل، ثم ما يفعله المستخدم إن كان له فعل. بنقطة. */
  description: string;
}


@Component({
  selector: 'ap-confirm',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [ApModalComponent, ApButtonComponent],
  templateUrl: './ap-confirm.component.html',
  styleUrl: './ap-confirm.component.scss',
})
export class ApConfirmComponent implements OnInit {
  private readonly open$ = signal(false);
  private readonly heading$ = signal('');
  private readonly description$ = signal('');
  private readonly confirmLabel$ = signal('');
  private readonly cancelLabel$ = signal('إلغاء');
  private readonly tone$ = signal<ApConfirmTone>('default');
  private readonly loading$ = signal(false);
  private readonly size$ = signal<ApModalSize>('sm');
  private readonly refusal$ = signal<ApConfirmRefusal | null>(null);

  /** يفتح النافذة ويغلقها — ثنائي الاتجاه مع `(openChange)` كـ `<ap-modal>`. */
  @Input()
  set open(value: boolean) {
    this.open$.set(!!value);
  }

  /**
   * السؤال. مطلوب.
   *
   * ⚠️ `@Input()` عادية ثم رمي في `ngOnInit` لا `@Input({ required: true })`:
   *    الأخيرة تُبطل أي `NgModule` يستورد المكوّن، فيظهر NG2012 في ملف بعيد
   *    لا علاقة له بالمدخل الناقص. القاعدة نفسها في `<ap-page-header>`.
   */
  @Input()
  set heading(value: string) {
    this.heading$.set(value ?? '');
  }

  /** ما سيحدث فعلًا. يُقرأ مع فتح النافذة عبر `aria-describedby`. */
  @Input()
  set description(value: string) {
    this.description$.set(value ?? '');
  }

  /** نصّ زرّ التأكيد — الفعل. مطلوب. */
  @Input()
  set confirmLabel(value: string) {
    this.confirmLabel$.set(value ?? '');
  }

  @Input()
  set cancelLabel(value: string) {
    this.cancelLabel$.set(value || 'إلغاء');
  }

  @Input()
  set tone(value: ApConfirmTone) {
    this.tone$.set(value ?? 'default');
  }

  /** يدور الزرّ وتبقى النافذة مفتوحة حتى يردّ الخادم. */
  @Input()
  set loading(value: boolean) {
    this.loading$.set(!!value);
  }

  /**
   * `sm` افتراضًا: النافذة سطران وزرّان، وعرضٌ أوسع يفرّق الزرَّين عن السؤال
   * بمسافة لا شيء فيها.
   */
  @Input()
  set size(value: ApModalSize) {
    this.size$.set(value ?? 'sm');
  }

  /**
   * يحوّل النافذة إلى **خبر رفض**: العنوان يصير «تعذّر …»، ووصفُ ما سيحدث
   * يُستبدل بسبب الرفض، ويُنزع زرّ الفعل فلا يبقى إلّا «إغلاق».
   *
   * ⛔ والمستهلك هو من يصفّرها عند فتح النافذة لصفٍّ آخر — كـ `[open]` تمامًا.
   *    المكوّن لا يمسّ مدخلًا يملكه غيره: تصفيرٌ من الداخل لا يبلغ إشارة
   *    المستهلك، فتعود القيمة القديمة عند أوّل كشف عن التغيّرات.
   */
  @Input()
  set refusal(value: ApConfirmRefusal | null) {
    if (isDevMode() && value && (!value.heading || !value.description)) {
      throw new Error(
        '[ap-confirm] رفضٌ بلا عنوان أو بلا سبب. مرّر الاثنين — ' +
          '«تعذّر حذف «محمد العتيبي»» ثم سببًا يقول ما منع الفعل.',
      );
    }
    this.refusal$.set(value ?? null);
  }

  @Output() readonly openChange = new EventEmitter<boolean>();
  @Output() readonly confirmed = new EventEmitter<void>();

  protected readonly openValue = this.open$.asReadonly();
  protected readonly headingValue = this.heading$.asReadonly();
  protected readonly descriptionValue = this.description$.asReadonly();
  protected readonly confirmLabelValue = this.confirmLabel$.asReadonly();
  protected readonly cancelLabelValue = this.cancelLabel$.asReadonly();
  protected readonly loadingValue = this.loading$.asReadonly();
  protected readonly sizeValue = this.size$.asReadonly();
  protected readonly refusalValue = this.refusal$.asReadonly();

  /* العنوان سؤالٌ حتى يقع الرفض، فيصير خبرًا. وتركُ السؤال قائمًا فوق سبب
     الرفض يجعل النافذة تسأل وتجيب في آنٍ واحد. */
  protected readonly activeHeading = computed(() => this.refusal$()?.heading || this.heading$());

  /* ووصفُ ما سيحدث يسقط مع وقوع الرفض: لم يعد شيء سيحدث. */
  protected readonly activeDescription = computed(() =>
    this.refusal$() ? '' : this.description$(),
  );

  /* «إغلاق» لا «إلغاء» — الاستثناء الوحيد لقاعدة زرّ الخروج: لم يبقَ فعلٌ
     يُلغى، فالخادم رفضه، والزرّ لا يفعل إلّا إخفاء الخبر. */
  protected readonly closeLabel = 'إغلاق';

  protected readonly confirmVariant = computed(() =>
    this.tone$() === 'danger' ? ('danger' as const) : ('primary' as const),
  );

  /** يستهلكه التوثيق لعرض التركيبة الحالية. */
  readonly descriptor = computed(() => `${this.tone$()} · ${this.size$()}`);

  /**
   * ⚠️ `{ read: ElementRef }` لا بدّ منها: `apButton` **مكوّن** لا موجّه، فالمتغيّر
   *    المرجعي على العنصر يعود بنسخة المكوّن لا بعنصره. وبدونها يمرّ التصريح
   *    بالنوع ويقع الخطأ صامتًا وقت التشغيل.
   */
  @ViewChild('refusalClose', { read: ElementRef })
  private refusalClose?: ElementRef<HTMLButtonElement>;

  constructor() {
    /*
      زرّ الفعل يُنزع من الشجرة لحظة الرفض — ومعه التركيز الذي كان عليه، فيسقط
      إلى `<body>` خارج النافذة. فينتقل التركيز إلى «إغلاق»، بينما يُعلَن خبر
      الرفض نفسه من `role="alert"` على سببه — يُنطق عند إدراجه في الشجرة.

      ⚠️ و`setTimeout` لا استدعاء مباشر: الزرّ لم يدخل الشجرة بعدُ حين يجري
         الأثر — القاعدة نفسها في `focusFirstInvalidField`.
    */
    effect(() => {
      if (!this.refusal$() || !this.open$()) {
        return;
      }
      setTimeout(() => this.refusalClose?.nativeElement?.focus?.());
    });
  }

  ngOnInit(): void {
    if (!isDevMode()) {
      return;
    }
    if (!this.heading$()) {
      throw new Error('[ap-confirm] نافذة تأكيد بلا سؤال. مرّر [heading] — «حذف المدرب؟».');
    }
    if (!this.confirmLabel$()) {
      throw new Error('[ap-confirm] زرّ تأكيد بلا نصّ. مرّر [confirmLabel] بالفعل نفسه — «حذف».');
    }
    /*
      «نعم» و«لا» يُقرآن منزوعَين من سياقهما في شجرة إمكانية الوصول: من
      يتنقّل بين الأزرار يسمع «نعم» بلا السؤال. والقاعدة مكتوبة في
      `patterns.md § Modal` ضمن الممنوعات.
    */
    if (['نعم', 'لا', 'موافق'].includes(this.confirmLabel$().trim())) {
      throw new Error(
        '[ap-confirm] زرّ التأكيد فعل لا جواب: «حذف» لا «نعم». ' +
          'الزرّ يُقرأ وحده في شجرة إمكانية الوصول، فلا يحمل السؤال معه.',
      );
    }
  }

  /** كل مسار إغلاق يمرّ من هنا — النافذة نفسها تُطلق `(openChange)` مرّة. */
  protected onOpenChange(open: boolean): void {
    this.open$.set(open);
    this.openChange.emit(open);
  }

  protected onCancel(): void {
    this.onOpenChange(false);
  }

  protected onConfirm(): void {
    if (this.loading$() || this.refusal$()) {
      return;
    }
    this.confirmed.emit();
  }
}
