/* ============================================================================
   Acadimiat UI — أنواع الحقول
   ----------------------------------------------------------------------------
   كل نوع يضبط ثلاثة أشياء على العنصر الأصلي دفعةً واحدة:

     type        سلوك المتصفّح ولوحة المفاتيح الافتراضية
     inputmode   لوحة المفاتيح على الجوّال — أهمّ من `type` عمليًا
     dir         اتجاه المحتوى، لا اتجاه الحقل

   ─── لماذا `inputmode` وليس `type` وحده ────────────────────────────────────
   `type="number"` يعطي لوحة أرقام لكنه يجلب أسهم الزيادة والنقصان، ويحذف
   الأصفار البادئة، ويتصرّف بغرابة مع الفاصلة العشرية في بعض اللغات. لحقل
   رقمي لا يُراد فيه ذلك، `type="text"` + `inputmode="decimal"` أدقّ.

   ─── لماذا `dir` على المحتوى ───────────────────────────────────────────────
   الحقل ينقلب مع الصفحة، لكن **محتواه** يتبع لغة ما يُكتب فيه. بريد إلكتروني
   أو رابط داخل حقل RTL تقفز نقاطه وشرطاته إلى مواضع خاطئة بصريًا — والقيمة
   المنسوخة تبدو مشوّهة رغم صحّتها.
   ============================================================================ */

export type ApFieldKind =
  | 'text'
  | 'name'
  | 'email'
  | 'number'
  | 'price'
  | 'url'
  | 'website'
  | 'date'
  | 'time';

export interface ApFieldKindConfig {
  type: string;
  inputMode: string | null;
  /** اتجاه محتوى الحقل — لا اتجاه الحقل نفسه. */
  dir: 'rtl' | 'ltr' | null;
  autocomplete: string | null;
  /**
   * هل يُقرأ صفّ الحقل كلّه من اليسار؟
   *
   * يلزم حين توجد لاصقة مع محتوى لاتيني: `https://` ثم الرابط يجب أن
   * يتجاوَرا ويُقرآ متّصلين. لو بقي الصفّ RTL لانفصلت اللاصقة عن النصّ
   * بفجوة وقُرئا معكوسين.
   */
  ltrRow: boolean;
}

export const AP_FIELD_KINDS: Readonly<Record<ApFieldKind, ApFieldKindConfig>> = {
  text: { type: 'text', inputMode: null, dir: null, autocomplete: null, ltrRow: false },

  name: { type: 'text', inputMode: 'text', dir: null, autocomplete: 'name', ltrRow: false },

  email: {
    type: 'email',
    inputMode: 'email',
    dir: 'ltr',
    autocomplete: 'email',
    ltrRow: false,
  },

  /* نصّ لا رقم — انظر تعليق الرأس عن أسهم `type="number"`. */
  number: { type: 'text', inputMode: 'numeric', dir: 'ltr', autocomplete: null, ltrRow: false },

  price: { type: 'text', inputMode: 'decimal', dir: 'ltr', autocomplete: null, ltrRow: true },

  url: { type: 'url', inputMode: 'url', dir: 'ltr', autocomplete: 'url', ltrRow: true },

  website: { type: 'url', inputMode: 'url', dir: 'ltr', autocomplete: 'url', ltrRow: true },

  /*
     التاريخ والوقت أصليان عمدًا: منتقي المتصفّح مترجَم ومتاح بلوحة المفاتيح
     ويعمل مع قارئات الشاشة، وأي بديل مخصّص يعيد بناء ذلك كلّه من الصفر.
     المشروع يملك `app-date-picker` للحالات التي تحتاج نطاقًا أو تقويمًا هجريًا.
  */
  date: { type: 'date', inputMode: null, dir: 'ltr', autocomplete: null, ltrRow: false },

  time: { type: 'time', inputMode: null, dir: 'ltr', autocomplete: null, ltrRow: false },
};
