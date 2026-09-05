import { Directive } from '@angular/core';

/* ============================================================================
   Acadimiat UI — لواصق الحقل
   ----------------------------------------------------------------------------
   نصّ ثابت داخل حدّ الحقل: العملة، بادئة الرابط، وحدة القياس.

   ─── لماذا داخل الحدّ لا بجانبه ────────────────────────────────────────────
   اللاصقة جزء من القيمة لا تعليق عليها. «ر.س» ليست شرحًا للحقل بل وحدة الرقم
   المكتوب فيه، و«https://» جزء من الرابط النهائي. وضعها خارج الحدّ يجعلها
   تبدو label ثانيًا، ويكسر إدراك الحقل كصندوق واحد.

   ─── لماذا نصّ ثابت لا قيمة في الحقل ──────────────────────────────────────
   كتابة «https://» داخل قيمة الحقل تعني أن المستخدم قد يحذفها أو يكرّرها،
   وأن التحقّق يجب أن يتعامل مع الحالتين. كنصّ ثابت هي خارج القيمة تمامًا:
   لا تُحذف ولا تُنسخ ولا تصل إلى الخادم مكرّرة.

   ⚠️ اللاصقة `aria-hidden` — قارئ الشاشة يأخذ المعنى من الـ label ومن
      `inputmode`، وإعلانها يضيف ضجيجًا في كل تنقّل داخل النموذج.
   ============================================================================ */

@Directive({
  selector: '[apFieldPrefix]',
  standalone: true,
  host: { class: 'ap-field__affix', 'data-affix': 'prefix', 'aria-hidden': 'true' },
})
export class ApFieldPrefixDirective {}

@Directive({
  selector: '[apFieldSuffix]',
  standalone: true,
  host: { class: 'ap-field__affix', 'data-affix': 'suffix', 'aria-hidden': 'true' },
})
export class ApFieldSuffixDirective {}

/** أيقونة محدَّدة تُعرض بجوار الـ label. */
@Directive({
  selector: '[apFieldLabelIcon]',
  standalone: true,
  host: { class: 'ap-field__label-icon', 'aria-hidden': 'true' },
})
export class ApFieldLabelIconDirective {}
