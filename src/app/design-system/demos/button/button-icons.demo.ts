import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ApButtonComponent } from 'src/app/ui';

/* ============================================================================
   معاينة حيّة — الزرّ مع الأيقونات
   ----------------------------------------------------------------------------
   الثابت هو القالب نفسه — انظر التعليق في `button-variants.demo.ts`.

   الأيقونات هنا SVG محدَّدة (outline) بلا تعبئة:
     • `fill="none"` + `stroke="currentColor"` فترث لون النصّ في كل نوع وحالة.
     • `viewBox` موحّد 24×24، والأبعاد تأتي من `--ap-icon-*` لا من السمات،
       فتتبع الأيقونة حجم الزرّ تلقائيًا.
     • `aria-hidden="true"` دائمًا: الأيقونة زخرفة بصرية، والمعنى في النصّ.
     • تُؤلَّف بالاتجاه اللاتيني، وتُعلَّم الاتّجاهية منها بـ `apIconFlip`
       فتنعكس تلقائيًا في RTL. سهم «التالي» مثال؛ أيقونة «تعديل» لا تنعكس.

   ⚠️ زرّ الأيقونة الوحيدة يحمل `aria-label`، ويبقى النصّ داخل الزرّ مخفيًا
      بصريًا لا محذوفًا — فيقرؤه قارئ الشاشة ويجده بحث الصفحة.
   ============================================================================ */

export const BUTTON_ICONS_SOURCE = `
<button apButton variant="primary">
  <svg apIconStart viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
  إضافة دورة
</button>

<button apButton variant="secondary">
  التالي
  <svg apIconEnd apIconFlip viewBox="0 0 24 24" aria-hidden="true">
    <path d="M9 6l6 6-6 6" />
  </svg>
</button>

<button apButton variant="secondary">بلا أيقونة</button>

<button apButton variant="tertiary" [iconOnly]="true" aria-label="تعديل">
  <svg apIconStart viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 20h4L19 9a2 2 0 0 0-3-3L5 17v3z" />
  </svg>
  تعديل
</button>
`;

@Component({
  selector: 'demo-button-icons',
  standalone: true,
  imports: [ApButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: BUTTON_ICONS_SOURCE,
})
export class ButtonIconsDemo {}
