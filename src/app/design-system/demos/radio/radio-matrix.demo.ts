import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { ApChoiceComponent, ApRadioDirective } from 'src/app/ui';

/* ============================================================================
   خلية مصفوفة زرّ الراديو
   ----------------------------------------------------------------------------
   انظر تعليق `checkbox-matrix.demo.ts` — القاعدة نفسها: الحالات التفاعلية
   مفروضة بـ `data-state`، والتحديد والتعطيل حقيقيان.

   ⚠️ كل خليّة راديو مستقلّ بلا اسم مشترك، فلا تُلغي خلية تحديدَ جارتها.
      وهذا هو الاستثناء الوحيد لقاعدة «الراديو لا يُستخدم منفردًا»: المصفوفة
      تعرض الشكل لا السلوك.
   ============================================================================ */

@Component({
  selector: 'demo-radio-matrix',
  standalone: true,
  imports: [ApChoiceComponent, ApRadioDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: block; width: 100%; }'],
  template: `
    <ap-choice label="خيار" [labelHidden]="true">
      <input apRadio [attr.data-state]="state" [checked]="checked" [disabled]="disabled" />
    </ap-choice>
  `,
})
export class RadioMatrixDemo {
  @Input() state: string | null = null;
  @Input() checked = false;
  @Input() disabled = false;
}
