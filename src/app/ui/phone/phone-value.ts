import { AsYouType, getExampleNumber, parsePhoneNumberFromString } from 'libphonenumber-js';
import EXAMPLES from 'libphonenumber-js/examples.mobile.json';
import type { CountryCode } from 'libphonenumber-js';

/* ============================================================================
   Acadimiat UI — عقد قيمة الهاتف
   ----------------------------------------------------------------------------
   دوالّ خالصة، بلا DOM ولا Angular — قابلة للاختبار وحدها.

   ─── القيمة E.164 نصًّا ───────────────────────────────────────────────────
   «‎+966512345678‎» أو `null`. لا `{country, national}`: ذلك يفرض على كل نموذج
   تفكيكًا قبل الإرسال، بينما E.164 يحمل الدولة داخله أصلًا. وهو عقد
   `<app-phone-input>` القائم نفسه، فترحيل الشاشات لاحقًا لا يمسّ أي نموذج
   ولا الخادم.
   ============================================================================ */

export interface ApPhoneParts {
  country: CountryCode;
  /** الجزء الوطني بأرقام لاتينية بلا فواصل. */
  national: string;
}

/** يجرّد كل ما ليس رقمًا — اللصق يأتي بمسافات وشرطات وأقواس. */
export function digitsOnly(value: string): string {
  return (value ?? '').replace(/\D/g, '');
}

/** يجمّع E.164 من الدولة والجزء الوطني. فارغ ⇐ `null` لا نصّ فيه رمز الدولة. */
export function toE164(country: CountryCode, national: string, dialCode: string): string | null {
  const digits = digitsOnly(national);
  return digits ? `+${dialCode}${digits}` : null;
}

/**
 * يفكّك قيمة واردة إلى دولة وجزء وطني.
 *
 * ⚠️ يُستدعى من `writeValue` ومن اللصق معًا — وهذا مقصود: المصدران يقدّمان
 *    النصّ نفسه، والتفريق بينهما كان سينتج قاعدتين تتباعدان.
 */
export function parseE164(value: string | null | undefined): ApPhoneParts | null {
  if (!value) {
    return null;
  }
  const parsed = parsePhoneNumberFromString(String(value).trim());
  if (!parsed?.country) {
    return null;
  }
  return { country: parsed.country, national: parsed.nationalNumber };
}

/**
 * قاعدة اللصق: **الرقم يملك الحقيقة لا المحدِّد**.
 *
 * من يلصق ‎+9715…‎ والمحدِّد على السعودية يقصد الإمارات — لصق رقمًا يعرفه،
 * والمحدِّد مجرّد افتراض سابق. فينقلب المحدِّد إليه بلا سؤال.
 *
 * ⚠️ `00` تُعامَل معاملة `+`: البادئة الدولية المتعارفة في المنطقة، وتجريدها
 *    كرقم عادي كان يبتلع رمز الدولة داخل الجزء الوطني بصمت — وهو عطل قائم في
 *    `<app-phone-input>` اليوم.
 */
export function interpretInput(raw: string): ApPhoneParts | null {
  const trimmed = (raw ?? '').trim();
  if (!/^(\+|00)/.test(trimmed)) {
    return null;
  }
  const normalized = trimmed.startsWith('00') ? `+${trimmed.slice(2)}` : trimmed;
  return parseE164(normalized);
}

/** هل القيمة رقم صالح لدولتها؟ يُستهلك في الـ validator. */
export function isValidPhone(value: string | null): boolean {
  if (!value) {
    return false;
  }
  return parsePhoneNumberFromString(value)?.isValid() ?? false;
}

/**
 * تنسيق العرض عند مغادرة الحقل — لا أثناء الكتابة.
 *
 * إعادة كتابة قيمة الحقل تحت المؤشّر أثناء الكتابة تحرّكه، وإدارة مواضعه مع
 * `AsYouType` كلفة صيانة دائمة مقابل كسب تجميلي. عند blur لا مؤشّر يُزاح.
 *
 * ⚠️ العائد للعرض وحده؛ القيمة المبثوثة تبقى E.164 بلا فواصل.
 */
export function formatNational(country: CountryCode, national: string): string {
  const digits = digitsOnly(national);
  if (!digits) {
    return '';
  }
  const parsed = parsePhoneNumberFromString(digits, country);
  /* الرقم غير الصالح يُترك كما كتبه المستخدم: تنسيقه يوهم بصحّته، والرسالة
     تحت الحقل هي ما يقول إنه ناقص. */
  return parsed?.isValid() ? parsed.formatNational() : digits;
}

/**
 * يستخرج **الجزء الوطني** من نصّ الحقل بإسقاط بادئة الاتّصال الوطنية.
 *
 * ⚠️ هذا تصحيح عطل لا تحسين. المسار القديم كان `digitsOnly(raw)` مباشرةً،
 *    وهو صحيح ما دام المستخدم يكتب — ويكسر بعد أوّل `blur`: التنسيق يعيد كتابة
 *    الحقل «‎051 234 5678‎» بالصفر الوطني، فأيّ تعديل بعدها يبتلع الصفر داخل
 *    الجزء الوطني وتصير القيمة `+96605123456789` — غير صالحة، بلا أي رسالة،
 *    لأن الحقل يبدو مطابقًا لما عُرض فيه.
 *
 * `AsYouType` تُسقط البادئة على المدخل الجزئي أيضًا («05» ⇐ «5»)، فتعمل أثناء
 * الكتابة لا بعد اكتمال الرقم وحده.
 */
export function toNationalDigits(country: CountryCode, raw: string): string {
  const digits = digitsOnly(raw);
  if (!digits) {
    return '';
  }
  const formatter = new AsYouType(country);
  formatter.input(digits);
  return formatter.getNationalNumber() || digits;
}

/**
 * نائب الحقل مشتقًّا من **رقم مثال حقيقي** لكل دولة، مقنَّعًا.
 *
 * النائب الثابت «‎5X XXX XXXX‎» شكلُ الجوّال السعودي وحده: يقف فوق حقل على
 * بريطانيا فيعِد بعشرة أرقام تبدأ بـ 5، والرقم البريطاني أحد عشر يبدأ بـ 07 —
 * فيُقرأ الرفض خطأً في الرقم لا في النائب.
 *
 * والتقنيع شرط لا زينة: عرض المثال كما هو (‎051 234 5678‎) يُنسَخ ويُرسَل رقمًا
 * حقيقيًا لشخص آخر. ويُبقى على الصفر الوطني وأوّل رقم دالّ — الصفر لأن التنسيق
 * بعد `blur` يعرضه فعلًا، والرقم الدالّ لأنه المعلومة («السعودي يبدأ بـ 5»).
 */
export function examplePlaceholder(country: CountryCode): string {
  const example = getExampleNumber(country, EXAMPLES);
  if (!example) {
    return '';
  }
  let keptSignificant = false;
  return example.formatNational().replace(/\d/g, digit => {
    /* الأصفار الصدارية بادئة وطنية لا رقمًا دالًّا — تُكتب كما هي. */
    if (!keptSignificant && digit === '0') {
      return digit;
    }
    if (!keptSignificant) {
      keptSignificant = true;
      return digit;
    }
    return 'X';
  });
}
