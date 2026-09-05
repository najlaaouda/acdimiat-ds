import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ApAppHeaderComponent, ApAvatarComponent, ApButtonComponent } from 'src/app/ui';

/* ============================================================================
   معاينة حيّة — الشريط العلوي
   ----------------------------------------------------------------------------
   الثابت هو القالب نفسه — انظر التعليق في `button-variants.demo.ts`.

   ⚠️ `[sticky]="false"` هنا وحدها: مسرح المعاينة حاوٍ يمرَّر بنفسه، فالشريط
      اللاصق يلتصق بحافّة المسرح لا بحافّة الشاشة فيبدو معطوبًا. القيمة
      الافتراضية في التطبيق هي `true`.

   ⚠️ والأيقونات هنا SVG سطرية لا `<i class="fa-…">`: مسرح المعاينة بتغليف
      ShadowDom، والأوراق العالمية — ومنها Font Awesome — لا تعبر الجذر
      الظلّي. الأيقونة الخطّية تعمل في الطرفين، وفي اللوحة تُكتب بأصناف
      Font Awesome نفسها المستعملة في الشريط الجانبي.

   ─── رابط الموقع أيقونة بجانب الاسم، لا زرّ في الطرف المقابل ────────────────
   كان زرًّا من ثلاث كلمات («زيارة موقع أكاديميتي») يقف بجوار «إضافة سريعة».
   والموقع هو موقع **ذلك الاسم** المكتوب في أوّل الشريط، فالمسافة بينهما هي
   ما كانت تخفي العلاقة — وحين لاصقه صار الرسم وحده كافيًا، وسقط عرضٌ دائم
   كان محجوزًا لفعلٍ يقع مرّة في الجلسة. ومعه سقط سؤال «أيّهما الفعل
   الأساسي؟»: البنفسجي في هذا الشريط صار واحدًا لا اثنين.

   ─── ترتيب الأدوات ─────────────────────────────────────────────────────────
   بتواتر ما خلفها لا بعموم معناها: الإشعارات أوّلًا (وحدها ما يتغيّر في اليوم
   مرارًا وتحمل عدّادًا يُقرأ بلا نقر)، ثم التذاكر (طابور يُفرَغ)، ثم الإعدادات
   (وجهة تُزار حين يُقصَد إليها). والحساب آخرًا ملاصقًا للحافّة: هو «ما يخصّني»
   لا أداة عمل.
   ============================================================================ */

export const APP_HEADER_ANATOMY_SOURCE = `
<ap-app-header
  academyName="اكاديمية ثابت حجازي"
  academyUrl="https://example.com"
  [sticky]="false"
>
  <a apAppHeaderBrand href="#" (click)="$event.preventDefault()" aria-label="أكاديميات — الصفحة الرئيسية">
    <img src="/assets/images/logo.svg" alt="" />
  </a>

  <button apAppHeaderActions type="button" apButton variant="primary">
    <svg apIconStart viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
    إضافة سريعة
  </button>

  <button apAppHeaderTools type="button" apButton variant="tertiary" [iconOnly]="true" aria-label="الإشعارات">
    <svg apIconStart viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10.3 21a2 2 0 0 0 3.4 0" />
    </svg>
    الإشعارات
  </button>

  <button apAppHeaderTools type="button" apButton variant="tertiary" [iconOnly]="true" aria-label="تذاكر العملاء">
    <svg apIconStart viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
    تذاكر العملاء
  </button>

  <button apAppHeaderTools type="button" apButton variant="tertiary" [iconOnly]="true" aria-label="الإعدادات">
    <svg apIconStart viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3.25" />
      <path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.5-2-3.4-2.3 1a7.6 7.6 0 0 0-2.6-1.5L14 2.5h-4l-.5 2.6a7.6 7.6 0 0 0-2.6 1.5l-2.3-1-2 3.4 2 1.5a7.6 7.6 0 0 0 0 3l-2 1.5 2 3.4 2.3-1a7.6 7.6 0 0 0 2.6 1.5l.5 2.6h4l.5-2.6a7.6 7.6 0 0 0 2.6-1.5l2.3 1 2-3.4z" />
    </svg>
    الإعدادات
  </button>

  <button
    apAppHeaderTools
    apAppHeaderAccount
    type="button"
    aria-haspopup="menu"
    [attr.aria-expanded]="false"
    aria-label="قائمة الحساب — نجلاء العتيبي"
  >
    <ap-avatar name="نجلاء العتيبي" size="sm" [decorative]="true" />
    <svg class="ap-app-header__account-chevron" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  </button>
</ap-app-header>
`;

@Component({
  selector: 'demo-app-header-anatomy',
  standalone: true,
  imports: [ApAppHeaderComponent, ApButtonComponent, ApAvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: block; }'],
  template: APP_HEADER_ANATOMY_SOURCE,
})
export class AppHeaderAnatomyDemo {}
