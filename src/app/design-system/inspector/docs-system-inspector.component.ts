import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  inject,
} from '@angular/core';

/**
 * نقطة تركيب فاحص النظام داخل غلاف التوثيق.
 *
 * ─── لماذا هنا ولماذا هكذا ─────────────────────────────────────────────────
 * • **يُشحن مع موقع التوثيق المستقل.** في اللوحة تبقى الأداة محجوبة عن
 *   الإنتاج، لأن وجودها هناك يمنح مستخدم اللوحة مقبضًا يغيّر النظام أمامه
 *   بلا أثر يُحفظ. أمّا هذا التطبيق فهو *الموقع الذي يوثّق النظام*: التعديل
 *   الحيّ على التوكنات هو ما جاء الزائر لأجله، وانعدام الحفظ ميزة لا عيب —
 *   إعادة التحميل تُرجع النظام كما هو في الشيفرة.
 *
 * • **`afterNextRender` لا `ngOnInit`.** الأداة تقرأ `document.styleSheets`
 *   و`getComputedStyle`، وكلاهما غير موجود على الخادم — والوصول غير المحروس
 *   يُفشل عرض SSR كلّه لا هذا المكوّن وحده.
 *
 * • **العنصر المضيف فارغ.** الأداة ترسم عبر `createPortal` إلى `body`، فلا
 *   يحمل هذا المكوّن أي تخطيط ولا يشغل حيّزًا في الغلاف.
 *
 * ⚠️ ورقة أنماط الأداة في قائمة `styles` الأساسية في `angular.json`، فتُحقن
 *    في التهيئتين معًا. لا تُعِدها إلى `development` وحدها: الأداة تعمل هنا
 *    في الإنتاج، وبلا الورقة تُركَّب بلا نمط واحد.
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
