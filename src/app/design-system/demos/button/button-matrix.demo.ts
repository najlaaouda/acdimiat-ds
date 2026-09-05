import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { ApButtonComponent, ApButtonVariant } from 'src/app/ui';

/* ============================================================================
   خلية مصفوفة الزرّ
   ----------------------------------------------------------------------------
   نسخة واحدة من الزرّ تقبل النوع والحالة، تستهلكها `DocMatrixComponent`.

   ⚠️ `state` تُمرَّر إلى `data-state` وهي **سمة عرض فقط**. المكوّن يستجيب لها
      لأن أنماطه مكتوبة عبر mixins تولّد `:hover` و`[data-state~='hover']` من
      كتلة واحدة (انظر `ui/_state.scss`) — فما تعرضه المصفوفة هو حرفيًا ما
      يحدث عند المرور الحقيقي، لا محاكاة له.
   ============================================================================ */

@Component({
  selector: 'demo-button-matrix',
  standalone: true,
  imports: [ApButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      apButton
      [variant]="variant"
      [loading]="loading"
      [disabled]="disabled"
      [attr.data-state]="state"
    >حفظ</button>
  `,
})
export class ButtonMatrixDemo {
  @Input() variant: ApButtonVariant = 'primary';
  /** قيمة `data-state` — قد تحمل عدّة حالات مفصولة بمسافة. */
  @Input() state: string | null = null;
  @Input() loading = false;
  @Input() disabled = false;
}
