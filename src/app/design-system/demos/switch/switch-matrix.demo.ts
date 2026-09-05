import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { ApChoiceComponent, ApSwitchDirective } from 'src/app/ui';

/* ============================================================================
   خلية مصفوفة المفتاح
   ----------------------------------------------------------------------------
   انظر تعليق `checkbox-matrix.demo.ts` — القاعدة نفسها.

   الفارق بين الصفّين ليس اللون وحده: موضع الإبهام يتغيّر، وهو التمييز
   الشكلي الذي يجعل الحالة مقروءة في وضع التباين العالي وفي طباعة أحادية.
   ============================================================================ */

@Component({
  selector: 'demo-switch-matrix',
  standalone: true,
  imports: [ApChoiceComponent, ApSwitchDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: block; width: 100%; }'],
  template: `
    <ap-choice label="إعداد" [labelHidden]="true">
      <input apSwitch [attr.data-state]="state" [checked]="checked" [disabled]="disabled" />
    </ap-choice>
  `,
})
export class SwitchMatrixDemo {
  @Input() state: string | null = null;
  @Input() checked = false;
  @Input() disabled = false;
}
