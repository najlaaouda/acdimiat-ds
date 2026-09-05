import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  ViewEncapsulation,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Params, RouterLink } from '@angular/router';

/* ============================================================================
   Acadimiat UI — مسار التنقّل
   ----------------------------------------------------------------------------
   يجيب سؤالين: أين أنا في شجرة الموقع، وكيف أصعد منها درجة. وليس تاريخًا
   للتصفّح — الصعود درجةً غير الرجوع خطوةً، وزرّ المتصفّح يتكفّل بالثاني.

   ─── ما رصده الجرد في `<app-breadcrumbs>` القائم ──────────────────────────
     • `<div>` لا `<nav>`، وبلا `aria-label`، وبلا `<ol>`، وبلا `aria-current`.
     • روابط `href="javascript:void(0)"` مع `(click)` — ليست روابط: لا تُفتح
       في تبويب جديد، ولا يُنسخ عنوانها، ولا تعمل قبل الترطيب.
     • الفاصل `&gt;` مكتوب **داخل** نصّ الرابط. فيُقرأ «التقارير أكبر من»،
       ويصير الفاصل نفسه قابلًا للنقر.

   ─── لماذا وسم مخصّص لا سمة على عنصر أصلي ─────────────────────────────────
   المكوّن يملك **البنية** كلها: `<nav>` ثم `<ol>` ثم عنصر لكل درجة وفاصل
   بينها، ثم قرار الطيّ حين يطول المسار. وذلك يحتاج قالبًا وبيانات، لا سمة
   على عنصر قائم. وهو معلَم مسمّى كذلك — تمامًا كـ `<ap-tab-nav>`.

   ─── لماذا `[items]` لا إسقاط محتوى ───────────────────────────────────────
   الطيّ هو السبب: المكوّن يقرّر **أيّ** الدرجات تُعرض وأيّها تختفي خلف زرّ.
   والقرار على عقد مُسقَط يعني العبث بعُقد لا يملكها — هشّ ويكسر `@for`
   عند المستهلك. أما المصفوفة فالقرار عليها حساب خالص.

   ⚠️ القالب والأنماط في ملفين خارجيين — أي backtick داخل قالب سطري (ولو في
      تعليق) يُغلق النصّ الحرفي. لُدغ المشروع بذلك مرّتين.
   ============================================================================ */

/** درجة واحدة في المسار. غياب `link` يجعلها نصًّا لا رابطًا. */
export interface ApBreadcrumbItem {
  label: string;
  /**
   * يُمرَّر إلى `routerLink`. اتركه فارغًا لدرجة غير قابلة للنقر.
   *
   * ⚠️ المصفوفة ليست `readonly` عمدًا: مدخل `RouterLink` معلَن
   *    `string | any[]`، و`strictTemplates` يرفض تمرير `readonly` إليه.
   *    والخطأ **لا يظهر** في `npx tsc --noEmit` — فحص القوالب يملكه مصرّف
   *    Angular وحده، فلا يكشفه إلا `ng build` أو `ng serve`.
   */
  link?: string | (string | number)[];
  queryParams?: Params;
}

/** ما يُصيَّر فعلًا بعد حساب الطيّ. */
interface CrumbNode {
  key: string;
  kind: 'link' | 'text' | 'current' | 'ellipsis';
  label: string;
  link?: string | (string | number)[];
  queryParams?: Params;
  first: boolean;
}

@Component({
  selector: 'ap-breadcrumbs',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './ap-breadcrumbs.component.html',
  styleUrl: './ap-breadcrumbs.component.scss',
})
export class ApBreadcrumbsComponent {
  private readonly host = inject(ElementRef<HTMLElement>);

  private readonly items$ = signal<readonly ApBreadcrumbItem[]>([]);
  private readonly label$ = signal('مسار التنقّل');
  private readonly collapseAfter$ = signal(4);
  private readonly expanded$ = signal(false);

