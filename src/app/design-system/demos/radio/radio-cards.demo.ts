import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { ApChoiceComponent, ApChoiceGroupComponent, ApRadioDirective } from 'src/app/ui';

/* ============================================================================
   معاينة حيّة — الخيارات في بطاقات
   ----------------------------------------------------------------------------
   الثابت هو القالب نفسه — انظر التعليق في `button-variants.demo.ts`.

   ─── ما يُقاس هنا ──────────────────────────────────────────────────────────
   ثلاثة أشياء لا يفعلها الصفّ العاري:

     • البطاقة تعطي الخيار صندوقًا يقول أين يبدأ وأين ينتهي، والنقر في أي
       موضع منه يختاره — لا على الشكل الصغير وحده.
     • الحدّ حاضر دائمًا ويتغيّر لونه وحده، فلا يقفز شيء لحظة النقر.
     • التفصيل يظهر **عند الاختيار وحده**، بلا سطر TypeScript: الظهور من
       :has(:checked) في ورقة المكوّن.

   وجرّبها بلوحة المفاتيح: الأسهم تنقل الاختيار داخل المجموعة (سلوك الراديو
   الأصلي)، وحلقة التركيز تُرسم على البطاقة كلّها لا حول الشكل الصغير.
   ============================================================================ */

export const RADIO_CARDS_SOURCE = `
<ap-choice-group label="الصلاحية" appearance="card">
  <ap-choice label="عميل">
    <input apRadio type="radio" [checked]="role() === 'trainee'" (change)="role.set('trainee')" />
    <p apChoiceDetail>لا يملك صلاحية الوصول إلى إدارة المنصة.</p>
  </ap-choice>

  <ap-choice label="مدير">
    <input apRadio type="radio" [checked]="role() === 'admin'" (change)="role.set('admin')" />
    <p apChoiceDetail>لديه جميع الصلاحيات باستثناء حذف المدراء أو إضافتهم.</p>
  </ap-choice>

  <ap-choice label="مشرف">
    <input apRadio type="radio" [checked]="role() === 'moderator'" (change)="role.set('moderator')" />
    <div apChoiceDetail>
      <p class="lead">لديه جميع الصلاحيات باستثناء:</p>
      <ul class="list">
        <li>إخفاء الأكاديمية</li>
        <li>حذف منتج</li>
        <li>حذف مقطع فيديو</li>
        <li>الوصول الكامل إلى الإحصائيات والتقارير</li>
        <li>إضافة أو حذف المشرفين</li>
        <li>المعاملات المالية</li>
      </ul>
    </div>
  </ap-choice>
</ap-choice-group>
`;

@Component({
  selector: 'demo-radio-cards',
  standalone: true,
  imports: [ApChoiceGroupComponent, ApChoiceComponent, ApRadioDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    ':host { display: block; max-width: 560px; }',
    '.lead { margin: 0 0 var(--ap-space-1); }',
    '.list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));' +
      ' gap: var(--ap-space-0-5) var(--ap-space-4); padding-inline-start: var(--ap-space-4); margin: 0; }',
  ],
  template: RADIO_CARDS_SOURCE,
})
export class RadioCardsDemo {
  protected readonly role = signal<'trainee' | 'admin' | 'moderator'>('admin');
}
