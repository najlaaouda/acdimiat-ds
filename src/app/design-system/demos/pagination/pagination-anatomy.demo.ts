import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { ApPaginateEvent, ApPaginationComponent } from 'src/app/ui';

/* ============================================================================
   معاينة حيّة — شريط الترقيم
   ----------------------------------------------------------------------------
   الثابت هو القالب نفسه — انظر التعليق في `button-variants.demo.ts`.

   ─── ما يُثبته هذا المثال ──────────────────────────────────────────────────
   • **انقر «التالي» مرارًا**: عدد الخلايا لا يتغيّر — سبع دائمًا. فالزرّ يبقى
     تحت المؤشّر بين نقرة وأخرى. جرّب إخفاء هذا الثبات ذهنيًا وستجد أن النقر
     المتكرّر يستحيل: الصفّ يطول من خمس خلايا إلى سبع عند الصفحة الخامسة،
     فيزحف «التالي» وتقع النقرة التالية على رقم صفحة.
   • **راقب جملة المدى**: تتبع الانتقال بالعناصر لا بالصفحات. «عرض 31–45 من
     150 نتيجة» يجيب «هل تجاوزتُ ما أبحث عنه؟» — ورقم الصفحة وحده لا يجيبه.
   • **بدّل حجم الصفحة وأنت في الصفحة السابعة**: لا تعود إلى الأولى. الصفحة
     الجديدة هي التي تحوي أوّل عنصر كان معروضًا.
   • **صغّر نافذة المتصفّح**: تختفي الأرقام غير الحالية دون 520px من عرض
     الحاوي — والسهمان يبلغان كل صفحة، فلا وجهة تُفقد.
   ============================================================================ */

export const PAGINATION_ANATOMY_SOURCE = `
<ap-pagination
  label="ترقيم نتائج البحث"
  [page]="page()"
  [pageSize]="pageSize()"
  [total]="150"
  [pageSizes]="[10, 15, 25, 50]"
  (paginate)="apply($event)"
/>
`;

@Component({
  selector: 'demo-pagination-anatomy',
  standalone: true,
  imports: [ApPaginationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: block; width: 100%; }'],
  template: PAGINATION_ANATOMY_SOURCE,
})
export class PaginationAnatomyDemo {
  protected readonly page = signal(2);
  protected readonly pageSize = signal(15);

  /*
    حدث واحد يحمل الرقم والحجم معًا، فالمستهلك يكتب معالجًا واحدًا ويطلب من
    الخادم مرّة واحدة. وحدثان منفصلان كانا سيُنتجان طلبين لتفاعل واحد عند
    تغيير الحجم، لأنه يغيّر الرقم كذلك.
  */
  protected apply(event: ApPaginateEvent): void {
    this.page.set(event.page);
    this.pageSize.set(event.pageSize);
  }
}
