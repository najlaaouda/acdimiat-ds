import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import {
  ApBadgeComponent,
  ApBadgeVariant,
  ApCheckboxDirective,
  ApChoiceComponent,
  ApMediaCellComponent,
  ApSortChange,
  ApSortDirection,
  ApTableComponent,
  ApTableSortComponent,
} from 'src/app/ui';

/* ============================================================================
   معاينة حيّة — بنية الجدول
   ----------------------------------------------------------------------------
   الثابت هو القالب نفسه — انظر التعليق في `button-variants.demo.ts`.

   ⚠️ لا عنصر خام واحد في هذا القالب. كل ما في الخلايا مكوّن من النظام:
      `<ap-choice>` و`<ap-media-cell>` و`<ap-badge>`، ومعها `[apTableDrag]`
      و`[apTableAction]`. وهذا هو الاختبار الحقيقي للجدول: أن تكون العناصر
      التي يحتاجها موجودة قبله لا بعده.

   ─── ما يُثبته هذا المثال ──────────────────────────────────────────────────
   • **مرّر بالمؤشّر على أي صفّ**: يظهر مقبض السحب في البداية (يمينًا) وزرّ
     النقاط في النهاية. وكلاهما ظاهر بلا تمرير أفقي، لأن عموديهما مثبَّتان
     من الطرفين.
   • **حدّد صفًّا**: يظهر شريط الإجراءات الجماعية أسفل الجدول.
   • عمودا الاختيار والاسم مثبَّتان في البداية، وعمود الإجراءات في النهاية.
   • البريد والهاتف والتاريخ **لا تُقصّ أبدًا** — لا يُنسخ بريد ناقص ولا
     يُتّصل برقم ناقص. أمّا اسم الدورة فيُقصّ بعد ثلاث كلمات.
   • صورة الدورة **مستطيلة** لا دائرية: المنتج يُصوَّر أفقيًا، والقصّ المربّع
     يبتر طرفيه.
   ============================================================================ */

