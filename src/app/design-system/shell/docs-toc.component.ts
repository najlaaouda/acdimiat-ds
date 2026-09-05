import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnDestroy,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';

import { docSectionAnchor, docSectionTitle } from '../core/doc-anchor';
import { DocSection } from '../core/doc.model';

/* ============================================================================
   Acadimiat Design System Docs — فهرس الصفحة
   ----------------------------------------------------------------------------
   مشتقّ من `sections` — لا قائمة مكتوبة يدويًا، فالفهرس لا يتقادم.

   ⚠️ التمرير داخل حاوية مخصّصة لا النافذة:
   الغلاف يملك تمريره (`.docs-main`) لأن `body { overflow-x: hidden }` يكسر
   `position: sticky`. لذا:
     • القفز إلى مرساة لا يُترك لسلوك المتصفّح الافتراضي — نمرّر الحاوية يدويًا.
     • `IntersectionObserver` يحتاج `root` صريحًا يشير إلى الحاوية، وإلا
       راقب نافذةً لا تتحرّك أصلًا فلا يُضاء شيء أبدًا.

   ⚠️ SSR: `IntersectionObserver` غير موجود على الخادم. كل شيء هنا خلف
      `isPlatformBrowser` — الفهرس يُصيَّر كروابط عاملة، والإضاءة وحدها
      تنتظر المتصفّح.
   ============================================================================ */

interface TocItem {
  anchor: string;
  title: string;
}

@Component({
  selector: 'app-docs-toc',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (items().length > 1) {
      <nav class="docs-toc" aria-label="محتويات الصفحة">
        <p class="docs-toc__title">في هذه الصفحة</p>
        <ul class="docs-toc__list">
          @for (item of items(); track item.anchor) {
            <li>
              <a
                class="docs-toc__link"
                [class.docs-toc__link--active]="item.anchor === activeAnchor()"
                [href]="'#' + item.anchor"
                [attr.aria-current]="item.anchor === activeAnchor() ? 'true' : null"
                (click)="jumpTo($event, item.anchor)"
              >{{ item.title }}</a>
            </li>
          }
        </ul>
      </nav>
    }
  `,
})
export class DocsTocComponent implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  private readonly sections$ = signal<readonly DocSection[]>([]);
  private readonly active$ = signal<string | null>(null);

  private observer?: IntersectionObserver;
  /** الأقسام المرئية الآن — الأعلى منها هو النشط. */
  private visible = new Set<string>();

  @Input({ required: true })
  set sections(value: readonly DocSection[]) {
    this.sections$.set(value ?? []);
    this.active$.set(null);
    /*
      المكوّن لا يُعاد إنشاؤه عند الانتقال بين صفحتين، فلولا إعادة الربط هنا
      لظلّ المراقب معلّقًا على عناصر الصفحة السابقة — وقد أزيلت من الشجرة.
    */
    queueMicrotask(() => this.observeSections());
  }

  protected readonly items = computed<TocItem[]>(() =>
    this.sections$()
      .map((section, index) => {
        const title = docSectionTitle(section);
        return title ? { anchor: docSectionAnchor(index), title } : null;
      })
      .filter((item): item is TocItem => item !== null),
  );

  protected readonly activeAnchor = this.active$.asReadonly();

  /**
   * القفز اليدوي: `href="#…"` يبقى في الترميز ليعمل الرابط بلا JS ويُنسخ
   * صحيحًا، لكن التمرير الفعلي يجري داخل `.docs-main` لا في النافذة.
   */
  protected jumpTo(event: Event, anchor: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const target = document.getElementById(anchor);
    const container = this.scrollContainer();
    if (!target || !container) {
      return;
    }

    event.preventDefault();

    const offset = target.getBoundingClientRect().top
      - container.getBoundingClientRect().top
      + container.scrollTop;

    container.scrollTo({
      top: offset,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });

    /*
      نقل التركيز إلى القسم، لا التمرير وحده. مستخدم لوحة المفاتيح الذي يضغط
      رابط فهرس ثم Tab يجب أن يتابع من القسم المقصود لا من رأس الصفحة —
      وهذا هو الفرق بين فهرس يعمل وفهرس يبدو أنه يعمل.
    */
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }

  private observeSections(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.observer?.disconnect();
    this.visible.clear();

    const container = this.scrollContainer();
    if (!container) {
      return;
    }

    this.observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.visible.add(entry.target.id);
          } else {
            this.visible.delete(entry.target.id);
          }
        }
        this.syncActive();
      },
      {
        root: container,
        /*
          شريط رفيع قرب أعلى الحاوية: القسم يصبح «نشطًا» عند بلوغه أعلى
          الشاشة لا عند مجرّد ظهوره. بلا هذا التضييق تكون عدّة أقسام مرئية
          معًا فيقفز التمييز بلا معنى.
        */
        rootMargin: '0px 0px -80% 0px',
        threshold: 0,
      },
    );

    for (const item of this.items()) {
      const element = document.getElementById(item.anchor);
      if (element) {
        this.observer.observe(element);
      }
    }
  }

  /** الأعلى بين المرئيّات — بترتيب الأقسام لا بترتيب وصول الأحداث. */
  private syncActive(): void {
    const first = this.items().find(item => this.visible.has(item.anchor));
    this.active$.set(first?.anchor ?? null);
  }

  private scrollContainer(): HTMLElement | null {
    return isPlatformBrowser(this.platformId)
      ? document.getElementById('docs-main')
      : null;
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function'
    && matchMedia('(prefers-reduced-motion: reduce)').matches;
}
