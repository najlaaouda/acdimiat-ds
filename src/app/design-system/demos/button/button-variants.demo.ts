import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ApButtonComponent } from 'src/app/ui';

/* ============================================================================
   معاينة حيّة — أنواع الزرّ
   ----------------------------------------------------------------------------
   ⛔ الثابت `SOURCE` **هو** قالب المكوّن، لا نسخة عنه.

   هذا هو ما يضمن أن الشيفرة المعروضة تحت المعاينة مطابقة لما يعمل فعلًا.
   نسخ الشيفرة يدويًا في ملف بيانات ينحرف خلال أسابيع: يتغيّر المكوّن ولا
   يتغيّر النصّ المعروض، فيصبح التوثيق كاذبًا بهدوء.

   هنا الانحراف مستحيل فيزيائيًا — لأن المصدر واحد يُستهلك مرّتين:
   مرة قالبًا يُترجمه Angular، ومرة نصًّا يعرضه لوح الشيفرة.
   ============================================================================ */

export const BUTTON_VARIANTS_SOURCE = `
<button apButton variant="primary">حفظ التغييرات</button>
<button apButton variant="secondary">إلغاء</button>
<button apButton variant="tertiary">تخطّي</button>
<button apButton variant="danger">حذف نهائيًا</button>
<button apButton variant="link">عرض التفاصيل</button>
`;

@Component({
  selector: 'demo-button-variants',
  standalone: true,
  imports: [ApButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: BUTTON_VARIANTS_SOURCE,
})
export class ButtonVariantsDemo {}
