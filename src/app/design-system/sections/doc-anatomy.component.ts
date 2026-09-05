import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';

import { DocAnatomyPart } from '../core/doc.model';

/* ============================================================================
   Acadimiat Design System Docs — مُصيّر التشريح
   ----------------------------------------------------------------------------
   يعرض أجزاء المكوّن مرقّمة، ويميّز الإلزامي من الاختياري.

   لماذا الترقيم مهمّ: أرقام التشريح هي اللغة المشتركة بين التصميم والتطوير.
   حين يقول أحدهم «الجزء 3 يحتاج مسافة أكبر» يجب أن يشير الرقم إلى الشيء
   نفسه في الطرفين — وهو ما يجعل الترتيب هنا جزءًا من العقد لا تفصيلًا.

   ⚠️ الجزء الاختياري يُعلَّم صراحةً بـ «اختياري» لا بغياب علامة. الغياب
      يُقرأ سهوًا؛ التصريح يُقرأ قرارًا.
   ============================================================================ */

@Component({
  selector: 'app-doc-anatomy',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="docs-anatomy">
      @for (part of partsValue(); track part.name) {
        <li class="docs-anatomy__item">
          <span class="docs-anatomy__index" aria-hidden="true">{{ $index + 1 }}</span>
          <span class="docs-anatomy__body">
            <span class="docs-anatomy__head">
              <span class="docs-anatomy__name">{{ part.name }}</span>
              @if (!part.required) {
                <span class="docs-anatomy__optional">اختياري</span>
              }
            </span>
            <span class="docs-anatomy__desc">{{ part.description }}</span>
          </span>
        </li>
      }
    </ol>
  `,
})
export class DocAnatomyComponent {
  private readonly parts$ = signal<readonly DocAnatomyPart[]>([]);

  @Input({ required: true })
  set parts(value: readonly DocAnatomyPart[]) {
    this.parts$.set(value ?? []);
  }

  protected readonly partsValue = this.parts$.asReadonly();
}
