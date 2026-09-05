import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import {
  ApBadgeComponent,
  ApPaginateEvent,
  ApPaginationComponent,
  ApTableComponent,
} from 'src/app/ui';

/* ============================================================================
   معاينة حيّة — الشريط في ذيل الجدول
   ----------------------------------------------------------------------------
   هذا هو موضعه المقصود: منفذ `apTableFooter` داخل `<ap-table>`، لا عنصرًا
   طليقًا تحته. الجرد وجد 42 `mat-paginator` كلّها خارج أي حاوٍ — فمسافتها عن
   الجدول تختلف من صفحة لأخرى، وتُقرأ عنصرًا عائمًا لا جزءًا منه.

   والذيل يمنحه حدّه العلوي وحشوته من ورقة الجدول، فلا مسافة تُكتب هنا.

   ⚠️ واسم المعدود هنا «عميل» لا «نتيجة»: الجدول يعدّ عملاء. وهو المدخل نفسه
      الذي يستهلكه عدّاد التحديد في `<ap-table>` — الاسم يتبع الشاشة، والصيغ
      ثلاث لأن تمييز العدد يتغيّر بالعدد.
   ============================================================================ */

interface DemoClient {
  id: number;
  name: string;
  email: string;
  active: boolean;
}

export const PAGINATION_IN_TABLE_SOURCE = `
<ap-table caption="العملاء" [empty]="!rows().length">
  <table>
    <thead>
      <tr>
        <th scope="col">الاسم</th>
        <th scope="col" data-nowrap="true">البريد</th>
        <th scope="col">الحالة</th>
      </tr>
    </thead>
    <tbody>
      @for (row of rows(); track row.id) {
        <tr>
          <td>{{ row.name }}</td>
          <td data-nowrap="true"><span dir="ltr">{{ row.email }}</span></td>
          <td>
            <ap-badge [variant]="row.active ? 'success' : 'default'">
              {{ row.active ? 'فعال' : 'غير فعال' }}
            </ap-badge>
          </td>
        </tr>
      }
    </tbody>
  </table>

  <ap-pagination
    apTableFooter
    label="ترقيم صفحات العملاء"
    [page]="page()"
    [pageSize]="pageSize()"
    [total]="clients.length"
    [pageSizes]="[5, 10, 25]"
    [itemNoun]="clientNoun"
    (paginate)="apply($event)"
  />
</ap-table>
`;

@Component({
  selector: 'demo-pagination-in-table',
  standalone: true,
  imports: [ApTableComponent, ApPaginationComponent, ApBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: block; width: 100%; }'],
  template: PAGINATION_IN_TABLE_SOURCE,
})
export class PaginationInTableDemo {
  protected readonly clientNoun = {
    singular: 'عميل',
    dual: 'عميلين',
    plural: 'عملاء',
  };

  private readonly names = [
    'سارة العتيبي',
    'محمد الدوسري',
    'نورة القحطاني',
    'عبدالله المطيري',
    'ريم الشهري',
    'خالد الغامدي',
    'لمى الحربي',
    'فيصل الزهراني',
    'دانة السبيعي',
    'ماجد العنزي',
    'هيا الرشيدي',
    'تركي البقمي',
    'جواهر الخالدي',
    'سلطان المالكي',
    'أمل الجهني',
    'راكان الشمري',
    'وجدان العمري',
    'بدر الحارثي',
    'شهد الثقفي',
    'ناصر الأحمدي',
    'رغد المطرفي',
    'عمر الصاعدي',
    'لين الرويلي',
  ];

  /* بيانات ثابتة مشتقّة من الفهرس: لا `Math.random` — الخادم والمتصفّح
     يُصيّران القيم نفسها، وإلّا انكسر الترطيب واختلف الجدولان. */
  protected readonly clients: DemoClient[] = this.names.map((name, i) => ({
    id: i + 1,
    name,
    email: `user${i + 1}@acadimiat.com`,
    active: i % 4 !== 0,
  }));

  protected readonly page = signal(1);
  protected readonly pageSize = signal(5);

  protected readonly rows = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.clients.slice(start, start + this.pageSize());
  });

  protected apply(event: ApPaginateEvent): void {
    this.page.set(event.page);
    this.pageSize.set(event.pageSize);
  }
}
