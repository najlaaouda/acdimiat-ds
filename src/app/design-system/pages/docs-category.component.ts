import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { DocEntry, DocNavGroup } from '../core/doc.model';
import { DOCS_NAV_SECTIONS, DOCS_ROOT, isDocCategoryId } from '../core/docs-nav.config';
import { DocsRegistryService } from '../core/docs-registry.service';
import { DocsStatusPillComponent } from '../shell/docs-status-pill.component';

/* ============================================================================
   Acadimiat Design System Docs — فهرس التصنيف
   ----------------------------------------------------------------------------
   /design-system/foundations · /design-system/components · …

   صفحة واحدة تخدم كل التصنيفات. تُبنى بالكامل من `DOCS_NAV_SECTIONS` +
   السجلّ، فتصنيف جديد لا يحتاج مكوّنًا جديدًا.
   ============================================================================ */

interface CategoryGroup {
  group: DocNavGroup | null;
  entries: readonly DocEntry[];
}

@Component({
  selector: 'app-docs-category',
  standalone: true,
  imports: [RouterLink, DocsStatusPillComponent],
  templateUrl: './docs-category.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsCategoryComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly registry = inject(DocsRegistryService);

  readonly docsRoot = DOCS_ROOT;

  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  readonly section = computed(() => {
    const id = this.params().get('category');
    return isDocCategoryId(id)
      ? DOCS_NAV_SECTIONS.find(item => item.id === id)
      : undefined;
  });

  /**
   * المدخلات مجمَّعة بترتيب `groups` المعلن، مع مجموعة بلا عنوان للمدخلات
   * التي لا تنتمي إلى أيّها. تُحذف المجموعات الفارغة.
   */
  readonly groups = computed<CategoryGroup[]>(() => {
    const section = this.section();
    if (!section) {
      return [];
    }

    const entries = this.registry.entriesIn(section.id);
    const result: CategoryGroup[] = [];

    const loose = entries.filter(entry => !entry.group);
    if (loose.length) {
      result.push({ group: null, entries: loose });
    }

    for (const group of section.groups ?? []) {
      const inGroup = entries.filter(entry => entry.group === group.id);
      if (inGroup.length) {
        result.push({ group, entries: inGroup });
      }
    }

    return result;
  });

  /**
   * المجموعات المعلنة التي لا محتوى فيها بعد.
   * تُعرض كخارطة طريق مصرَّح بها — لا كفراغ صامت يُقرأ كعطل.
   */
  readonly emptyGroups = computed<readonly DocNavGroup[]>(() => {
    const section = this.section();
    if (!section?.groups?.length) {
      return [];
    }

    const filled = new Set(
      this.registry.entriesIn(section.id).map(entry => entry.group),
    );

    return section.groups.filter(group => !filled.has(group.id));
  });
}
