import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { ApCheckboxDirective, ApChoiceComponent } from 'src/app/ui';

/* ============================================================================
   خلية مصفوفة مربّع الاختيار
   ----------------------------------------------------------------------------
   `state` تُمرَّر إلى `data-state` — سمة عرض فقط. المكوّن يستجيب لها لأن
   أنماطه مكتوبة عبر mixins تولّد `:hover` و`[data-state~='hover']` من كتلة
   واحدة (انظر `ui/_state.scss`)، فما تعرضه المصفوفة هو ما يحدث فعلًا.

   ⚠️ `checked` و`indeterminate` و`disabled` حالات حقيقية لا مفروضة: الثلاث
      تُضبط برمجيًا على العنصر الأصلي، فتزييفها كان سيخفي فرقًا في السلوك لا
      في المظهر — المعطَّل يخرج من ترتيب التنقّل، والوسطى لا تُرسل قيمة.
   ============================================================================ */

@Component({
  selector: 'demo-checkbox-matrix',
  standalone: true,
  imports: [ApChoiceComponent, ApCheckboxDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: block; width: 100%; }'],
  template: `
    <ap-choice label="خيار" [labelHidden]="true">
      <input
        apCheckbox
        [attr.data-state]="state"
        [checked]="checked"
        [indeterminate]="indeterminate"
        [disabled]="disabled"
      />
    </ap-choice>
  `,
})
export class CheckboxMatrixDemo {
  @Input() state: string | null = null;
  @Input() checked = false;
  @Input() indeterminate = false;
  @Input() disabled = false;
}
