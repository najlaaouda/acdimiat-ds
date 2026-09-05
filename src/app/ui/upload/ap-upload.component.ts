import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  ViewEncapsulation,
  computed,
  forwardRef,
  signal,
} from '@angular/core';

import { ApAvatarComponent, ApAvatarShape } from '../avatar/ap-avatar.component';
import { ApFieldControl } from '../field/ap-field-control';
import { formatFileSize } from './file-size';

/* ============================================================================
   Acadimiat UI — حقل رفع الصور
   ----------------------------------------------------------------------------
   صورتان لحقل واحد، وهما ما يجعله مكوّنًا لا نمطًا:

     قبل الرفع  صفّ بحدّ متقطّع — مربّع فارغ ثمّ مطالبة
     بعد الرفع  الصفّ نفسه بحدّ متّصل — مصغَّرة، اسم، حجم، زرّ حذف

   ⚠️ والبنية **واحدة** في الحالتين عمدًا: مربّع في البداية ثمّ نصّ. فالصورة
      حين تصل تحلّ محلّ المربّع في موضعه ومقاسه، ولا يتحرّك شيء آخر — بخلاف
      التخطيط المتمركز (أيقونة فوق نصّ) الذي يعيد بناء الصفّ عند أوّل رفع
      فيقفز الحقل وما تحته.

   ─── لماذا لا يكفي input[type=file] عاريًا ────────────────────────────────
   لأن زرّه ونصّه يرسمهما نظام التشغيل ولا يقبلان CSS البتّة — كقائمة
   select الأصلية تمامًا، وهو السبب نفسه الذي أوجد ap-select. وهو يعرض
   «No file chosen» بالإنجليزية داخل واجهة عربية، ولا يعرض معاينة، ولا يقبل
   الإسقاط، ولا يملك طريقًا لحذف ما اختير.

   ─── الحاوي إلزامي: ap-upload داخل ap-field ───────────────────────────────
   المكوّن يحقّق ApFieldControl، فيأخذ الـ label والـ id والوصف والخطأ من
   حاويه كبقيّة عناصر التحكّم. أنماطه تعيش في ورقته هو (بخلاف apInput) لأنه
   مكوّن لا موجّهة — لكن قاعدة الحاوي تسري عليه كما تسري عليها.

   ⚠️ wire() مُتجاوَزة إلى signals لا تُكتب على عنصر — ap-field يناديها من
      ngAfterContentInit، قبل أن يوجد input هذا المكوّن أصلًا. الكتابة على
      ViewChild هناك تصيب undefined بلا خطأ، فيبقى الحقل بلا اسم. القيد نفسه
      الذي حكم ap-select.

   ─── عنصر التحكّم الحقيقي مخفيّ بصريًّا لا محذوف ─────────────────────────
   input[type=file] يبقى في الشجرة بتقنية sr-only — لا display: none ولا
   visibility: hidden. الفرق سلوكي بالكامل:

     • يبقى في ترتيب التنقّل، فـ Tab يصله وSpace/Enter يفتحان المنتقي بلا
       سطر JS واحد.
     • يبقى عنصر النموذج الذي يرتبط به label[for] ويحمل aria-describedby.
     • حلقة التركيز تُرسم على **المنطقة** عبر :has(~ …)، فيرى مستخدم
       لوحة المفاتيح ما يراه مستخدم الفأرة.

   والنقر على المنطقة يوكَّل إلى input.click() — ثلاثة أسطر، وهي الثمن
   الوحيد لهذا الترتيب.

   ⚠️ ولا label ثانٍ داخل المنطقة: عنصر واحد بـ labelين اسمُه المتاح **حاصل
      ضمّهما** — «صورة الغلاف اسحب الصورة هنا أو اختر من جهازك». الاسم يملكه
      ap-field وحده، والمطالبة نصّ يشرح لا يسمّي.

   ─── الإسقاط ليس بديلًا عن الاختيار ────────────────────────────────────
   السحب والإفلات لا يصله مستخدم لوحة المفاتيح ولا مستخدم اللمس. فهو هنا
   **زيادة** فوق المنتقي الأصلي لا طريقًا موازيًا له، وكل ما يفعله الإسقاط
   يفعله الاختيار.

   النصوص كلّها من component-copy.md §File Upload في مهارة
   acadimiat-ux-writing — لا صياغة مخترعة هنا.

   التوثيق: /design-system/components/upload
   ============================================================================ */

/**
 * ملف معروض في البطاقة.
 *
 * ليس File الأصلي: البطاقة تعرض كذلك ملفًا **قادمًا من الخادم** لا وجود له
 * في FileList — غلافًا رُفع في زيارة سابقة. والحقول الثلاثة هي كل ما يلزم
 * لرسمه، فالنوع واحد للحالتين.
 */