export const TABLE_ANATOMY_SOURCE = `
<ap-table
  caption="طلبات الشراء — آخر 30 يومًا"
  minWidth="1180px"
  [selectedCount]="picked().size"
  [totalCount]="200"
  [itemNoun]="orderNoun"
>
  <table>
    <thead>
      <tr>
        <!--
          التثبيت يُعلَن على رأس العمود وحده، والمكوّن ينشره على خلايا الجسم
          ويحسب الإزاحات بنفسه. data-pinned للبداية، data-pinned-end للنهاية.
        -->
        <th scope="col" data-pinned="true" class="grip"><span class="ap-sr-only">ترتيب</span></th>
        <th scope="col" data-pinned="true" data-select="true">
          <ap-choice label="تحديد كل الطلبات" [labelHidden]="true">
            <input apCheckbox [checked]="allPicked()" (change)="toggleAll()" />
          </ap-choice>
        </th>
        <th scope="col" data-pinned="true" apTableSort="student" columnLabel="المتدرّب"
            [direction]="dirFor('student')" (sortChange)="sort($event)">المتدرّب</th>
        <th scope="col">الدورة</th>
        <th scope="col" data-nowrap="true">البريد</th>
        <th scope="col" data-nowrap="true">الهاتف</th>
        <th scope="col" data-numeric="true" apTableSort="amount" columnLabel="المبلغ"
            [direction]="dirFor('amount')" (sortChange)="sort($event)">المبلغ</th>
        <th scope="col">الحالة</th>
        <th scope="col" data-nowrap="true">تاريخ الطلب</th>
        <!--
          رأس عمود الأوامر بلا نصّ مرئي: أزراره تشرح نفسها. والاسم يبقى في
          الشجرة داخل ap-sr-only — خليّة رأس بلا اسم متاح تُعلَن «عمود ١٠»
          وتترك خلايا الجسم بلا رأس تُنسب إليه.

          والصنف من ورقة ap-table لا من ورقة عامّة: المسرح هنا ShadowDom،
          ولا تعبره الأوراق العامّة.
        -->
        <th scope="col" data-pinned-end="true" data-actions="true">
          <span class="ap-sr-only">الأوامر</span>
        </th>
      </tr>
    </thead>
    <tbody>
      @for (order of rows(); track order.id) {
        <!--
          الحمل يبدأ من المقبض لا من الصفّ كلّه.

          سمة draggable على الصفّ دائمًا تجعل أي سحب داخله — تحديد نصّ في خليّة
          البريد مثلًا — يبدأ عملية نقل. ولذلك تُرفع السمة عند الضغط على
          المقبض وحده وتُخفض بعد الإفلات.
        -->
        <tr
          [attr.data-selected]="picked().has(order.id) ? 'true' : null"
          [attr.data-dragging]="dragId() === order.id ? 'true' : null"
          [draggable]="armed() === order.id"
          (dragstart)="onDragStart(order.id)"
          (dragover)="onDragOver($event, order.id)"
          (dragend)="onDragEnd()"
          (drop)="onDragEnd()"
        >
          <td>
            <button
              type="button"
              apTableDrag
              (pointerdown)="armed.set(order.id)"
              (pointerup)="armed.set(null)"
              (keydown)="onGripKey($event, order.id)"
              [attr.aria-label]="'نقل صفّ ' + order.student"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01" />
              </svg>
            </button>
          </td>

          <td>
            <ap-choice [label]="'تحديد طلب ' + order.student" [labelHidden]="true">
              <input apCheckbox [checked]="picked().has(order.id)" (change)="toggle(order.id)" />
            </ap-choice>
          </td>

          <!-- شخص ⇐ أفاتار دائري. الاسم لا يُقصّ: هو هويّة الصفّ. -->
          <td>
            <ap-media-cell shape="circle" size="sm" [title]="order.student" />
          </td>

          <!-- منتج ⇐ صورة مستطيلة، واسم يُقصّ بعد ثلاث كلمات -->
          <td>
            <ap-media-cell
              shape="wide"
              size="sm"
              [maxWords]="3"
              [src]="order.cover"
              [title]="order.course"
              [subtitle]="order.lessons + ' درسًا'"
            />
          </td>

          <!--
            الاتجاه على النصّ لا على الخليّة.

            سمة dir="ltr" على الخليّة تقلب معها text-align: start إلى اليسار،
            فيهرب البريد إلى الطرف المقابل لبقيّة العمود. والـ span يعطي
            المحتوى اللاتيني اتجاهه الصحيح ويترك محاذاة الخليّة كما هي.
          -->
          <td data-nowrap="true"><span dir="ltr">{{ order.email }}</span></td>
          <td data-nowrap="true"><span dir="ltr">{{ order.phone }}</span></td>
          <td data-numeric="true">{{ order.amount }}</td>

          <td>
            <ap-badge [variant]="order.variant">{{ order.status }}</ap-badge>
          </td>

          <td data-nowrap="true">{{ order.date }}</td>

          <td data-actions="true">
            <button type="button" apTableAction [attr.aria-label]="'خيارات طلب ' + order.student">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </button>
          </td>
        </tr>
      }
    </tbody>
  </table>

  <!--
    الترتيب من الأخفّ أثرًا إلى الأثقل: التصدير يقرأ ولا يكتب، وتغيير الحالة
    يكتب، والحذف يهدم. والشريط يظهر فجأة تحت المؤشّر لحظة التحديد، فأوّل زرّ
    فيه هو الأقرب إلى نقرة غير مقصودة.
  -->
  <div apTableBulkActions>
    <button type="button">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
      </svg>
      تصدير المحدَّد
    </button>
    <button type="button">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
      تغيير الحالة
    </button>
    <button type="button" data-tone="danger" (click)="clearSelection()">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
      </svg>
      حذف
    </button>
  </div>
</ap-table>
`;

interface OrderRow {
  id: number;
  student: string;
  email: string;
  phone: string;
  cover: string;
  course: string;
  lessons: number;
  amount: string;
  status: string;
  variant: ApBadgeVariant;
  date: string;
}

