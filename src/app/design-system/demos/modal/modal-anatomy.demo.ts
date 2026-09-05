import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import {
  ApButtonComponent,
  ApCheckboxDirective,
  ApChoiceComponent,
  ApFieldComponent,
  ApInputDirective,
  ApModalComponent,
  ApSelectComponent,
  ApSelectOption,
} from 'src/app/ui';

/* ============================================================================
   معاينة حيّة — بنية النافذة المنبثقة
   ----------------------------------------------------------------------------
   الثابت هو القالب نفسه — انظر التعليق في `button-variants.demo.ts`.

   هذه المعاينة هي **إعادة بناء لقطة المرجع** بمكوّنات النظام وحدها: القائمة
   والحقل والمبلغ ولوحة الملخّص ومربّع الموافقة وزرّ الفعل. ولا سطر مسافة
   واحد في هذا القالب — كل ما يفصل بين هذه المجموعات آتٍ من
   `--ap-dialog-gap` داخل جسم النافذة.

   افتحها وقس: الحشوة 20px من الجهات الأربع، والفجوات 16px، وأيقونة الإغلاق
   على حافّة الحشوة تمامًا.

   ─── جرّبها بلوحة المفاتيح ─────────────────────────────────────────────────
   التركيز يدخل النافذة ولا يغادرها بـ Tab، وEsc يغلقها، ويعود التركيز إلى
   الزرّ الذي فتحها. لا سطر JS من هذا المكوّن يفعل ذلك — `<dialog>` الأصلي
   مفتوحًا بـ `showModal()` يفعله كلّه.
   ============================================================================ */

export const MODAL_ANATOMY_SOURCE = `
<button apButton size="lg" (click)="open.set(true)">سحب الأرباح</button>

<ap-modal
  heading="سحب الأرباح"
  [open]="open()"
  (openChange)="open.set($event)"
  (closed)="lastReason.set($event)"
>
  <ap-field label="طريقة السحب">
    <ap-select [options]="methods" placeholder="اختر طريقة" />
  </ap-field>

  <ap-field label="المبلغ" hint="أقلّ مبلغ للسحب 200 ر.س.">
    <input apInput type="text" inputmode="decimal" value="1,250.00" />
  </ap-field>

  <ap-field label="رقم الآيبان">
    <input apInput type="text" dir="ltr" value="SA44 2000 0001 2345 6789 1234" readonly />
  </ap-field>

  <div class="summary">
    <p class="summary__title">الملخّص</p>
    <dl class="summary__list">
      <div class="summary__row"><dt>المبلغ المطلوب</dt><dd>1,250.00 ر.س</dd></div>
      <div class="summary__row"><dt>رسوم التحويل</dt><dd>5.00 ر.س</dd></div>
      <div class="summary__row"><dt>مدّة الإيداع</dt><dd>3 أيام عمل</dd></div>
      <div class="summary__row summary__row--total"><dt>الصافي</dt><dd>1,245.00 ر.س</dd></div>
    </dl>
  </div>

  <ap-choice label="أوافق على شروط خدمة السحب" [required]="true">
    <input apCheckbox />
  </ap-choice>

  <button apButton apModalFooter size="lg" [fullWidth]="true" (click)="open.set(false)">
    تأكيد السحب
  </button>
</ap-modal>

@if (lastReason()) {
  <p class="note">أُغلقت آخر مرّة بسبب: {{ lastReason() }}</p>
}
`;

@Component({
  selector: 'demo-modal-anatomy',
  standalone: true,
  imports: [
    ApButtonComponent,
    ApCheckboxDirective,
    ApChoiceComponent,
    ApFieldComponent,
    ApInputDirective,
    ApModalComponent,
    ApSelectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  /*
    ⚠️ لا backtick داخل هذه السلاسل ولا داخل تعليقاتها — لُدغ المشروع بذلك
       مرّتين. الأنماط هنا تخصّ **لوحة الملخّص** وحدها، وهي محتوى مُسقَط في
       النافذة لا جزء منها: النافذة لا تعرف عنها شيئًا، وتصل إليها الفجوة
       من `--ap-dialog-gap` كما تصل إلى أي مجموعة أخرى.
  */
  styles: [
    ':host { display: block; }',
    '.summary { padding: var(--ap-space-4); border-radius: var(--ap-radius-lg);' +
      ' background: var(--ap-color-bg-subtle); }',
    '.summary__title { margin: 0 0 var(--ap-space-3); color: var(--ap-color-text-secondary);' +
      ' font-size: var(--ap-font-size-xs); font-weight: var(--ap-font-weight-medium); }',
    '.summary__list { display: flex; flex-direction: column; gap: var(--ap-space-3); margin: 0; }',
    '.summary__row { display: flex; align-items: baseline; justify-content: space-between;' +
      ' gap: var(--ap-space-4); }',
    '.summary__row dt { color: var(--ap-color-text-secondary); }',
    '.summary__row dd { margin: 0; color: var(--ap-color-text-primary);' +
      ' font-weight: var(--ap-font-weight-medium); }',
    '.summary__row--total dd { color: var(--ap-color-text-brand);' +
      ' font-weight: var(--ap-font-weight-semibold); }',
    '.note { margin: var(--ap-space-3) 0 0; color: var(--ap-color-text-tertiary);' +
      ' font-size: var(--ap-font-size-xs); }',
  ],
  template: MODAL_ANATOMY_SOURCE,
})
export class ModalAnatomyDemo {
  protected readonly open = signal(false);
  protected readonly lastReason = signal('');

  protected readonly methods: ApSelectOption[] = [
    { value: 'bank', label: 'تحويل بنكي' },
    { value: 'wallet', label: 'محفظة إلكترونية' },
    { value: 'cheque', label: 'شيك مصرفي', disabled: true },
  ];
}