export interface ApUploadFile {
  /** الاسم كما يُعرض. */
  name: string;
  /** الحجم بالبايت. null حين لا يُعرف — ملف من الخادم بلا بيانات وصفية. */
  size?: number | null;
  /** مصدر المعاينة: رابط أو data: أو blob:. بلا قيمة ⇐ أيقونة صورة. */
  url?: string | null;
}

/** md داخل نموذج كامل · sm داخل بطاقة أو عمود ضيّق. */
export type ApUploadSize = 'md' | 'sm';

let uploadCounter = 0;

@Component({
  selector: 'ap-upload',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [ApAvatarComponent],
  styleUrl: './ap-upload.component.scss',
  providers: [{ provide: ApFieldControl, useExisting: forwardRef(() => ApUploadComponent) }],
  host: {
    '[attr.data-invalid]': "invalidValue() ? 'true' : null",
    '[attr.data-disabled]': "disabledValue() ? 'true' : null",
  },
  templateUrl: './ap-upload.component.html',
})
export class ApUploadComponent extends ApFieldControl {
  private readonly instanceId = `ap-upload-${++uploadCounter}`;

  @ViewChild('picker') private pickerRef?: ElementRef<HTMLInputElement>;

  /* ── ما يكتبه ap-field عبر wire() ──────────────────────────────────── */
  private readonly controlId$ = signal(this.instanceId);
  private readonly describedBy$ = signal<string | null>(null);
  private readonly required$ = signal(false);
  private readonly ariaInvalid$ = signal(false);
  private readonly invalid$ = signal(false);

  private readonly files$ = signal<ApUploadFile[]>([]);
  private readonly shape$ = signal<ApAvatarShape>('wide');
  private readonly accept$ = signal('image/*');
  private readonly multiple$ = signal(false);
  private readonly disabled$ = signal(false);
  private readonly progress$ = signal<number | null>(null);
  private readonly size$ = signal<ApUploadSize>('md');
  private readonly name$ = signal<string | null>(null);
  private readonly prompt$ = signal('اسحب الصورة هنا أو');
  private readonly dragging$ = signal(false);
  private readonly live$ = signal('');

  /** ثابت لا مدخل: الجزء القابل للنقر من المطالبة لا يتغيّر بتغيّر الكيان. */
  protected readonly actionText = 'اختر من جهازك';

  /* ── المدخلات ──────────────────────────────────────────────────────── */

  /**
   * الملفات المعروضة. الوضع المفرد يمرّر عنصرًا واحدًا أو لا شيء.
   *
   * مدخل لا حالة داخلية: المستهلك يملك القيمة — يرفعها إلى الخادم ويعيد
   * رابطها، أو يرفضها ويُبقي الحقل فارغًا. مكوّن يحتفظ بالملف لنفسه يعرض
   * ما لم يُقبل بعد.
   */
  @Input()
  set files(value: ApUploadFile[] | ApUploadFile | null | undefined) {
    if (!value) {
      this.files$.set([]);
    } else {
      this.files$.set(Array.isArray(value) ? value : [value]);
    }
  }

  /**
   * شكل المصغَّرة — القاعدة نفسها التي تحكم ap-avatar:
   *
   *   wide     شيء **مصوَّر** — غلاف، بانر، لقطة. الافتراضي.
   *   rounded  شيء مربّع — شعار أكاديمية، أيقونة.
   *   circle   شخص — صورة ملف شخصي.
   *
   * ⚠️ ليس خيارًا تجميليًّا: القصّ المربّع لغلافٍ أفقي يبتر طرفيه، فتعرض
   *    المعاينة صورةً غير التي رُفعت.
   */
  @Input()
  set shape(value: ApAvatarShape) {
    this.shape$.set(value ?? 'wide');
  }

  /**
   * سمة accept — تُمرَّر كما هي إلى العنصر الأصلي.
   *
   * الافتراضي `image/*` لأنه **ما تستخدمه اللوحة فعلًا**: 58 موضعًا في
   * `views/admin` كلّها `image/*`، ولا واحد منها يذكر امتدادًا. وافتراضٌ
   * أضيق (`image/png,image/jpeg`) كان يبدو أدقّ ويكسر شاشات قائمة بصمت —
   * صفحة الشعار تقول في نصّها «PNG, JPG, SVG»، فمنعُ SVG يخالف ما وعدت به.
   *
   * ⚠️ و`accept` **تصفية لا تحقّق**: تُتجاوَز باختيار «كل الملفات» في منتقي
   *    النظام، ولا تسري على الإسقاط أصلًا. الحكم النهائي للخادم — انظر
   *    الكتلة أدناه عن غياب `constraints`.
   */
  @Input()
  set accept(value: string) {
    this.accept$.set(value ?? '');
  }

  @Input()
  set name(value: string) {
    this.name$.set(value || null);
  }