/*
  صورة نائبة حقيقية من أصول المشروع — لا مستطيل رمادي.

  المعاينة بصور وهمية تكذب في أهمّ ما يُفترض أن تُظهره: كيف يتصرّف العمود
  مع صورة فعلية — قصّها، ونسبتها، ووزنها البصري بجوار النصّ.
*/
const COVERS = [
  '/assets/images/courses/c1.jpg',
  '/assets/images/courses/c2.png',
  '/assets/images/courses/c3.jpg',
  '/assets/images/courses/course-0.png',
];

@Component({
  selector: 'demo-table-anatomy',
  standalone: true,
  imports: [
    ApBadgeComponent,
    ApCheckboxDirective,
    ApChoiceComponent,
    ApMediaCellComponent,
    ApTableComponent,
    ApTableSortComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  /*
    ⚠️ لا backtick داخل هذه السلاسل ولا في تعليقاتها — يُغلق النصّ الحرفي.

    سطران فقط: عرض عمودَي المقبض والاختيار. كل ما عدا ذلك يأتي من المكوّنات —
    وصنف ap-sr-only منها كذلك، تُصدره ورقة ap-table فلا تُعاد كتابته هنا.
  */
  styles: [
    ':host { display: block; width: 100%; }',
    '.grip { width: 1%; }',
  ],
  template: TABLE_ANATOMY_SOURCE,
})
export class TableAnatomyDemo {
  private readonly data: OrderRow[] = [
    {
      id: 1,
      student: 'سارة العتيبي',
      email: 'sara.alotaibi@example.com',
      phone: '+966 55 123 4567',
      cover: COVERS[0 % COVERS.length],
      course: 'أساسيات التسويق الرقمي للمبتدئين',
      lessons: 12,
      amount: '1,250.00',
      status: 'مدفوع',
      variant: 'success',
      date: '12 أغسطس 2026',
    },
    {
      id: 2,
      student: 'خالد المطيري',
      email: 'khaled.almutairi@example.com',
      phone: '+966 50 987 6543',
      cover: COVERS[1 % COVERS.length],
      course: 'تصميم واجهات المستخدم الاحترافية',
      lessons: 8,
      amount: '480.00',
      status: 'قيد المراجعة',
      variant: 'warning',
      date: '14 أغسطس 2026',
    },
    {
      id: 3,
      student: 'نورة الدوسري',
      email: 'noura.aldosari@example.com',
      phone: '+966 53 445 2211',
      cover: COVERS[2 % COVERS.length],
      course: 'التحليل المالي للمنشآت الصغيرة',
      lessons: 21,
      amount: '2,100.00',
      status: 'مدفوع',
      variant: 'success',
      date: '18 أغسطس 2026',
    },
    {
      id: 4,
      student: 'عبدالله القحطاني',
      email: 'abdullah.alqahtani@example.com',
      phone: '+966 56 778 3390',
      cover: COVERS[3 % COVERS.length],
      course: 'إدارة المشاريع الاحترافية المتقدّمة',
      lessons: 30,
      amount: '75.50',
      status: 'مسترجع',
      variant: 'error',
      date: '20 أغسطس 2026',
    },
    {
      id: 5,
      student: 'ريم الشمري',
      email: 'reem.alshammari@example.com',
      phone: '+966 59 220 1145',
      cover: '',
      course: 'كتابة المحتوى التسويقي المؤثّر',
      lessons: 6,
      amount: '340.00',
      status: 'مدفوع',
      variant: 'success',
      date: '24 أغسطس 2026',
    },
  ];

  /*
    اسم المعدود في عدّاد الشريط: «تم تحديد 3 من 200 طلب».
    صيغ ثلاث لا كلمة واحدة — تمييز العدد يتغيّر بالعدد.
  */
  protected readonly orderNoun = {
    singular: 'طلب',
    dual: 'طلبين',
    plural: 'طلبات',
  };

  protected readonly picked = signal(new Set<number>());

  /* ── إعادة الترتيب بالسحب ────────────────────────────────────────────
     المنطق في المعاينة لا في المكوّن — والمكوّن لا يملك البيانات أصلًا:
     هو يوفّر المقبض ومظهر الصفّ المحمول، والترتيب يبقى حيث تعيش المصفوفة.
     ─────────────────────────────────────────────────────────────────── */

  /** الصفّ الذي ضُغط مقبضه — به وحده تُرفع سمة draggable. */
  protected readonly armed = signal<number | null>(null);
  /** الصفّ المحمول حاليًا. */
  protected readonly dragId = signal<number | null>(null);
  /** ترتيب المعرّفات بعد أي إعادة ترتيب. */
  private readonly order$ = signal<number[]>([]);
  private readonly sortState = signal<ApSortChange>({ column: '', direction: '' });

  /*
    الفرز يُطبَّق هنا لا في المكوّن.

    وهو المقصود: `apTableSort` يُعلن الحالة لقارئ الشاشة ويطلق الحدث، وتبقى
    البيانات حيث هي — `MatSort` أو منطق الصفحة. وهو ما يجعل ترحيل 115 رأس
    فرز قائمًا تغييرًا في العرض وحده.
  */
  protected readonly rows = computed(() => {
    const { column, direction } = this.sortState();

    /* الترتيب اليدوي يسود ما لم يُطلب فرز — والفرز يُلغيه ضمنًا، لأن عمودًا
       مفروزًا وترتيبًا يدويًا معًا يعني ترتيبين متناقضين في جدول واحد. */
    if (!column || !direction) {
      const manual = this.order$();
      if (!manual.length) {
        return this.data;
      }
      return manual
        .map(id => this.data.find(row => row.id === id))
        .filter((row): row is OrderRow => !!row);
    }
    const factor = direction === 'asc' ? 1 : -1;
    return [...this.data].sort((a, b) => {
      if (column === 'amount') {
        return (Number(a.amount.replace(/,/g, '')) - Number(b.amount.replace(/,/g, ''))) * factor;
      }
      return a.student.localeCompare(b.student, 'ar') * factor;
    });
  });

  protected readonly allPicked = computed(() => this.picked().size === this.data.length);

  protected dirFor(column: string): ApSortDirection {
    const state = this.sortState();
    return state.column === column ? state.direction : '';
  }

  protected sort(change: ApSortChange): void {
    this.sortState.set(change);
  }

  protected toggle(id: number): void {
    const next = new Set(this.picked());
    if (!next.delete(id)) {
      next.add(id);
    }
    this.picked.set(next);
  }

  protected toggleAll(): void {
    this.picked.set(this.allPicked() ? new Set() : new Set(this.data.map(r => r.id)));
  }

  protected clearSelection(): void {
    this.picked.set(new Set());
  }

  protected onDragStart(id: number): void {
    this.dragId.set(id);
  }

  protected onDragOver(event: DragEvent, overId: number): void {
    const dragged = this.dragId();
    if (dragged === null || dragged === overId) {
      return;
    }
    /* بلا هذا يرفض المتصفّح الإفلات ويعيد المؤشّر بعلامة المنع. */
    event.preventDefault();
    this.move(dragged, overId);
  }

  protected onDragEnd(): void {
    this.dragId.set(null);
    this.armed.set(null);
  }

  /*
    النقل بلوحة المفاتيح كذلك.

    السحب بالمؤشّر لا يصله من لا يستعمل فأرة، ولا بديل له في HTML أصلًا —
    فالمقبض يقبل السهمين ويحرّك الصفّ خطوةً واحدة (WCAG 2.1.1).
  */
  protected onGripKey(event: KeyboardEvent, id: number): void {
    const step = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
    if (!step) {
      return;
    }
    event.preventDefault();
    const ids = this.currentOrder();
    const from = ids.indexOf(id);
    const to = from + step;
    if (to < 0 || to >= ids.length) {
      return;
    }
    this.move(id, ids[to]);
  }

  private currentOrder(): number[] {
    const manual = this.order$();
    return manual.length ? manual : this.data.map(row => row.id);
  }

  private move(dragged: number, target: number): void {
    const ids = [...this.currentOrder()];
    const from = ids.indexOf(dragged);
    const to = ids.indexOf(target);
    if (from < 0 || to < 0) {
      return;
    }
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    this.order$.set(ids);
  }
}
