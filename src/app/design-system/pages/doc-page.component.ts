import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { DocNavLink, DocNavSection } from '../core/doc.model';
import { DOCS_NAV_SECTIONS, DOCS_ROOT } from '../core/docs-nav.config';
import { DocsRegistryService } from '../core/docs-registry.service';
import { DocSectionComponent } from '../sections/doc-section.component';
import { DocsStatusPillComponent } from '../shell/docs-status-pill.component';
import { DocsTocComponent } from '../shell/docs-toc.component';

/* ============================================================================
   Acadimiat Design System Docs — الصفحة العامة
   ----------------------------------------------------------------------------
   هذا هو المكوّن الوحيد الذي يعرض محتوى توثيقي، مهما بلغ عدد الصفحات.
   يقرأ `:category/:slug`، يجلب المدخل من السجلّ، ويفوّض كل قسم إلى المُصيّر.

   ⛔ لا تُنشئ مكوّن صفحة لكل مكوّن موثَّق. إن احتاج مكوّن ما عرضًا خاصًا،
      فذلك نوع قسم جديد في العقد — لا صفحة جديدة.

   `toSignal` على `paramMap`: المسار قد يتغيّر دون إعادة إنشاء المكوّن (انتقال
   من زرّ إلى حقل داخل التوثيق نفسه)، فقراءة اللقطة (snapshot) مرة واحدة
   تُظهر محتوى الصفحة السابقة — عطل صامت يصعب تشخيصه.
   ============================================================================ */

@Component({
  selector: 'app-doc-page',
  standalone: true,
  imports: [RouterLink, DocSectionComponent, DocsStatusPillComponent, DocsTocComponent],
  templateUrl: './doc-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly registry = inject(DocsRegistryService);

  readonly docsRoot = DOCS_ROOT;

  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  readonly entry = computed(() => {
    const map = this.params();
    return this.registry.find(map.get('category'), map.get('slug'));
  });

  readonly section = computed<DocNavSection | undefined>(() => {
    const category = this.entry()?.category;
    return DOCS_NAV_SECTIONS.find(item => item.id === category);
  });

  /** اسم المجموعة للمسار التفصيلي — للعرض فقط، ليس جزءًا من الـ URL. */
  readonly groupTitle = computed(() => {
    const entry = this.entry();
    if (!entry?.group) {
      return null;
    }
    return this.section()?.groups?.find(group => group.id === entry.group)?.title ?? null;
  });

  /*
    النوع مصرَّح به عمدًا: بدونه يستنتج TypeScript الاتّحاد
    `{ previous?; next? } | {}`، فيرفض `strictTemplates` قراءة `.previous`
    على الفرع الفارغ.
  */
  readonly siblings = computed<{ previous?: DocNavLink; next?: DocNavLink }>(() => {
    const entry = this.entry();
    return entry ? this.registry.siblings(entry) : {};
  });
}
