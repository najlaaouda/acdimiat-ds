import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApFieldComponent, ApPhoneFieldComponent } from 'src/app/ui';

/* ============================================================================
   معاينة حيّة — حقل رقم الجوال
   ----------------------------------------------------------------------------
   الثابت هو القالب نفسه — انظر التعليق في `button-variants.demo.ts`.

   جرّب ثلاثة أشياء:
   • افتح قائمة الدول واكتب «امار» أو «971» أو «٩٧١» — البحث يطابق الاسم
     العربي والإنجليزي والرمز ورمز الاتّصال، ويطبّع الأرقام العربية.
   • الصق «‎+971501234567‎» في حقل الرقم والمحدِّد على السعودية — ينتقل إلى
     الإمارات وحده: الرقم يملك الحقيقة لا المحدِّد.
   • اخرج من الحقل بعد كتابة رقم صالح — يُنسَّق عند المغادرة لا أثناء الكتابة.

   ⚠️ العلم يظهر شارة رمز (SA) لا علمًا: لم تُركَّب مجموعة SVG بعد. القيمة
      المعروضة تحت كل حقل هي E.164 الحقيقية المبثوثة إلى النموذج.
   ============================================================================ */

export const PHONE_ANATOMY_SOURCE = `
<ap-field label="رقم الجوال" [required]="true" hint="نرسل عليه رمز التحقّق.">
  <ap-phone-field [(ngModel)]="phone" defaultCountry="SA" />
</ap-field>

<ap-field label="رقم بديل" hint="اختياري — للتواصل عند تعذّر الأول.">
  <ap-phone-field [(ngModel)]="alt" defaultCountry="AE" />
</ap-field>

<ap-field label="رقم الدعم" hint="يُدار من إعدادات الأكاديمية.">
  <ap-phone-field [(ngModel)]="support" [disabled]="true" />
</ap-field>
`;

@Component({
  selector: 'demo-phone-anatomy',
  standalone: true,
  imports: [ApFieldComponent, ApPhoneFieldComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    ':host { display: flex; flex-direction: column; gap: var(--ap-space-4); width: 100%; }',
    /* عرض القيمة المبثوثة — يُثبت أن العقد E.164 لا نصّ الحقل. */
    ':host .demo-value { color: var(--ap-color-text-tertiary); font-size: var(--ap-font-size-xs); }',
  ],
  template: `
    ${PHONE_ANATOMY_SOURCE}
    <p class="demo-value" dir="ltr">{{ phone || '—' }}</p>
  `,
})
export class PhoneAnatomyDemo {
  protected phone: string | null = null;
  protected alt: string | null = '+971501234567';
  protected support: string | null = '+966920000000';
}
