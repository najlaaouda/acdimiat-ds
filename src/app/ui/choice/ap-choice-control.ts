import { ApFieldControl } from '../field/ap-field-control';

/* ============================================================================
   Acadimiat UI — عقد عنصر الاختيار
   ----------------------------------------------------------------------------
   يرث منطق الربط من `ApFieldControl` (المعرّف، الوصف، الإلزام، البطلان)
   ويضيف إليه شيئًا واحدًا: أي شكل يرسمه الحاوي حوله.

   ─── لماذا الشكل يُعلَن هنا لا يُمرَّر مدخلًا على الحاوي ────────────────────
   لو كتب المؤلّف `<ap-choice appearance="switch">` ثم أسقط فيه
   `<input apCheckbox>`، لظهر مفتاح يتصرّف كمربّع اختيار. المصدر هنا واحد:
   الموجّه الموضوع على العنصر هو من يقرّر الشكل، فلا تركيبة متناقضة ممكنة.

   ⛔ رمز حقن مستقلّ عن `ApFieldControl` عمدًا: `<ap-field>` يبحث عن الأول،
      و`<ap-choice>` عن الثاني. فوضع `<input apCheckbox>` داخل `<ap-field>`
      لا يُربط — وهو الصواب: بنية الحقل النصّي (label فوق، حقل تحته) لا
      تناسب مربّع اختيار.
   ============================================================================ */

export type ApChoiceAppearance = 'checkbox' | 'radio' | 'switch';

export abstract class ApChoiceControl extends ApFieldControl {
  abstract readonly appearance: ApChoiceAppearance;
}
