import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation, signal } from '@angular/core';

/* ============================================================================
   Acadimiat Design System Docs — مسرح المعاينة
   ----------------------------------------------------------------------------
   ⚠️ `ViewEncapsulation.ShadowDom` — وهو القرار المركزي في هذا الملف.

   ─── المشكلة ───────────────────────────────────────────────────────────────
   `bootstrap.css` و`panel-style.css` و`styles.scss` تُحمَّل على كل مسار وتحوي
   محدّدات عناصر عارية (`button { … }`، `* { outline: none }`) و390 `!important`.
   مكوّن معروض داخل الصفحة يرثها كلها، فتصبح المعاينة صورة عن **التلوّث** لا
   عن المكوّن.

   ─── الحلّ ─────────────────────────────────────────────────────────────────
   الجذر الظلّي يحجب أوراق الأنماط العالمية بالكامل، بينما تعبر الـ custom
   properties بالوراثة — فيرث المكوّن كل الـ tokens من `.ap-docs` وينجو من
   التلوّث. وAngular ينسخ أنماط المكوّنات المتداخلة إلى الجذر الظلّي، فتصل
   أنماط `ap-button` إلى الداخل بينما تبقى أنماط القالب المشترى خارجًا.

   ─── لماذا لا iframe ───────────────────────────────────────────────────────
   يعزل أكثر، لكنه يقطع الوراثة فتحتاج حقن الـ tokens يدويًا، ويعقّد قياس
   الارتفاع، ويكسر أي طبقة عائمة تُلحق بـ `body`. يبقى محجوزًا لمعاينات
   «صفحة كاملة» في مرحلة الأنماط.

   ⚠️ حدّ معروف: طبقات CDK و tippy تُلحق بـ `body` خارج الجذر الظلّي، فلن
      ترث أنماط المسرح. معاينات Modal و Tooltip ستحتاج معالجة خاصة عند بنائها.
   ============================================================================ */

@Component({
  selector: 'app-docs-demo-stage',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <div class="stage" [attr.dir]="directionValue()">
      <ng-content />
    </div>
  `,
  styles: [
    `
      /*
        داخل جذر ظلّي، فلا حاجة إلى بادئة نطاق: هذه الأنماط لا تخرج، ولا
        تدخلها الأنماط العالمية. هذا هو الاستثناء الوحيد من قاعدة النطاق
        ap-docs في هذا المشروع، وهو استثناء بنيوي لا اصطلاحي.
      */
      /*
        الجذر الظلّي يحجب الأنماط العالمية — وهو المقصود — لكنه يحجب معها
        القواعد المفيدة، وأهمّها box-sizing: border-box من bootstrap.css.

        بدون إعادتها هنا يُعرض المكوّن بصندوق مختلف عمّا يظهر به في التطبيق
        الحقيقي، فتفقد المعاينة صدقها في أدقّ ما يُفترض أن تثبته: الأبعاد.
      */
      *,
      *::before,
      *::after {
        box-sizing: border-box;
      }

      :host {
        display: block;
      }

      .stage {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--ap-space-3);
        min-height: var(--ap-space-16);
        padding: var(--ap-space-8);
        background: var(--ap-color-bg-surface);
        color: var(--ap-color-text-primary);
        font-family: var(--ap-font-sans);
      }
    `,
  ],
})
export class DocsDemoStageComponent {
  private readonly direction$ = signal<'rtl' | 'ltr'>('rtl');

  @Input()
  set direction(value: 'rtl' | 'ltr') {
    this.direction$.set(value ?? 'rtl');
  }

  protected readonly directionValue = this.direction$.asReadonly();
}
