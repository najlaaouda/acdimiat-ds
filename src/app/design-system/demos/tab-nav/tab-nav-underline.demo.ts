import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';

import { ApTabNavComponent, ApTabNavLinkDirective } from 'src/app/ui';

/* ============================================================================
   معاينة حيّة — الشريط الأفقي ومظهر الحافّة
   ----------------------------------------------------------------------------
   الثابت هو القالب نفسه — انظر التعليق في `button-variants.demo.ts`.

   ─── لماذا معامل استعلام لا حالة محلّية ────────────────────────────────────
   لأن المكوّن **تنقّل**، ومعاينته بحالة محلّية تكذب في أهمّ ما فيه: أن
   العنوان يتغيّر، وأن زرّ «رجوع» يعمل، وأن الرابط يُنسخ ويُفتح في تبويب
   جديد على القسم نفسه. جرّب: انقر قسمًا ثم اضغط رجوع.

   والمعامل يبقى داخل صفحة التوثيق هذه (`routerLink="."`) فلا تُغادرها
   المعاينة، وهو في الوقت نفسه **الوضع اليدوي** بعينه — النمط الذي تحتاجه
   شاشات `page-edit` المقادة بمعامل استعلام.

   ⚠️ ولاحظ ما لا يُكتب هنا: لا `aria-current` ولا كلاس `active`. الموجّه
      يشتقّ الاثنين من مصدر واحد، والمحدّد الذي يُلوّن النشط هو السمة
      الدلالية نفسها.
   ============================================================================ */

export const TAB_NAV_UNDERLINE_SOURCE = `
<ap-tab-nav label="أقسام الدورة" appearance="underline">
  @for (section of sections; track section.id) {
    <a
      [apTabNavLink]="current() === section.id"
      routerLink="."
      [queryParams]="{ tabNavDemo: section.id }"
      queryParamsHandling="merge"
      >{{ section.title }}</a
    >
  }
</ap-tab-nav>
`;

@Component({
  selector: 'demo-tab-nav-underline',
  standalone: true,
  imports: [ApTabNavComponent, ApTabNavLinkDirective, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: block; }'],
  template: TAB_NAV_UNDERLINE_SOURCE,
})
export class TabNavUnderlineDemo {
  private readonly route = inject(ActivatedRoute);

  protected readonly sections = [
    { id: 'start', title: 'ابدأ الآن' },
    { id: 'info', title: 'البيانات' },
    { id: 'content', title: 'المحتوى' },
    { id: 'price', title: 'التسعير' },
    { id: 'coupons', title: 'الكوبونات' },
    { id: 'students', title: 'المتدرّبون' },
    { id: 'reviews', title: 'التقييمات' },
  ];

  protected readonly current = toSignal(
    this.route.queryParamMap.pipe(map(params => params.get('tabNavDemo') ?? 'start')),
    { initialValue: 'start' },
  );
}
