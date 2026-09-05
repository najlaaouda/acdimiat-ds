import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ApButtonComponent } from 'src/app/ui';

/** الثابت هو القالب نفسه — انظر التعليق في `button-variants.demo.ts`. */
export const BUTTON_SIZES_SOURCE = `
<button apButton size="sm">صغير · 32px</button>
<button apButton size="md">متوسّط · 40px</button>
<button apButton size="lg">كبير · 48px</button>
`;

@Component({
  selector: 'demo-button-sizes',
  standalone: true,
  imports: [ApButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: BUTTON_SIZES_SOURCE,
})
export class ButtonSizesDemo {}
