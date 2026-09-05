import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Type,
  ViewEncapsulation,
  signal,
} from '@angular/core';

/* ============================================================================
   Acadimiat Design System Docs — خلية المصفوفة
   ----------------------------------------------------------------------------
   نسخة معزولة من المكوّن بمدخلات محدّدة.

   ⚠️ ShadowDom لكل خلية — للسبب نفسه الذي في `docs-demo-stage`: حجب الأنماط
      العالمية مع إبقاء وراثة الـ tokens. الكلفة مقبولة لأن الشبكة صغيرة
      (variants × states)، وبديلها معاينة تعرض تلوّث القالب المشترى لا المكوّن.

   `ngComponentOutletInputs` (Angular 16.2+) يمرّر المدخلات إعلانيًا بلا
   `ComponentRef.setInput` يدوي ولا `ViewContainerRef` مكشوف.
   ============================================================================ */

@Component({
  selector: 'app-docs-matrix-cell',
  standalone: true,
  imports: [NgComponentOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    @if (componentValue(); as type) {
      <ng-container *ngComponentOutlet="type; inputs: inputsValue()" />
    }
  `,
  styles: [
    `
      /* الجذر الظلّي يحجب reset الصندوق العالمي — انظر docs-demo-stage. */
      *,
      *::before,
      *::after {
        box-sizing: border-box;
      }

      :host {
        display: block;
        width: 100%;
        min-width: 0;
        font-family: var(--ap-font-sans);
      }
    `,
  ],
})
export class DocsMatrixCellComponent {
  private readonly component$ = signal<Type<unknown> | null>(null);
  private readonly inputs$ = signal<Record<string, unknown>>({});

  @Input({ required: true })
  set component(value: Type<unknown>) {
    this.component$.set(value);
  }

  @Input({ required: true })
  set inputs(value: Record<string, unknown>) {
    this.inputs$.set(value ?? {});
  }

  protected readonly componentValue = this.component$.asReadonly();
  protected readonly inputsValue = this.inputs$.asReadonly();
}
