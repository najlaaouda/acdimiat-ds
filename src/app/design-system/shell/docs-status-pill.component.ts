import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';

import { DocStatus } from '../core/doc.model';

/* ============================================================================
   Acadimiat Design System Docs — شارة الحالة
   ----------------------------------------------------------------------------
   تعرض نضج الصفحة. مستخدمة في الشريط الجانبي ورأس الصفحة وبطاقات الفهرس —
   تعريف واحد لا ثلاثة.

   ⚠️ الحالة تُنقل بالنصّ لا باللون وحده (WCAG 1.4.1). الشكل المضغوط في
   الشريط الجانبي نقطة ملوّنة، لكنها تحمل `title` ونصًّا لقارئ الشاشة —
   فلا معلومة تضيع على من لا يميّز اللون.
   ============================================================================ */

interface StatusPresentation {
  label: string;
  description: string;
  /** لا يُعرض الشكل المضغوط للحالة المستقرّة — ضجيج بصري بلا فائدة. */
  showWhenCompact: boolean;
}

export const DOC_STATUS_PRESENTATION: Readonly<Record<DocStatus, StatusPresentation>> = {
  stable: {
    label: 'موحّد',
    description: 'معتمد ومستقرّ — يُستخدم كما هو موثَّق.',
    showWhenCompact: false,
  },
  'in-progress': {
    label: 'قيد الترحيل',
    description: 'المواصفة معتمدة والتنفيذ جارٍ في المشروع.',
    showWhenCompact: true,
  },
  'not-standardized': {
    label: 'غير موحّد',
    description: 'موجود بتنفيذات متعدّدة — لا مواصفة معتمدة بعد.',
    showWhenCompact: true,
  },
  planned: {
    label: 'مخطَّط',
    description: 'لم يُبنَ بعد. موثَّق كنيّة لا كواقع.',
    showWhenCompact: true,
  },
};

@Component({
  selector: 'app-docs-status-pill',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <span
        class="docs-status"
        [class.docs-status--compact]="isCompact()"
        [attr.data-status]="currentStatus()"
        [attr.title]="tooltip()"
      >
        <span class="docs-status__dot" aria-hidden="true"></span>
        <span [class.docs-sr-only]="isCompact()">{{ presentation().label }}</span>
      </span>
    }
  `,
})
export class DocsStatusPillComponent {
  private readonly status$ = signal<DocStatus>('stable');
  private readonly compact$ = signal(false);

  @Input({ required: true })
  set status(value: DocStatus) {
    this.status$.set(value);
  }

  /** الشكل المضغوط: نقطة فقط، والنصّ لقارئ الشاشة — للشريط الجانبي. */
  @Input()
  set compact(value: boolean) {
    this.compact$.set(value);
  }

  protected readonly currentStatus = this.status$.asReadonly();
  protected readonly isCompact = this.compact$.asReadonly();

  protected readonly presentation = computed(
    () => DOC_STATUS_PRESENTATION[this.status$()],
  );

  protected readonly visible = computed(
    () => !this.compact$() || this.presentation().showWhenCompact,
  );

  protected readonly tooltip = computed(() => {
    const { label, description } = this.presentation();
    return this.compact$() ? `${label} — ${description}` : null;
  });
}
