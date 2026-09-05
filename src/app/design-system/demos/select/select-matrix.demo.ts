import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { ApFieldComponent, ApSelectDirective } from 'src/app/ui';

/* ============================================================================
   خلية مصفوفة القائمة المنسدلة
   ----------------------------------------------------------------------------
   انظر تعليق `input-matrix.demo.ts` — القاعدة نفسها.

   الصفّ «نائب» يعرض القائمة قبل الاختيار: نصّها بلون النصّ البديل لا بلون
   القيمة، فيُقرأ «لم يُختر بعد». والفرق مرسوم بمحدّد لا بـ JavaScript، فهو
   صحيح على الخادم أيضًا.
   ============================================================================ */

@Component({
  selector: 'demo-select-matrix',
  standalone: true,
  imports: [ApFieldComponent, ApSelectDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: block; width: 100%; }'],
  template: `
    <ap-field [labelHidden]="true" label="قائمة تجريبية" [error]="error ? 'رسالة خطأ' : null">
      <select apSelect [attr.data-state]="state" [disabled]="disabled">
        <option value="" [selected]="placeholder">اختر تصنيفًا</option>
        <option value="marketing" [selected]="!placeholder">التسويق</option>
      </select>
    </ap-field>
  `,
})
export class SelectMatrixDemo {
  @Input() state: string | null = null;
  @Input() placeholder = false;
  @Input() error = false;
  @Input() disabled = false;
}
