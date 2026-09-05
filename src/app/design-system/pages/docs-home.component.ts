import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DOCS_ROOT } from '../core/docs-nav.config';
import { DocsRegistryService } from '../core/docs-registry.service';

/* ============================================================================
   Acadimiat Design System Docs — الصفحة الرئيسية
   ----------------------------------------------------------------------------
   ⚠️ كل رقم معروض هنا مُشتقّ من `DOCS_REGISTRY` وقت العرض. لا رقم مُدخل
      يدويًا، فلا يمكن أن يتقادم أو يكذب.

      وحين لا تتوفّر بيانات لمقياس ما (سجلّ التغييرات مثلًا) لا يُعرض المقياس
      أصلًا — لا صفر ولا شرطة. عدّاد بلا مصدر أسوأ من غياب العدّاد.
   ============================================================================ */

@Component({
  selector: 'app-docs-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './docs-home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsHomeComponent {
  private readonly registry = inject(DocsRegistryService);

  readonly docsRoot = DOCS_ROOT;
  readonly tree = this.registry.navTree;
  readonly stats = this.registry.stats;

  /** المدخلات التي تحتاج انتباهًا — تُعرض كعمل مكشوف لا كنقص مخفيّ. */
  readonly needsWork = computed(() =>
    this.registry
      .allEntries()
      .filter(entry => entry.status === 'not-standardized' || entry.status === 'in-progress'),
  );

  readonly quickLinks = computed(() => {
    const links: { title: string; description: string; path: string[] }[] = [];

    for (const branch of this.tree()) {
      const first = branch.looseEntries[0] ?? branch.groups[0]?.entries[0];
      if (first) {
        links.push({
          title: branch.section.title,
          description: branch.section.description,
          path: first.path,
        });
      }
    }

    return links;
  });
}
