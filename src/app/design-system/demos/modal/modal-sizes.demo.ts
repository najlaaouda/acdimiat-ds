import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { ApButtonComponent, ApModalComponent, ApModalSize } from 'src/app/ui';

/* ============================================================================
   معاينة حيّة — المقاسات والنافذة المُلزِمة
   ----------------------------------------------------------------------------
   الثابت هو القالب نفسه — انظر التعليق في `button-variants.demo.ts`.

   المقاسات الثلاثة **حدّ أقصى للعرض** لا عرضًا ثابتًا: البطاقة تنكمش دون
   ذلك متى ضاقت الشاشة، لأن حشوة الغلاف (`--ap-dialog-margin`) تحكمها قبل
   المقاس. صغّر النافذة وستجد الثلاثة تتطابق على الجوّال — وهو الصحيح.

   والنافذة الأخيرة **مُلزِمة**: لا Esc ولا نقر على الخلفية ولا زرّ إغلاق.
   ولذلك بالضبط لها زرّ إلغاء صريح في الذيل — نافذة مُلزِمة بلا مخرج تحبس
   المستخدم، وهي مخالفة صريحة لـ WCAG 2.1.2.
   ============================================================================ */

export const MODAL_SIZES_SOURCE = `
<button apButton variant="secondary" (click)="show('sm')">صغيرة — 400px</button>
<button apButton variant="secondary" (click)="show('md')">متوسّطة — 480px</button>
<button apButton variant="secondary" (click)="show('lg')">كبيرة — 640px</button>
<button apButton variant="danger" (click)="binding.set(true)">مُلزِمة</button>

<ap-modal
  [size]="size()"
  heading="مقاس النافذة"
  description="العرض حدّ أقصى، والحشوة عن حافّة الشاشة تحكمه قبله."
  [open]="open()"
  (openChange)="open.set($event)"
>
  <p>هذه النافذة بمقاس {{ size() }}. غيّر عرض المتصفّح وأعد فتحها.</p>

  <button apButton apModalFooter variant="tertiary" (click)="open.set(false)">إغلاق</button>
</ap-modal>

<ap-modal
  size="sm"
  heading="حذف الدورة نهائيًا"
  description="سيفقد 42 متدرّبًا وصولهم إلى محتواها فورًا. لا يمكن التراجع."
  [dismissible]="false"
  [open]="binding()"
  (openChange)="binding.set($event)"
>
  <button apButton apModalFooter variant="secondary" (click)="binding.set(false)">إلغاء</button>
  <button apButton apModalFooter variant="danger" (click)="binding.set(false)">حذف نهائي</button>
</ap-modal>
`;

@Component({
  selector: 'demo-modal-sizes',
  standalone: true,
  imports: [ApButtonComponent, ApModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    ':host { display: flex; flex-wrap: wrap; gap: var(--ap-space-3); align-items: center; }',
  ],
  template: MODAL_SIZES_SOURCE,
})
export class ModalSizesDemo {
  protected readonly open = signal(false);
  protected readonly binding = signal(false);
  protected readonly size = signal<ApModalSize>('md');

  protected show(size: ApModalSize): void {
    this.size.set(size);
    this.open.set(true);
  }
}
