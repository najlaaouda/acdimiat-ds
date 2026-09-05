import { Directive, Input, forwardRef, signal } from '@angular/core';

import { ApFieldControl } from '../field/ap-field-control';

/* ============================================================================
   Acadimiat UI — القائمة المنسدلة
   ----------------------------------------------------------------------------
   موجّه على `<select>` الأصلي، داخل `<ap-field>` كالحقل النصّي تمامًا —
   فيرث الـ label المربوط والنصّ المساعد ورسالة الخطأ بلا سطر إضافي.

   ─── لماذا `<select>` أصلي ─────────────────────────────────────────────────
   القائمة المخصّصة تعيد بناء ما يقدّمه المتصفّح مجانًا: التنقّل بالأسهم،
   والقفز بالكتابة، والإغلاق بـ Esc، وإعلان «قائمة، 3 من 12» في قارئ الشاشة.
   وعلى الجوّال يفتح العنصر الأصلي منتقي النظام — أوسع هدفًا وأسرع من أي
   قائمة مرسومة داخل الصفحة.

   ⚠️ هذا ليس بديلًا عن `<app-native-select>`: ذاك يحلّ ما يعجز عنه العنصر
      الأصلي — البحث داخل الخيارات، والاختيار المتعدّد برقاقات. القاعدة:
      قائمة بسيطة ⇐ `apSelect`؛ بحث أو تعدّد ⇐ `app-native-select`.

   ─── الخيار النائب ────────────────────────────────────────────────────────
   خيار بقيمة فارغة في الأعلى. لونه يتبع لون النصّ البديل في الحقل عبر
   محدّد `:has(option[value='']:checked)` — لا JavaScript ولا قراءة قيمة:
   القاعدة تسري على الخادم والمتصفّح معًا، فلا يومض اللون بعد الترطيب.

   ⚠️ السهم يرسمه `<ap-field>` في قالبه لا صورة خلفية على العنصر: الصورة
      كانت ستدفن قيمة لون خام لا تشتقّ من token، ولا تتبع الحالة المعطَّلة.
      انظر `indicator` في `ApFieldControl`.

   ⚠️ الأنماط في `ap-field.component.scss` — الموجّهات لا تملك أوراق أنماط،
      والقيد مقصود: `apSelect` يستلزم `ApFieldComponent`، فلا قائمة بلا label.
   ============================================================================ */

@Directive({
  selector: 'select[apSelect]',
  standalone: true,
  providers: [{ provide: ApFieldControl, useExisting: forwardRef(() => ApSelectDirective) }],
  host: {
    '[attr.data-size]': 'sizeValue()',
    '[attr.data-invalid]': 'invalidValue() ? "true" : null',
  },
})
export class ApSelectDirective extends ApFieldControl {
  private readonly size$ = signal<'sm' | 'md' | 'lg'>('md');
  private readonly invalid$ = signal(false);

  /** يخبر `<ap-field>` أن يرسم السهم في طرف الصفّ. */
  override readonly indicator = 'chevron' as const;

  @Input()
  set size(value: 'sm' | 'md' | 'lg') {
    this.size$.set(value ?? 'md');
  }

  protected readonly sizeValue = this.size$.asReadonly();
  protected readonly invalidValue = this.invalid$.asReadonly();

  /** يضبطه الحقل الحاوي — لا يُضبط من الخارج. */
  setInvalid(value: boolean): void {
    this.invalid$.set(value);
  }
}
