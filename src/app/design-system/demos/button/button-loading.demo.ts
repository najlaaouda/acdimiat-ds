import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ApButtonComponent } from 'src/app/ui';

/** الثابت هو القالب نفسه — انظر التعليق في `button-variants.demo.ts`. */
export const BUTTON_LOADING_SOURCE = `
<button apButton [loading]="true">جارٍ الحفظ</button>
<button apButton variant="secondary" disabled>معطَّل</button>
<button apButton variant="danger" [loading]="true">جارٍ الحذف</button>
`;

@Component({
  selector: 'demo-button-loading',
  standalone: true,
  imports: [ApButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: BUTTON_LOADING_SOURCE,
})
export class ButtonLoadingDemo {}
