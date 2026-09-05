import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { ApButtonComponent, ApTableComponent, ApTableDensity } from 'src/app/ui';

/* ============================================================================
   معاينة حيّة — حالات الجدول وكثافته
   ----------------------------------------------------------------------------
   الثابت هو القالب نفسه — انظر التعليق في `button-variants.demo.ts`.

   ─── لماذا هيكل تحميل لا إخفاء ─────────────────────────────────────────────
   بدّل إلى «التحميل»: الجدول لا يختفي، بل يبقى بارتفاعه فيبقى ما تحته في
   مكانه. النمط القائم في المشروع (`@if (!loading)` حول الجدول) ينهار إلى
   ارتفاع صفر ثم يقفز عند وصول البيانات — والجرد لم يجد هيكل تحميل واحدًا.

   ─── ولماذا حالة الفراغ داخل الحاوي ────────────────────────────────────────
   الجرد وجد نحو 62 موضعًا يكتب حالة الفراغ يدويًا بـ `<div class="no-data">`
   خارج الجدول، بأشكال مختلفة. هنا تعيش في الحاوي نفسه فتحفظ حدّه ونصف قطره
   وعرضه — والصفحة لا تتغيّر هندستها بين «فيه بيانات» و«لا بيانات».
   ============================================================================ */

export const TABLE_STATES_SOURCE = `
<div class="bar">
  <button apButton size="sm" variant="secondary" (click)="state.set('ready')">بيانات</button>
  <button apButton size="sm" variant="secondary" (click)="state.set('loading')">تحميل</button>
  <button apButton size="sm" variant="secondary" (click)="state.set('empty')">فارغ</button>
  <button apButton size="sm" variant="tertiary" (click)="flipDensity()">
    الكثافة: {{ density() }}
  </button>
</div>

<ap-table
  caption="المدرّبون"
  [density]="density()"
  [zebra]="true"
  [sticky]="true"
  [loading]="state() === 'loading'"
  [empty]="state() === 'empty'"
  [skeletonRows]="4"
  [skeletonColumns]="3"
>
  <table>
    <thead>
      <tr>
        <th scope="col">الاسم</th>
        <th scope="col">التخصّص</th>
        <th scope="col" data-numeric="true">الدورات</th>
      </tr>
    </thead>
    <tbody>
      @for (row of people; track row.name) {
        <tr>
          <td>{{ row.name }}</td>
          <td>{{ row.field }}</td>
          <td data-numeric="true">{{ row.courses }}</td>
        </tr>
      }
    </tbody>
  </table>

  <div apTableEmpty>
    <p>لا مدرّبين مطابقين لهذا البحث.</p>
    <button apButton size="sm" variant="secondary" (click)="state.set('ready')">
      إزالة عوامل التصفية
    </button>
  </div>

  <p apTableFooter class="count">5 من 42</p>
</ap-table>
`;

@Component({
  selector: 'demo-table-states',
  standalone: true,
  imports: [ApButtonComponent, ApTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    ':host { display: block; width: 100%; }',
    '.bar { display: flex; flex-wrap: wrap; gap: var(--ap-space-2);' +
      ' margin-block-end: var(--ap-space-4); }',
    '.count { margin: 0; color: var(--ap-color-text-tertiary);' +
      ' font-size: var(--ap-font-size-xs); }',
    '[apTableEmpty] p { margin: 0 0 var(--ap-space-3); }',
  ],
  template: TABLE_STATES_SOURCE,
})
export class TableStatesDemo {
  protected readonly state = signal<'ready' | 'loading' | 'empty'>('ready');
  protected readonly density = signal<ApTableDensity>('md');

  protected readonly people = [
    { name: 'سارة العتيبي', field: 'التسويق الرقمي', courses: 12 },
    { name: 'خالد المطيري', field: 'تصميم المنتجات', courses: 8 },
    { name: 'نورة الدوسري', field: 'التحليل المالي', courses: 5 },
    { name: 'عبدالله القحطاني', field: 'إدارة المشاريع', courses: 21 },
    { name: 'ريم الشمري', field: 'كتابة المحتوى', courses: 3 },
  ];

  protected flipDensity(): void {
    this.density.update(current => (current === 'md' ? 'sm' : 'md'));
  }
}
