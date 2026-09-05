import { NgComponentOutlet, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  PLATFORM_ID,
  Type,
  inject,
  signal,
} from '@angular/core';

import { DocDemoRef } from '../core/doc.model';
import { DocsDemoStageComponent } from './docs-demo-stage.component';

/* ============================================================================
   Acadimiat Design System Docs — مُصيّر المعاينة الحيّة
   ----------------------------------------------------------------------------
   يركّب مكوّن Angular حقيقيًا — لا لقطة شاشة ولا HTML منسوخًا.

   ─── التحميل الكسول ────────────────────────────────────────────────────────
   `DocDemoRef.load` استيراد ديناميكي يحمله المحتوى نفسه، فيبقى السجلّ بيانات
   خالصة بينما يبقى المعروض مكوّنًا حيًّا. ولا يُستدعى إلا في المتصفّح، فلا
   يثقل SSR ولا يكسره.

   ─── الشيفرة ───────────────────────────────────────────────────────────────
   `source` ليس نصًّا منسوخًا: هو الثابت المُصدَّر من ملف المعاينة نفسه،
   وهو **قالب** ذلك المكوّن. مصدر واحد يُستهلك مرّتين — قالبًا ونصًّا — فلا
   يمكن للوح الشيفرة أن ينحرف عمّا يعمل.
   ============================================================================ */

@Component({
  selector: 'app-doc-demo',
  standalone: true,
  imports: [NgComponentOutlet, DocsDemoStageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-demo">
      <app-docs-demo-stage [direction]="direction()">
        @if (loaded(); as type) {
          <ng-container *ngComponentOutlet="type" />
        } @else {
          <p class="docs-demo__pending">جارٍ تحميل المعاينة…</p>
        }
      </app-docs-demo-stage>

      <div class="docs-demo__bar">
        <div class="docs-demo__controls">
          <!--
            تبديل الاتجاه على المسرح وحده، لا على الصفحة: المكوّن يجب أن
            يُختبر في الاتجاهين، ولا معنى لقلب التوثيق كلّه لأجل ذلك.
          -->
          <button
            type="button"
            class="docs-demo__toggle"
            [attr.aria-pressed]="direction() === 'ltr'"
            (click)="toggleDirection()"
          >{{ direction() === 'rtl' ? 'عرض LTR' : 'عرض RTL' }}</button>

          @if (source()) {
            <button
              type="button"
              class="docs-demo__toggle"
              [attr.aria-expanded]="codeOpen()"
              (click)="toggleCode()"
            >{{ codeOpen() ? 'إخفاء الشيفرة' : 'عرض الشيفرة' }}</button>
          }
        </div>

        @if (copied()) {
          <span class="docs-demo__copied" role="status">نُسخت</span>
        }
      </div>

      @if (codeOpen() && source(); as code) {
        <div class="docs-code">
          <button type="button" class="docs-code__copy" (click)="copy(code)">نسخ</button>
          <pre class="docs-code__pre" dir="ltr"><code>{{ code.trim() }}</code></pre>
        </div>
      }
    </div>
  `,
})
export class DocDemoComponent {
  private readonly platformId = inject(PLATFORM_ID);

  private readonly loaded$ = signal<Type<unknown> | null>(null);
  private readonly source$ = signal<string | null>(null);
  private readonly direction$ = signal<'rtl' | 'ltr'>('rtl');
  private readonly codeOpen$ = signal(false);
  private readonly copied$ = signal(false);

  @Input({ required: true })
  set demo(value: DocDemoRef) {
    this.loaded$.set(null);
    this.source$.set(value?.source ?? null);
    this.codeOpen$.set(false);

    if (value && isPlatformBrowser(this.platformId)) {
      void this.load(value);
    }
  }

  protected readonly loaded = this.loaded$.asReadonly();
  protected readonly source = this.source$.asReadonly();
  protected readonly direction = this.direction$.asReadonly();
  protected readonly codeOpen = this.codeOpen$.asReadonly();
  protected readonly copied = this.copied$.asReadonly();

  protected toggleDirection(): void {
    this.direction$.update(current => (current === 'rtl' ? 'ltr' : 'rtl'));
  }

  protected toggleCode(): void {
    this.codeOpen$.update(open => !open);
  }

  protected copy(code: string): void {
    void navigator.clipboard?.writeText(code.trim()).then(() => {
      this.copied$.set(true);
      setTimeout(() => this.copied$.set(false), 2000);
    });
  }

  /**
   * الوحدة المستوردة تصدّر مكوّنًا واحدًا وثابت مصدره. نلتقط أول تصدير هو
   * دالة (وهو ما يكونه صنف المكوّن بعد الترجمة) بدل اشتراط اسم بعينه —
   * فلا يفرض العقد اصطلاح تسمية على كل ملف معاينة.
   */
  private async load(ref: DocDemoRef): Promise<void> {
    const module = (await ref.load()) as Record<string, unknown>;
    const component = Object.values(module).find(
      (value): value is Type<unknown> => typeof value === 'function',
    );

    if (component) {
      this.loaded$.set(component);
    }
  }
}
