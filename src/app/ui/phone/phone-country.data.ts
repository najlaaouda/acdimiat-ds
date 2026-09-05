import { getCountries, getCountryCallingCode } from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';

/* ============================================================================
   Acadimiat UI — بيانات دول الهاتف
   ----------------------------------------------------------------------------
   القائمة مشتقّة من `libphonenumber-js` لا مكتوبة يدويًا: رموز الاتّصال تتغيّر
   (انفصال دول، رموز جديدة)، وقائمة مكتوبة تتقادم بصمت — بينما المكتبة تتحدّث
   مع تحديث التبعية.

   ⚠️ توأم معروف: `shared/form-controls/phone-country.data.ts` يفعل الشيء نفسه
      لـ `<app-phone-input>` القديم — بأسماء **إنجليزية** في واجهة عربية. لم
      يُدمج بعد لأن ذاك المكوّن يخدم الموقع العام حيث لا وجود لطبقة الـ tokens،
      وترحيله قرار منفصل. عند ترحيله: يُحذف التوأم ويُستورد من هنا.
   ============================================================================ */

export interface ApPhoneCountry {
  iso2: CountryCode;
  /** رمز الاتّصال بلا `+` — «966». */
  dialCode: string;
  /** الاسم العربي — ما يقرؤه المستخدم. */
  name: string;
  /** الاسم الإنجليزي — حقل بحث فقط، لا يُعرض. */
  nameEn: string;
}

/**
 * الدول المتصدّرة للقائمة.
 *
 * ليست تفضيلًا تجاريًا بل توفير خطوات: أغلب مستخدمي المنصّة في الخليج ومصر،
 * وإجبارهم على تمرير 250 دولة للوصول إلى السعودية كلفة تتكرّر في كل نموذج.
 */
export const AP_PHONE_PREFERRED_COUNTRIES: readonly CountryCode[] = [
  'SA',
  'AE',
  'KW',
  'QA',
  'BH',
  'OM',
  'EG',
  'JO',
];

/*
  يُبنى مرّة واحدة ويُخزَّن: `Intl.DisplayNames` ليست رخيصة، والقائمة ثابتة
  طوال عمر الصفحة.
*/
let cache: ApPhoneCountry[] | null = null;

function displayName(iso2: string, locale: string, fallback: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(iso2) ?? fallback;
  } catch {
    /* `Intl.DisplayNames` غير مدعومة في بيئة قديمة — الرمز خير من الفراغ. */
    return fallback;
  }
}

export function getApPhoneCountries(): readonly ApPhoneCountry[] {
  if (cache) {
    return cache;
  }

  const arabic = safeDisplayNames('ar');
  const english = safeDisplayNames('en');

  const list = getCountries().map<ApPhoneCountry>(iso2 => ({
    iso2,
    dialCode: getCountryCallingCode(iso2),
    name: arabic?.of(iso2) ?? displayName(iso2, 'ar', iso2),
    nameEn: english?.of(iso2) ?? iso2,
  }));

  /*
    الترتيب: المفضَّلة بترتيبها المعلَن، ثم الباقي أبجديًا **عربيًا**.
    `localeCompare('ar')` لا المقارنة الافتراضية: الأخيرة ترتّب بترتيب نقاط
    اليونيكود فتضع «الأردن» و«الإمارات» في مواضع لا يتوقّعها قارئ عربي.
  */
  const preferred = AP_PHONE_PREFERRED_COUNTRIES;
  const rank = (iso2: CountryCode) => {
    const at = preferred.indexOf(iso2);
    return at === -1 ? preferred.length : at;
  };

  cache = list.sort(
    (a, b) => rank(a.iso2) - rank(b.iso2) || a.name.localeCompare(b.name, 'ar'),
  );
  return cache;
}

function safeDisplayNames(locale: string): Intl.DisplayNames | null {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' });
  } catch {
    return null;
  }
}

/** يحوّل الأرقام العربية إلى لاتينية كي يطابق البحث ما يكتبه المستخدم. */
export function normalizeDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, char => {
    const code = char.charCodeAt(0);
    const base = code >= 0x06f0 ? 0x06f0 : 0x0660;
    return String(code - base);
  });
}

/**
 * يطابق الاستعلام على الاسم العربي والإنجليزي والرمز ورمز الاتّصال معًا.
 *
 * ⚠️ الأرقام تُطبَّع أولًا: مستخدم لوحة مفاتيح عربية يكتب «٩٦٦» ولن يجد
 *    السعودية بلا هذا التحويل.
 */
export function matchesCountry(country: ApPhoneCountry, query: string): boolean {
  const needle = normalizeDigits(query).trim().toLowerCase().replace(/^\+/, '');
  if (!needle) {
    return true;
  }
  return (
    country.name.toLowerCase().includes(needle)
    || country.nameEn.toLowerCase().includes(needle)
    || country.iso2.toLowerCase().includes(needle)
    || country.dialCode.includes(needle)
  );
}