  @Input()
  set multiple(value: boolean) {
    this.multiple$.set(!!value);
  }

  @Input()
  set disabled(value: boolean) {
    this.disabled$.set(!!value);
  }

  /**
   * نسبة اكتمال الرفع 0–100، أو null حين لا رفع جارٍ.
   *
   * القيمة تأتي من المستهلك لأن الرفع يقع عنده: HttpClient مع
   * reportProgress. مكوّن يرفع بنفسه كان يفرض نقطة نهاية وطريقة مصادقة.
   */
  @Input()
  set progress(value: number | null | undefined) {
    if (value === null || value === undefined || !Number.isFinite(value)) {
      this.progress$.set(null);
      return;
    }
    this.progress$.set(Math.min(100, Math.max(0, Math.round(value))));
  }

  /** sm داخل بطاقة أو عمود ضيّق — يقلّص حشوة المنطقة الرأسية وحدها. */
  @Input()
  set size(value: ApUploadSize) {
    this.size$.set(value ?? 'md');
  }

  /**
   * صدر المطالبة. الافتراضي «اسحب الصورة هنا أو»، ويُغيَّر حين يكون المرفوع
   * غير صورة («اسحب الملف هنا أو»).
   *
   * ⚠️ يُكتب بلا الجزء القابل للنقر: ذلك ثابت المكوّن، وتمريره كان يسمح
   *    بصياغتين لفعل واحد في شاشتين.
   */
  @Input()
  set prompt(value: string) {
    this.prompt$.set(value || 'اسحب الصورة هنا أو');
  }

  /* ══════════════════════════════════════════════════════════════════════
     ⛔ لا مدخل `constraints` — وغيابه قرار، لا نقص.
     ----------------------------------------------------------------------
     سطر «PNG أو JPG · حتى 2MB» كان موجودًا هنا وحُذف، لأن كل ما كان يمكن
     أن يُكتب فيه **كذب مُثبَت** في هذا المشروع:

       • الحجم  لا شيء في اللوحة يفحص حجم صورة. صِفر. (الفحوص الوحيدة:
                100 MB للفيديو في موضعين، و10 MB لمرفقات التذاكر في
                موضعين.) والقرار المعتمد أن الحجم يقرّره **الخادم** لا
                العميل — فلا رقم يُكتب هنا أصلًا.

       • الصيغة  `accept` في اللوحة `image/*` في 58 موضعًا، وSVG يمرّ فعلًا
                ويُرفع بنجاح. فسطرٌ يقول «PNG أو JPG» يصف واقعًا غير قائم.

     ولا مكان لبقايا الوعد: `IMAGE_UPLOAD_HINTS` عشرة نصوص تعد بـ «حتى 2MB»
     و«400×400 بكسل» ولا يقرؤها أحد، فترتفع صورة 50 ميجابايت بصمت تحتها.

     ⚠️ والغياب هنا **بنيوي لا تحريري**: بلا مدخل، لا يستطيع أحد كتابة وعد
        لا يفي به. هذا هو الفرق بين قاعدة تُكتب في وثيقة وقاعدة يفرضها
        النوع.

     وما يخصّ الحقل حقًّا — «لا تظهر عند تضمين النموذج» — يعيش في
     `<ap-field hint>`، وهو وصفٌ لا وعد. وما يرفضه الخادم يُنقل نصُّه كما هو
     إلى `<ap-field error>`.
     ══════════════════════════════════════════════════════════════════════ */

  /* ── المخرجات ──────────────────────────────────────────────────────── */

  /** ملفات اختارها المستخدم — بالمنتقي أو بالإسقاط، بلا تمييز. */
  @Output() readonly selected = new EventEmitter<File[]>();

  /** طلب حذف. أثناء الرفع هو إلغاء له — الزرّ نفسه، والاسم المتاح يتغيّر. */
  @Output() readonly removed = new EventEmitter<{ index: number; file: ApUploadFile }>();

  /* ── ما يقرؤه القالب ───────────────────────────────────────────────── */
  protected readonly controlId = this.controlId$.asReadonly();
  protected readonly describedBy = this.describedBy$.asReadonly();
  protected readonly requiredValue = this.required$.asReadonly();
  protected readonly ariaInvalid = this.ariaInvalid$.asReadonly();
  protected readonly invalidValue = this.invalid$.asReadonly();
  protected readonly filesValue = this.files$.asReadonly();
  protected readonly shapeValue = this.shape$.asReadonly();
  protected readonly acceptValue = computed<string | null>(() => this.accept$() || null);
  protected readonly nameValue = this.name$.asReadonly();
  protected readonly multipleValue = this.multiple$.asReadonly();
  protected readonly disabledValue = this.disabled$.asReadonly();
  protected readonly progressValue = this.progress$.asReadonly();
  protected readonly sizeValue = this.size$.asReadonly();
  protected readonly promptValue = this.prompt$.asReadonly();
  protected readonly dragging = this.dragging$.asReadonly();
  protected readonly liveMessage = this.live$.asReadonly();

