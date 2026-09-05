import { Directive, DoCheck, ElementRef, forwardRef, signal } from '@angular/core';

import { ApChoiceControl } from './ap-choice-control';

/* ============================================================================
   Acadimiat UI — المفتاح
   ----------------------------------------------------------------------------
   موجّه على `<input type="checkbox">` أصلي، بدور `switch`.

   ─── متى مفتاح ومتى مربّع اختيار ───────────────────────────────────────────
   المفتاح يُنفَّذ فورًا: تحريكه هو الفعل نفسه («تفعيل الإشعارات»)، بلا زرّ
   حفظ بعده. ومربّع الاختيار يعبّر عن نيّة تُحفظ لاحقًا مع بقية النموذج
   («أوافق على الشروط»).

   الخلط بينهما يكذب على المستخدم: مفتاح داخل نموذج بزرّ حفظ يوحي بأن الأثر
   وقع، ثم يخرج المستخدم بلا حفظ فيضيع تبديله.

   ─── لماذا `role="switch"` لا checkbox ─────────────────────────────────────
   قارئ الشاشة يعلن «مفتاح، مشتعل» بدل «مربّع اختيار، محدَّد». الفارق ليس
   لفظيًا: «مشتعل/مطفأ» يصف حالة قائمة الآن، و«محدَّد» يصف اختيارًا سيُرسل.

   ⚠️ `aria-checked` مضبوط هنا صراحةً لأن `role` يستبدل الدور الأصلي، فلا
      يعود المتصفّح يشتقّ الحالة من `checked` وحدها.

   ─── إمكانية الوصول ────────────────────────────────────────────────────────
   حالة المفتاح لا تُنقل باللون وحده: موضع الإبهام تمييز شكلي كافٍ يُقرأ في
   وضع التباين العالي وفي طباعة أحادية اللون، ومعه `aria-checked` لقارئ
   الشاشة. التنفيذات الأربعة القائمة في المشروع تعتمد على اللون وحده.
   ============================================================================ */

@Directive({
  selector: 'input[apSwitch]',
  standalone: true,
  providers: [{ provide: ApChoiceControl, useExisting: forwardRef(() => ApSwitchDirective) }],
  host: {
    type: 'checkbox',
    role: 'switch',
    class: 'ap-choice__native',
    '[attr.aria-checked]': 'checkedValue() ? "true" : "false"',
    '[attr.data-invalid]': 'invalidValue() ? "true" : null',
    '(change)': 'syncChecked()',
  },
})
export class ApSwitchDirective extends ApChoiceControl implements DoCheck {
  readonly appearance = 'switch' as const;

  private readonly invalid$ = signal(false);
  private readonly checked$ = signal(false);

  protected readonly invalidValue = this.invalid$.asReadonly();
  protected readonly checkedValue = this.checked$.asReadonly();

  setInvalid(value: boolean): void {
    this.invalid$.set(value);
  }

  /**
   * يزامن `aria-checked` مع الحالة الحقيقية للعنصر.
   *
   * `ngDoCheck` لا `ngOnInit` وحده: الحالة قد تأتي من سمة ساكنة، أو من
   * ربط `[checked]`، أو من كود يضبط الخاصية مباشرةً — والقراءة في كل دورة
   * كشف تغطّي الثلاثة بسطر واحد بدل مزامنة لكل مصدر.
   *
   * ومستمع `change` ليس تكرارًا: هو ما يُعلم Angular بأن هناك ما تغيّر بعد
   * نقرة المستخدم، وبدونه لا تعمل دورة الكشف أصلًا في مضيف OnPush.
   */
  ngDoCheck(): void {
    this.syncChecked();
  }

  protected syncChecked(): void {
    const el = (this.element as ElementRef<HTMLInputElement>).nativeElement;
    this.checked$.set(!!el.checked);
  }
}
