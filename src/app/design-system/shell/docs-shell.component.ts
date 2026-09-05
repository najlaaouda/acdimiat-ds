import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { Subscription, filter } from 'rxjs';

import { DOCS_ROOT } from '../core/docs-nav.config';
import { DocsSystemInspectorComponent } from '../inspector/docs-system-inspector.component';
import { DocsSidebarComponent } from './docs-sidebar.component';

/* ============================================================================
   Acadimiat Design System Docs — الغلاف (Shell)
   ----------------------------------------------------------------------------
   المسؤوليات: النطاق `.ap-docs` · التخطيط · شريط علوي · شريط جانبي ·
   حاوية التمرير · إعادة التمرير إلى الأعلى عند تغيير المسار.

   ⚠️ ViewEncapsulation.None — مقصود ومقيَّد بقاعدة واحدة صارمة:

       كل محدّد في `docs-shell.component.scss` يبدأ بـ `.ap-docs`.

   السبب: صفحات التوثيق مكوّنات أبناء، والتغليف المُحاكى (emulated) يمنع
   أنماط الغلاف من بلوغها. والثمن: هذه الأنماط تبقى في `<head>` بعد مغادرة
   المسار — فأي محدّد عارٍ هنا يلوّث لوحة الإدارة والموقع العام معًا.
   القاعدة أعلاه هي ما يمنع ذلك، وهي غير قابلة للتفاوض.

   ⚠️ حاوية تمرير مستقلّة لا `position: sticky` — متعمّد:
   `panel-style.css` يضع `body { overflow-x: hidden }`، وهذا يجعل المتصفّح
   يعامل المحور الرأسي كـ `auto` فينكسر `sticky` لكل ما تحته. الحلّ هو أن
   يملك الغلاف تمريره الخاص بدل مصارعة قاعدة عالمية لا نملكها.
   ============================================================================ */

@Component({
  selector: 'app-docs-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, DocsSidebarComponent, DocsSystemInspectorComponent],
  templateUrl: './docs-shell.component.html',
  styleUrl: './docs-shell.component.scss',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ap-docs', 'data-docs-shell': '' },
})
export class DocsShellComponent implements OnDestroy {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly subscription = new Subscription();

  /** حاوية التمرير الفعلية — تُعاد إلى الأعلى مع كل انتقال. */
  @ViewChild('scrollArea') private scrollArea?: ElementRef<HTMLElement>;

  readonly docsRoot = DOCS_ROOT;

  /** الشريط الجانبي على الشاشات الضيّقة: درج يُفتح ويُغلق. */
  readonly navOpen = signal(false);

  constructor() {
    this.subscription.add(
      this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe(() => this.onNavigated()),
    );
  }

  toggleNav(): void {
    this.navOpen.update(open => !open);
  }

  closeNav(): void {
    this.navOpen.set(false);
  }

  /**
   * إعادة التمرير إلى الأعلى بعد كل انتقال.
   *
   * `scrollPositionRestoration: 'enabled'` في الراوتر الجذر يعالج تمرير
   * النافذة، وحاوية التوثيق ليست النافذة — فلولا هذا لظلّت الصفحة الجديدة
   * معروضة من منتصفها.
   */
  private onNavigated(): void {
    this.closeNav();

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const area = this.scrollArea?.nativeElement;
    if (area) {
      area.scrollTop = 0;
    }
  }

  /** رابط التخطّي — الهدف حاوية التمرير لا عنصر خارجها. */
  focusContent(event: Event): void {
    event.preventDefault();

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const main = this.document.getElementById('docs-main');
    if (main) {
      main.focus();
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