  /**
   * المنطقة تظهر حين لا ملف، أو حين يقبل الحقل أكثر من ملف — فالإضافة لا
   * تنتهي بأوّل اختيار. وفي الحالة المفردة تختفي وتحلّ البطاقة محلّها:
   * منطقةُ إسقاطٍ فوق ملفٍ موجود تسأل سؤالًا أُجيب عنه.
   */
  protected readonly showZone = computed(() => this.multiple$() || this.files$().length === 0);

  /* ── عقد ApFieldControl ────────────────────────────────────────────── */

  override wire(id: string, describedBy: string | null, required: boolean): void {
    this.controlId$.set(id);
    this.describedBy$.set(describedBy);
    this.required$.set(required);
  }

  override setAriaInvalid(invalid: boolean): void {
    this.ariaInvalid$.set(invalid);
  }

  setInvalid(value: boolean): void {
    this.invalid$.set(value);
  }

  /* ── السلوك ────────────────────────────────────────────────────────── */

  protected sizeLabel(file: ApUploadFile): string {
    return formatFileSize(file.size);
  }

  protected removeLabel(file: ApUploadFile): string {
    if (this.progress$() !== null) {
      return 'إلغاء الرفع';
    }
    /* الاسم يميّز حين تتجاور عدّة بطاقات؛ وبطاقةٌ واحدة لا تحتاج تمييزًا. */
    return this.multiple$() ? `حذف ${file.name}` : 'حذف الصورة';
  }

  /**
   * توكيل النقر.
   *
   * ⚠️ الحارس ليس تجميلًا: بلا الشرط يعيد نقرُ الـ input نفسه استدعاء
   *    click() عليه، فيدخل الحدث في حلقة. وهو غير ممكن اليوم لأن الـ input
   *    خارج المنطقة، لكنه يصير ممكنًا بأوّل نقل له إلى داخلها.
   */
  protected openPicker(event: Event): void {
    if (this.disabled$()) {
      return;
    }
    const picker = this.pickerRef?.nativeElement;
    if (!picker || event.target === picker) {
      return;
    }
    picker.click();
  }

  protected onPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.emitFiles(Array.from(input.files ?? []));
    /*
      تفريغ القيمة بعد الإرسال: بدونه لا يُطلق change عند اختيار **الملف
      نفسه** مرّةً ثانية — وهو بالضبط ما يفعله من حذف صورةً ثمّ أعاد
      اختيارها، فيبدو الحقل معطَّلًا بلا خطأ في أي مكان.
    */
    input.value = '';
  }

  protected onDragOver(event: DragEvent): void {
    if (this.disabled$()) {
      return;
    }
    /*
      المتصفّح يفتح الملف المُسقَط في تبويب جديد ما لم يُمنع الافتراضي —
      فيغادر المستخدم النموذج غير المحفوظ. المنع لازم على dragover كل مرّة،
      لا على drop وحده.
    */
    event.preventDefault();
    this.dragging$.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    /*
      dragleave يُطلق كذلك عند العبور فوق **الأبناء** — الأيقونة والنصّ —
      فتومض الحالة مع كل حركة داخل المنطقة. relatedTarget هو ما دخلته
      المؤشّرة: إن كان داخل المنطقة فالمغادرة لم تقع.
    */
    const next = event.relatedTarget as Node | null;
    const zone = event.currentTarget as HTMLElement;
    if (next && zone.contains(next)) {
      return;
    }
    this.dragging$.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging$.set(false);
    if (this.disabled$()) {
      return;
    }
    this.emitFiles(Array.from(event.dataTransfer?.files ?? []));
  }

  protected onRemove(index: number, file: ApUploadFile): void {
    if (this.disabled$()) {
      return;
    }
    this.live$.set(this.progress$() !== null ? 'أُلغي الرفع.' : `حُذفت ${file.name}.`);
    this.removed.emit({ index, file });
    /* التركيز يعود إلى المنتقي: الزرّ يزيل نفسه، فبلا ذلك يسقط إلى body. */
    this.pickerRef?.nativeElement.focus();
  }

  private emitFiles(files: File[]): void {
    if (!files.length) {
      return;
    }
    /* الوضع المفرد يأخذ الأوّل: الإسقاط قد يحمل عدّة ملفات ولو منع
       multiple ذلك في المنتقي. */
    const accepted = this.multiple$() ? files : files.slice(0, 1);
    this.live$.set(
      accepted.length === 1 ? `اختيرت ${accepted[0].name}.` : `اختيرت ${accepted.length} ملفات.`,
    );
    this.selected.emit(accepted);
  }
}
