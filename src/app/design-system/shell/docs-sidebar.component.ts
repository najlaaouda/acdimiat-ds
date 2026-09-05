import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { DOCS_ROOT } from '../core/docs-nav.config';
import { DocsRegistryService } from '../core/docs-registry.service';
import { DocsStatusPillComponent } from './docs-status-pill.component';

/* ============================================================================
   Acadimiat Design System Docs — الشريط الجانبي
   ----------------------------------------------------------------------------
   ⛔ صفر قوائم مكتوبة يدويًا في هذا الملف.
      الشجرة كلها تُقرأ من `DocsRegistryService.navTree()`، وهي بدورها مشتقّة
      من `DOCS_NAV_SECTIONS` + `DOCS_REGISTRY`.

   نتيجة ذلك: تسجيل صفحة جديدة يُظهرها هنا تلقائيًا في تصنيفها ومجموعتها،
   بلا لمس هذا الملف. وهذا هو الشرط الذي يمنع تحوّل التنقّل إلى قائمة
   موزَّعة عبر عدّة مكوّنات مع توسّع النظام.

   المسار النشط: `routerLinkActive` بـ `{ exact: true }` — بدون `exact`
   يبقى رابط التصنيف مضاءً داخل كل صفحاته فيضيع موضع المستخدم.
   ============================================================================ */

@Component({
  selector: 'app-docs-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, DocsStatusPillComponent],
  templateUrl: './docs-sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsSidebarComponent {
  private readonly registry = inject(DocsRegistryService);

  readonly docsRoot = DOCS_ROOT;
  readonly tree = this.registry.navTree;
}
