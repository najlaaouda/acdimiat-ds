import { Injectable, computed, signal } from '@angular/core';

import {
  DocCategoryId,
  DocEntry,
  DocNavLink,
  DocNavTree,
  DocNavTreeGroup,
  DocStatus,
} from './doc.model';
import { DOCS_NAV_SECTIONS, DOCS_ROOT } from './docs-nav.config';
import { DOCS_REGISTRY } from '../registry';

/* ============================================================================
   Acadimiat Design System Docs — السجلّ
   ----------------------------------------------------------------------------
   المسؤولية الوحيدة: تحويل `DOCS_REGISTRY` (بيانات مسطّحة) إلى الأشكال التي
   تحتاجها الواجهة — شجرة تنقّل، بحث بالمسار، فهرس تصنيف، إحصاءات.

   ⛔ لا يحتوي هذا الملف على أي محتوى توثيقي. المحتوى في `registry/`.
   ⛔ لا يقرأ أي مكوّن `DOCS_REGISTRY` مباشرةً — يمرّ عبر هذه الخدمة.

   لماذا خدمة لا دوال حرّة: الشجرة تُحسب مرة واحدة وتُخزَّن (computed)، بدل
   إعادة تجميع المصفوفة في كل دورة كشف تغيير داخل الشريط الجانبي.
   ============================================================================ */

/** إحصاءات مُحتسبة من محتوى فعليّ — لا أرقام مُدخلة يدويًا. */
export interface DocsStats {
  /** مدخلات منشورة (كل ما ليس `planned`). */
  published: number;
  /** مدخلات مخطَّطة وغير مبنيّة. */
  planned: number;
  byCategory: Record<DocCategoryId, number>;
  byStatus: Record<DocStatus, number>;
}

@Injectable({ providedIn: 'root' })
export class DocsRegistryService {
  /**
   * السجلّ كإشارة: يسمح لاحقًا بحقن مدخلات إضافية (اختبارات، وحدات
   * ميزات) بلا تغيير أي مستهلك.
   */
  private readonly entries = signal<readonly DocEntry[]>(DOCS_REGISTRY);

  readonly allEntries = this.entries.asReadonly();

  /** فهرس `category/slug` → مدخل. البحث O(1) بدل مسح المصفوفة. */
  private readonly index = computed<ReadonlyMap<string, DocEntry>>(() => {
    const map = new Map<string, DocEntry>();
    for (const entry of this.entries()) {
      map.set(keyOf(entry.category, entry.slug), entry);
    }
    return map;
  });

  /**
   * شجرة التنقّل الكاملة، بترتيب `DOCS_NAV_SECTIONS`.
   *
   * التصنيف الذي لا مدخلات منشورة فيه يُحذف من الشجرة: قسم فارغ في الشريط
   * الجانبي يقرأه المستخدم كعطل لا كعمل قادم.
   */
  readonly navTree = computed<readonly DocNavTree[]>(() => {
    const published = this.entries().filter(entry => entry.status !== 'planned');

    return DOCS_NAV_SECTIONS
      .map(section => {
        const inSection = published.filter(entry => entry.category === section.id);

        const looseEntries = inSection
          .filter(entry => !entry.group)
          .map(toNavLink);

        const groups: DocNavTreeGroup[] = (section.groups ?? [])
          .map(group => ({
            group,
            entries: inSection
              .filter(entry => entry.group === group.id)
              .map(toNavLink),
          }))
          .filter(group => group.entries.length > 0);

        return {
          section,
          looseEntries,
          groups,
          count: inSection.length,
        } satisfies DocNavTree;
      })
      .filter(tree => tree.count > 0);
  });

  /** إحصاءات الصفحة الرئيسية. تُشتقّ من المحتوى، فلا يمكن أن تكذب. */
  readonly stats = computed<DocsStats>(() => {
    const byCategory = {} as Record<DocCategoryId, number>;
    const byStatus = {} as Record<DocStatus, number>;

    for (const section of DOCS_NAV_SECTIONS) {
      byCategory[section.id] = 0;
    }

    let published = 0;
    let planned = 0;

    for (const entry of this.entries()) {
      byStatus[entry.status] = (byStatus[entry.status] ?? 0) + 1;
      if (entry.status === 'planned') {
        planned++;
        continue;
      }
      published++;
      byCategory[entry.category] = (byCategory[entry.category] ?? 0) + 1;
    }

    return { published, planned, byCategory, byStatus };
  });

  /** يُرجع `undefined` لمسار غير موجود — المتصل يعرض حالة "غير موجود". */
  find(category: string | null, slug: string | null): DocEntry | undefined {
    if (!category || !slug) {
      return undefined;
    }
    return this.index().get(keyOf(category, slug));
  }

  /** مدخلات تصنيف واحد، منشورة فقط، بترتيب التسجيل. */
  entriesIn(category: DocCategoryId): readonly DocEntry[] {
    return this.entries().filter(
      entry => entry.category === category && entry.status !== 'planned',
    );
  }

  /**
   * الصفحتان السابقة والتالية في ترتيب القراءة المسطّح للموقع كلّه —
   * أي بالترتيب نفسه الذي يراه المستخدم في الشريط الجانبي.
   */
  siblings(entry: DocEntry): { previous?: DocNavLink; next?: DocNavLink } {
    const flat = this.flatOrder();
    /* المسار `['/', DOCS_ROOT, category, slug]` — التصنيف في الموضع 2 لا 1. */
    const at = flat.findIndex(
      link => link.path[2] === entry.category && link.slug === entry.slug,
    );
    if (at < 0) {
      return {};
    }
    return {
      previous: at > 0 ? flat[at - 1] : undefined,
      next: at < flat.length - 1 ? flat[at + 1] : undefined,
    };
  }

  /** ترتيب القراءة المسطّح — مطابق تمامًا لترتيب الشريط الجانبي. */
  private flatOrder(): DocNavLink[] {
    const flat: DocNavLink[] = [];
    for (const tree of this.navTree()) {
      flat.push(...tree.looseEntries);
      for (const group of tree.groups) {
        flat.push(...group.entries);
      }
    }
    return flat;
  }
}

function keyOf(category: string, slug: string): string {
  return `${category}/${slug}`;
}

function toNavLink(entry: DocEntry): DocNavLink {
  return {
    slug: entry.slug,
    title: entry.title,
    status: entry.status,
    path: ['/', DOCS_ROOT, entry.category, entry.slug],
  };
}
