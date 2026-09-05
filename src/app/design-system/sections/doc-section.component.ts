import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';

import { docSectionAnchor } from '../core/doc-anchor';
import {
  DocAnatomySection,
  DocCalloutSection,
  DocDoDontSection,
  DocListSection,
  DocProseSection,
  DocDemoSection,
  DocSection,
  DocStateMatrixSection,
  DocTableSection,
  DocTokensSection,
} from '../core/doc.model';
import { DocAnatomyComponent } from './doc-anatomy.component';
import { DocDemoComponent } from './doc-demo.component';
import { DocMatrixComponent } from './doc-matrix.component';
import { DocTokensComponent } from './doc-tokens.component';

/* ============================================================================
   Acadimiat Design System Docs — مُصيّر الأقسام
   ----------------------------------------------------------------------------
   مكوّن واحد يعرف كيف يرسم كل نوع قسم. الصفحة العامة تمرّ على `sections`
   وتفوّض كل عنصر إلى هنا — فلا تُكتب صفحة توثيق واحدة يدويًا.

   إضافة نوع قسم مستقبلًا:
     1. عضو جديد في اتّحاد `DocSection` (core/doc.model.ts).
     2. دالة حراسة (type guard) أدناه.
     3. فرع `@case` في القالب.

   ⚠️ حالة المرحلة 1: الأنواع `anatomy` و `tokens` و `demo` و `matrix`
      معرَّفة في العقد ومُصيّرها يُبنى في المرحلة 2. لا يستخدمها أي مدخل
      اليوم، والفرع الاحتياطي يصرّح بذلك بدل الصمت.

   ⚠️ صفر `innerHTML`. المحتوى نصّ عادي، فلا سطح لهجوم XSS من ملف توثيق.
      التوكيد البصري داخل النصّ يُنقل بعلامات النصّ نفسها (‎ ‎) لا بوسوم.
   ============================================================================ */

@Component({
  selector: 'app-doc-section',
  standalone: true,
  imports: [DocAnatomyComponent, DocTokensComponent, DocDemoComponent, DocMatrixComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './doc-section.component.html',
})
export class DocSectionComponent {
  private readonly section$ = signal<DocSection | null>(null);
  private readonly index$ = signal(0);

  @Input({ required: true })
  set section(value: DocSection) {
    this.section$.set(value);
  }

  /**
   * موضع القسم في الصفحة — مصدر المرساة.
   *
   * يمرّره الأب لأن القسم لا يعرف ترتيبه بنفسه، والمرساة تُحسب من موضع لا
   * من عنوان (انظر `core/doc-anchor.ts` لسبب ذلك).
   */
  @Input({ required: true })
  set index(value: number) {
    this.index$.set(value);
  }

  protected readonly current = this.section$.asReadonly();

  protected readonly anchor = computed(() => docSectionAnchor(this.index$()));

  protected readonly kind = computed(() => this.section$()?.kind ?? null);

  /* الحرّاس: يضيّق كلٌّ منها الاتّحاد إلى عضو واحد، فيبقى `strictTemplates`
     راضيًا بلا `$any()` وبلا أي cast — التضييق يتمّ بالمُميِّز `kind` نفسه. */
  protected readonly asProse = computed<DocProseSection | null>(() => {
    const section = this.section$();
    return section?.kind === 'prose' ? section : null;
  });

  protected readonly asList = computed<DocListSection | null>(() => {
    const section = this.section$();
    return section?.kind === 'list' ? section : null;
  });

  protected readonly asTable = computed<DocTableSection | null>(() => {
    const section = this.section$();
    return section?.kind === 'table' ? section : null;
  });

  protected readonly asCallout = computed<DocCalloutSection | null>(() => {
    const section = this.section$();
    return section?.kind === 'callout' ? section : null;
  });

  protected readonly asAnatomy = computed<DocAnatomySection | null>(() => {
    const section = this.section$();
    return section?.kind === 'anatomy' ? section : null;
  });

  protected readonly asTokens = computed<DocTokensSection | null>(() => {
    const section = this.section$();
    return section?.kind === 'tokens' ? section : null;
  });

  protected readonly asDemo = computed<DocDemoSection | null>(() => {
    const section = this.section$();
    return section?.kind === 'demo' ? section : null;
  });

  protected readonly asMatrix = computed<DocStateMatrixSection | null>(() => {
    const section = this.section$();
    return section?.kind === 'matrix' ? section : null;
  });

  protected readonly asDoDont = computed<DocDoDontSection | null>(() => {
    const section = this.section$();
    return section?.kind === 'do-dont' ? section : null;
  });
}
