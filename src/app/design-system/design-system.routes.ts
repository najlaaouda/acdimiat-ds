import { Routes } from '@angular/router';

import { DocPageComponent } from './pages/doc-page.component';
import { DocsCategoryComponent } from './pages/docs-category.component';
import { DocsHomeComponent } from './pages/docs-home.component';
import { DocsShellComponent } from './shell/docs-shell.component';

/* ============================================================================
   Acadimiat Design System Docs — المسارات
   ----------------------------------------------------------------------------
   مسارات standalone كسولة، مُركَّبة على `/design-system` من الراوتر الجذر.

   ثلاثة مسارات فقط تخدم الموقع كلّه مهما بلغ عدد الصفحات:

     /design-system                       نظرة عامة
     /design-system/:category             فهرس التصنيف
     /design-system/:category/:slug       صفحة توثيق

   ⛔ لا تُضِف مسارًا لكل مكوّن. الصفحة الجديدة تصل عبر السجلّ لا عبر الراوتر.

   ─── الاستقلال ─────────────────────────────────────────────────────────────
   • لا `AuthGuard`: التوثيق مرجع للفريق، وحجبه خلف تسجيل الدخول يجعله
     غير قابل للمشاركة في مراجعة تصميم أو تذكرة عمل.
   • لا تبعية على `AdminModule` ولا على أي وحدة ميزات — كل ما يُستورد هنا
     يعيش تحت `src/app/design-system/`، فالمجلّد قابل للاستخراج إلى تطبيق
     منفصل لاحقًا بلا فكّ ارتباطات.
   • النطاق البصري `.ap-docs` يُطبَّق في الغلاف لا هنا.

   ⚠️ التسجيل في الراوتر الجذر **يجب** أن يسبق مسار `''` (HomeModule)، وإلا
      ابتلعه الأخير بوصفه catch-all وأعاد صفحة الموقع العام.
   ============================================================================ */

export const DESIGN_SYSTEM_ROUTES: Routes = [
  {
    path: '',
    component: DocsShellComponent,
    children: [
      { path: '', pathMatch: 'full', component: DocsHomeComponent },

      /*
        `:category/:slug` قبل `:category` ليس شرطًا في راوتر Angular (يطابق
        بعدد الأجزاء لا بالترتيب)، لكن ترتيبها هكذا يجعل نيّة الأخصّ-أولًا
        مقروءة لمن يضيف مسارًا لاحقًا.
      */
      { path: ':category/:slug', component: DocPageComponent },
      { path: ':category', component: DocsCategoryComponent },

      /*
        كل ما بقي يعود إلى نظرة عامة داخل الغلاف نفسه.
        لولا هذا لصعد المسار غير المطابق إلى catch-all الجذر، فخرج المستخدم
        من التوثيق كلّه إلى صفحة 404 عامة — قطع سياق لا مبرّر له.
      */
      { path: '**', redirectTo: '' },
    ],
  },
];