  @Input()
  set items(value: readonly ApBreadcrumbItem[]) {
    this.items$.set(value ?? []);
    /* مسار جديد ⇐ طيّ جديد. وإلّا بقي المسار التالي مفتوحًا بلا سبب. */
    this.expanded$.set(false);
  }

  /**
   * اسم المعلَم.
   *
   * صفحة اللوحة فيها ثلاثة معالم تنقّل على الأقلّ (القائمة الجانبية، وشريط
   * الأقسام، وهذا) — وثلاثة بلا أسماء أسوأ من واحد.
   */
  @Input()
  set label(value: string) {
    this.label$.set(value || 'مسار التنقّل');
  }

  /**
   * يُطوى ما زاد على هذا العدد من الدرجات.
   *
   * المطويّ هو **الوسط**: تبقى الأولى (الجذر) والأخيرتان (الأب والحالي).
   * وهي الثلاث التي تحمل المعنى — الجذر يقول أين نحن من الموقع، والأب هو
   * الوجهة الوحيدة التي يُرجَّح أن يقصدها المستخدم.
   */
  @Input()
  set collapseAfter(value: number) {
    this.collapseAfter$.set(Math.max(3, value || 4));
  }

  protected readonly labelValue = this.label$.asReadonly();

  protected readonly collapsed = computed(
    () => !this.expanded$() && this.items$().length > this.collapseAfter$(),
  );

  protected readonly nodes = computed<CrumbNode[]>(() => {
    const items = this.items$();
    if (!items.length) {
      return [];
    }

    const lastIndex = items.length - 1;
    const toNode = (item: ApBreadcrumbItem, index: number): CrumbNode => ({
      key: `crumb-${index}`,
      /*
        الأخيرة ليست رابطًا ولو مُرِّر لها `link`: رابط يقود إلى الصفحة التي
        نحن فيها وعدٌ كاذب، وقارئ الشاشة يعلنه رابطًا فيحسبه وجهةً أخرى.
      */
      kind: index === lastIndex ? 'current' : item.link ? 'link' : 'text',
      label: item.label,
      link: item.link,
      queryParams: item.queryParams,
      first: index === 0,
    });

    if (!this.collapsed()) {
      return items.map(toNode);
    }

    return [
      toNode(items[0], 0),
      { key: 'crumb-ellipsis', kind: 'ellipsis', label: '…', first: false },
      toNode(items[lastIndex - 1], lastIndex - 1),
      toNode(items[lastIndex], lastIndex),
    ];
  });

  /** عدد الدرجات المخفية — يُعلن في اسم الزرّ فلا يكون «…» وحده. */
  protected readonly hiddenCount = computed(() =>
    this.collapsed() ? this.items$().length - 3 : 0,
  );

  /* ─────────────────────────────────────────────────────────────────────
     فتح المطويّ
     ─────────────────────────────────────────────────────────────────────
     ⚠️ الزرّ يختفي بمجرّد الفتح — فيسقط التركيز إلى `<body>` ويضيع مكان
        مستخدم لوحة المفاتيح من الصفحة. ولذلك يُنقل التركيز إلى أوّل درجة
        كُشفت: هي بالضبط ما طلبه الزرّ.

     ولا `aria-expanded` عليه: السمة تصف ضاغطًا **يبقى** ليقول إنه مفتوح،
     وهذا يزول. الاسم وحده يكفي، وفيه العدد.
     ───────────────────────────────────────────────────────────────────── */
  protected expand(): void {
    this.expanded$.set(true);

    const root = this.host.nativeElement as HTMLElement;
    const view = root.ownerDocument?.defaultView;
    if (!view) {
      return;
    }

    /* بعد دورة الرسم: العُقد المكشوفة لم تدخل الـ DOM بعد في هذه اللحظة. */
    view.requestAnimationFrame(() => {
      const links = root.querySelectorAll<HTMLElement>('.ap-breadcrumbs__link');
      /* الأولى هي الجذر وكانت ظاهرة أصلًا؛ الثانية أوّل ما كُشف. */
      (links[1] ?? links[0])?.focus();
    });
  }
}
