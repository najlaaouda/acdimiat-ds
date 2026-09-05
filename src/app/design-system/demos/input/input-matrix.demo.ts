import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { ApFieldComponent, ApInputDirective } from 'src/app/ui';

/* ============================================================================
   خلية مصفوفة الحقل
   ----------------------------------------------------------------------------
   `state` تُمرَّر إلى `data-state` — سمة عرض فقط. المكوّن يستجيب لها لأن
   أنماطه مكتوبة عبر mixins تولّد `:hover` و`[data-state~='hover']` من كتلة
   واحدة (انظر `ui/_state.scss`)، فما تعرضه المصفوفة هو ما يحدث فعلًا.

   ⚠️ `readonly` و`disabled` سمتان حقيقيتان لا مفروضتان: كلتاهما تُفعَّل
      برمجيًا، فلا داعٍ لتزييفهما — والتزييف هنا كان سيخفي فرقًا حقيقيًا في
      السلوك (المعطَّل يخرج من ترتيب التنقّل، وللقراءة فقط يبقى فيه).
   ============================================================================ */

@Component({
  selector: 'demo-input-matrix',
  standalone: true,
  imports: [ApFieldComponent, ApInputDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  /* المضيف عنصر مخصّص، وافتراضه `inline` — فلا يملأ خليّته ولا يحترم عرضها. */
  styles: [':host { display: block; width: 100%; }'],
  template: `
    <ap-field [labelHidden]="true" label="حقل تجريبي" [error]="error ? 'رسالة خطأ' : null">
      <input
        apInput
        type="text"
        [value]="value"
        [attr.data-state]="state"
        [disabled]="disabled"
        [readOnly]="readonly"
        placeholder="اكتب هنا"
      />
    </ap-field>
  `,
})
export class InputMatrixDemo {
  @Input() state: string | null = null;
  @Input() value = '';
  @Input() error = false;
  @Input() disabled = false;
  @Input() readonly = false;
}
