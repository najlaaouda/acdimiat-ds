import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  inject,
  isDevMode,
} from '@angular/core';

/**
 * نقطة تركيب فاحص النظام داخل غلاف التوثيق.
 *
 * ─── لماذا هنا ولماذا هكذا ─────────────────────────────────────────────────
 * • **وضع التطوير فقط.** الأداة تُحرّر التوكنات في المتصفّح ولا تكتب ملفًّا،
 *   فوجودها في الإنتاج يمنح الزائر مقبضًا يغيّر النظام أمامه بلا أثر.
 *
 * • **`afterNextRender` لا `ngOnInit`.** الأداة تقرأ `document.styleSheets`
 *   و`getComputedStyle`، وكلاهما غير موجود على الخادم — والوصول غير المحروس
 *   يُفشل عرض SSR كلّه لا هذا المكوّن وحده.
 *
 * • **العنصر المضيف فارغ.** الأداة ترسم عبر `createPortal` إلى `body`، فلا
 *   يحمل هذا المكوّن أي تخطيط ولا يشغل حيّزًا في الغلاف.
 *
 * ⚠️ ورقة أنماط الأداة مسجَّلة في `angular.json` تحت تهيئة `development` وحدها.
 *    نقلها إلى قائمة `styles` العامّة يشحنها للإنتاج بلا مستهلك.
 */
@Component({
  selector: 'docs-system-inspector',
  standalone: true,
  template: '',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsSystemInspectorComponent implements OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  private teardown: (() => void) | null = null;
  private destroyed = false;

  constructor() {
    if (!isDevMode()) {
      return;
    }

    afterNextRender(() => {
      void import('./system-inspector.loader').then(async ({ mountSystemInspector }) => {
        const teardown = await mountSystemInspector(this.host);
        /*
          الاستيراد الديناميكي غير متزامن، فقد يُدمَّر المكوّن قبل وصوله —
          والتفكيك حينها يجب أن يقع فورًا، وإلّا بقيت الأداة معلّقة في `body`
          بعد مغادرة الغلاف.
        */
        if (this.destroyed) {
          teardown();
          return;
        }
        this.teardown = teardown;
      });
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.teardown?.();
    this.teardown = null;
  }
}
