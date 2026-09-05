import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import { ApColumnDef, ApColumnToggleComponent, ApTableComponent } from 'src/app/ui';

/* ============================================================================
   معاينة حيّة — تخصيص الأعمدة
   ----------------------------------------------------------------------------
   الثابت هو القالب نفسه — انظر التعليق في `button-variants.demo.ts`.

   ─── ما تراه هنا بالضبط ────────────────────────────────────────────────────
   افتح القائمة: تنزل **تحت الزرّ** محاذيةً حافّته التي يبدأ منها السطر (اليمنى
   في RTL). وكان موضعها قبل الإصلاح الزاوية العليا من الصفحة، لأن متغيّر القالب
   على `<button apButton>` كان يُرجع نسخة المكوّن لا عنصره، فتخرج دالّة التموضّع
   صامتةً قبل أن تكتب `top`/`left`. ولذلك `{ read: ElementRef }` هناك.

   ─── ولماذا القائمة بلا «الأوامر» ──────────────────────────────────────────
   عمود الأوامر ليس عمود بيانات بل بنية الجدول، فلا يُمرَّر إلى `[columns]`
   إطلاقًا — ويُلحق بالأعمدة الظاهرة بعد الترتيب فيبقى آخرًا مهما رُتّب ما
   قبله. أخفِ ما شئت وأعد الترتيب: العمود الأخير لا يبرح مكانه.

   ⚠️ ولا `storage` هنا: معاينة توثيق لا تكتب في `localStorage` المستخدم، وحفظ
      إخفاء جرّبه في صفحة توثيق يجعله يعود إليها بجدول ناقص لا يذكر سببه.
   ============================================================================ */

interface DemoRow {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  joined: string;
}

export const COLUMN_TOGGLE_BASIC_SOURCE = `
<div class="bar">
  <ap-column-toggle [columns]="dataColumns" (visibleChange)="visible.set($event)" />
</div>

<ap-table caption="المتدرّبون" minWidth="640px">
  <table>
    <thead>
      <tr>
        @for (key of visible(); track key) {
          <th scope="col" [attr.data-nowrap]="key === 'email' ? 'true' : null">
            {{ labelOf(key) }}
          </th>
        }
        <!--
          رأس عمود الأوامر بلا نصّ مرئي، واسمه باقٍ في الشجرة: خليّة رأس بلا
          اسم متاح تُعلَن «عمود ٦» وتترك خلايا الجسم بلا رأس تُنسب إليه.
        -->
        <th scope="col" data-actions="true">
          <span class="ap-sr-only">الأوامر</span>
        </th>
      </tr>
    </thead>
    <tbody>
      @for (row of rows; track row.id) {
        <tr>
          @for (key of visible(); track key) {
            <td [attr.data-nowrap]="key === 'email' ? 'true' : null">
              @if (key === 'email' || key === 'phone') {
                <span dir="ltr">{{ cell(row, key) }}</span>
              } @else {
                {{ cell(row, key) }}
              }
            </td>
          }
          <td data-actions="true">
            <button type="button" apTableAction [attr.aria-label]="'خيارات ' + row.name">
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
</ap-table>
`;

@Component({
  selector: 'docs-column-toggle-basic-demo',
  standalone: true,
  imports: [ApTableComponent, ApColumnToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  /* ⚠️ لا backtick داخل هذه السلاسل ولا في تعليقاتها — يُغلق النصّ الحرفي. */
  styles: [
    ':host { display: block; width: 100%; }',
    '.bar { display: flex; justify-content: flex-end;' +
      ' margin-block-end: var(--ap-space-3); }',
  ],
  template: COLUMN_TOGGLE_BASIC_SOURCE,
})
export class ColumnToggleBasicDemo {
  /*
    أعمدة البيانات وحدها. «الاسم» مقفل: هو هويّة الصفّ، وبإخفائه تصير الصفوف
    بلا أصحاب — ويُذكر مقفلًا لا محذوفًا لأنه عمود بيانات، وغيابه عن القائمة
    كان سيُقرأ سهوًا لا قاعدة.
  */
  readonly dataColumns: ApColumnDef[] = [
    { key: 'name', label: 'الاسم', locked: true },
    { key: 'email', label: 'البريد الإلكتروني' },
    { key: 'phone', label: 'رقم الموبايل' },
    { key: 'status', label: 'الحالة' },
    { key: 'joined', label: 'تاريخ الانضمام' },
  ];

  readonly visible = signal<string[]>(this.dataColumns.map(column => column.key));

  private readonly labels = computed(
    () => new Map(this.dataColumns.map(column => [column.key, column.label])),
  );

  readonly rows: DemoRow[] = [
    {
      id: 1,
      name: 'سارة العتيبي',
      email: 'sara.alotaibi@example.com',
      phone: '+966 55 123 4567',
      status: 'مفعّل',
      joined: '12 مارس 2025',
    },
    {
      id: 2,
      name: 'محمد الدوسري',
      email: 'm.aldosari@example.com',
      phone: '+966 50 987 6543',
      status: 'مفعّل',
      joined: '3 أبريل 2025',
    },
    {
      id: 3,
      name: 'نورة المطيري',
      email: 'noura.almutairi@example.com',
      phone: '+966 53 442 8890',
      status: 'بانتظار التفعيل',
      joined: '27 مايو 2025',
    },
  ];

  labelOf(key: string): string {
    return this.labels().get(key) ?? key;
  }

  cell(row: DemoRow, key: string): string {
    return (row as unknown as Record<string, string>)[key] ?? '';
  }
}
