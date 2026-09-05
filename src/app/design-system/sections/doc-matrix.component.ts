import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  PLATFORM_ID,
  Type,
  computed,
  inject,
  signal,
} from '@angular/core';

import { DocMatrixAxis, DocStateMatrixSection } from '../core/doc.model';
import { DocsMatrixCellComponent } from './docs-matrix-cell.component';

/* ============================================================================
   Acadimiat Design System Docs — مصفوفة الحالات
   ----------------------------------------------------------------------------
   شبكة variants × states، كل خلية نسخة حيّة من المكوّن بحالة مفروضة.

   ─── كيف تُفرض حالة `hover` بصدق ───────────────────────────────────────────
   الحالات الزائفة (`:hover`, `:active`, `:focus-visible`) لا تُفعَّل برمجيًا،
   فالمصفوفة تمرّر `data-state="hover"` — والمكوّن يستجيب لها لأن أنماطه
   مكتوبة عبر mixins في `ui/_state.scss` تولّد المحدّدَين معًا:

       &:hover, &[data-state~='hover'] { … }

   فالصدق مضمون **بنيويًا**: لا يمكن تغيير مظهر الـ hover في المكوّن دون أن
   تتغيّر الخلية المقابلة في المصفوفة، لأنهما قاعدة واحدة.

   ⚠️ المصفوفة مرجع بصري لا إثبات تفاعلي. الإثبات هو المعاينة الحيّة أعلاها،
      ولذلك يُذكر ذلك صراحةً تحت الشبكة.
   ============================================================================ */

interface MatrixCell {
  variant: DocMatrixAxis;
  state: DocMatrixAxis;
  inputs: Record<string, unknown>;
}

@Component({
  selector: 'app-doc-matrix',
  standalone: true,
  imports: [DocsMatrixCellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loaded(); as type) {
      <div
        class="docs-matrix"
        [style.--docs-matrix-cols]="states().length"
        [style.--docs-matrix-col-min]="columnMin()"
      >
        <!-- رأس الأعمدة: الحالات -->
        <span class="docs-matrix__corner"></span>
        @for (state of states(); track state.id) {
          <span class="docs-matrix__head">{{ state.label }}</span>
        }

        @for (variant of variants(); track variant.id) {
          <span class="docs-matrix__side">{{ variant.label }}</span>
          @for (state of states(); track state.id) {
            <span class="docs-matrix__cell">
              <app-docs-matrix-cell
                [component]="type"
                [inputs]="inputsFor(variant, state)"
              />
            </span>
          }
        }
      </div>

      <p class="docs-caption">
        حالات التفاعل مفروضة للعرض عبر ‎data-state‎، وهي القاعدة نفسها التي
        تحكم التفاعل الحقيقي. جرّبها حيّة في المعاينة أعلاه.
      </p>
    } @else {
      <p class="docs-demo__pending">جارٍ تحميل المصفوفة…</p>
    }
  `,
})
export class DocMatrixComponent {
  private readonly platformId = inject(PLATFORM_ID);

  private readonly section$ = signal<DocStateMatrixSection | null>(null);
  private readonly loaded$ = signal<Type<unknown> | null>(null);

  @Input({ required: true })
  set matrix(value: DocStateMatrixSection) {
    this.section$.set(value);
    this.loaded$.set(null);

    if (value?.demo && isPlatformBrowser(this.platformId)) {
      void this.load(value);
    }
  }

  protected readonly loaded = this.loaded$.asReadonly();
  protected readonly variants = computed(() => this.section$()?.variants ?? []);
  protected readonly states = computed(() => this.section$()?.states ?? []);
  protected readonly columnMin = computed(() => this.section$()?.columnMin ?? null);

  /**
   * مدخلات المحور مدموجة: مدخلات النوع أولًا ثم مدخلات الحالة.
   * الترتيب مقصود — الحالة تفوز عند التعارض، فهي الأخصّ في هذه الخلية.
   */
  protected inputsFor(variant: DocMatrixAxis, state: DocMatrixAxis): Record<string, unknown> {
    return { ...(variant.inputs ?? {}), ...(state.inputs ?? {}) };
  }

  private async load(section: DocStateMatrixSection): Promise<void> {
    const module = (await section.demo.load()) as Record<string, unknown>;
    const component = Object.values(module).find(
      (value): value is Type<unknown> => typeof value === 'function',
    );

    if (component) {
      this.loaded$.set(component);
    }
  }
}
