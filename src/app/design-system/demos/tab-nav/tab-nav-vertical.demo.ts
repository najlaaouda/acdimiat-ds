import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';

import { ApTabNavComponent, ApTabNavLinkDirective } from 'src/app/ui';

/* ============================================================================
   معاينة حيّة — الشريط العمودي ومظهر الحبّة
   ----------------------------------------------------------------------------
   هذا هو الشكل القائم في اللوحة اليوم: عمود بجانب المحتوى، والنشط حبّة
   بنفسجية ممتلئة. المظهر مقصود أن يكون **هو هو** كي لا يغيّر ترحيلُ الاثنتي
   عشرة شاشةً شكلَها — ما يتغيّر هو ما تحته: أبيض على purple-700 (8.03:1)
   بدل افتراضي bootstrap (أبيض على برتقالي = 2.69:1)، و`aria-current` تُكتب
   بدل أن تُنسى.

   والرابط المعطَّل هنا يبقى في ترتيب التنقّل ويُعلن تعطيله — لا يُخرَج منه:
   قسم يختفي من الشريط بلا تفسير أسوأ من قسم يقول «غير متاح».
   ============================================================================ */

export const TAB_NAV_VERTICAL_SOURCE = `
<ap-tab-nav label="إعدادات الأكاديمية" orientation="vertical">
  @for (section of sections; track section.id) {
    <a
      [apTabNavLink]="current() === section.id"
      [disabled]="section.disabled"
      routerLink="."
      [queryParams]="{ tabNavSide: section.id }"
      queryParamsHandling="merge"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path [attr.d]="section.icon" />
      </svg>
      {{ section.title }}
    </a>
  }
</ap-tab-nav>
`;

/* مسارات أيقونات خطّية — تُرسم بـ stroke لا fill، كاصطلاح المكتبة. */
const ICON_GENERAL = 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z';
const ICON_BELL = 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0';
const ICON_CARD = 'M2 9h20M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z';
const ICON_PLUG = 'M9 2v6M15 2v6M6 8h12v4a6 6 0 0 1-12 0V8ZM12 18v4';
const ICON_KEY = 'M21 2 19 4M15.5 8.5a5 5 0 1 1-7 7 5 5 0 0 1 7-7ZM15.5 8.5 21 3l-2-1M17 7l2 2';

@Component({
  selector: 'demo-tab-nav-vertical',
  standalone: true,
  imports: [ApTabNavComponent, ApTabNavLinkDirective, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: block; max-width: 260px; }'],
  template: TAB_NAV_VERTICAL_SOURCE,
})
export class TabNavVerticalDemo {
  private readonly route = inject(ActivatedRoute);

  protected readonly sections = [
    { id: 'general', title: 'عام', icon: ICON_GENERAL, disabled: false },
    { id: 'notifications', title: 'الإشعارات', icon: ICON_BELL, disabled: false },
    { id: 'billing', title: 'الفواتير', icon: ICON_CARD, disabled: false },
    { id: 'integrations', title: 'الربط', icon: ICON_PLUG, disabled: false },
    { id: 'api', title: 'مفاتيح API', icon: ICON_KEY, disabled: true },
  ];

  protected readonly current = toSignal(
    this.route.queryParamMap.pipe(map(params => params.get('tabNavSide') ?? 'general')),
    { initialValue: 'general' },
  );
}
