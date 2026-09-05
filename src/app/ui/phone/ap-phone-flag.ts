import { InjectionToken } from '@angular/core';

/* ============================================================================
   Acadimiat UI — منفذ العلم
   ----------------------------------------------------------------------------
   المكوّن **لا يعرف** كيف يُرسم علم. يطلبه من مصدر يُحقن، فيبقى القرار قابلًا
   للانعكاس بلا لمس المكوّن ولا قالبه.

   ─── لماذا ثغرة لا خريطة مضمَّنة ──────────────────────────────────────────
   الخيارات الثلاثة الواقعية لكلٍّ منها ثمن مختلف تمامًا، ولا واحد منها صحيح
   لكل مشروع:

   • **إيموجي** (🇸🇦): صفر أصول، لكن Windows بلا محارف أعلام — يتحلّل بصمت إلى
     حرفَي ISO بخطّ النظام. أي أنه على منصّة المستخدم الأساسي هنا يساوي
     الافتراضي بمظهر أسوأ وغير محكوم.
   • **مجموعة SVG**: الأدقّ بصريًا، ثمنها ~250 أصلًا يجب تحميلها كسولًا.
   • **بلا علم**: شارة ISO‑2 نصّية. حتمية على كل منصّة وصفر أصول.

   ─── الافتراضي: بلا علم ───────────────────────────────────────────────────
   يعود `null` فيعرض المكوّن شارة «SA». ليست حلًّا وسطًا بل قاعدة صلبة: تعمل
   في كل مكان، وتحمل معلومة حقيقية — رمز الاتّصال وحده غامض (‎+1 و‎+44 مشتركان
   بين عدّة دول)، والرمز يحسم أيّها.

   ⚠️ العلم زخرفة دلاليًا: يُعرض داخل غلاف `aria-hidden`، والمعنى يحمله اسم
      الدولة المخفيّ بصريًا في الزرّ. فغيابه لا يُفقد قارئ الشاشة شيئًا.
   ============================================================================ */

export type ApPhoneFlag =
  | { kind: 'svg'; url: string }
  | { kind: 'emoji'; glyph: string };

/** `iso2` بحروف كبيرة ⇐ وصف العلم، أو `null` لعرض شارة الرمز. */
export type ApPhoneFlagSource = (iso2: string) => ApPhoneFlag | null;

export const AP_PHONE_FLAG_SOURCE = new InjectionToken<ApPhoneFlagSource>(
  'AP_PHONE_FLAG_SOURCE',
  { providedIn: 'root', factory: () => () => null },
);

/**
 * مصدر أعلام من ملفات SVG.
 *
 * الاستخدام — بعد وضع المجموعة في `src/assets/flags/` بأسماء ISO‑2 صغيرة
 * (`sa.svg`، `ae.svg` …):
 *
 *     providers: [provideApPhoneSvgFlags()]
 *
 * ⚠️ الملف الناقص لا يكسر شيئًا: المكوّن يستمع لخطأ التحميل ويعود إلى شارة
 *    الرمز. فمجموعة جزئية تعمل، ولا حاجة إلى 250 ملفًا دفعةً واحدة.
 *
 * ⚠️ ولا يُمرّر العلم قطّ عبر `apIconFlip`: العلم دلالي لا اتجاهي، وقلبه في
 *    RTL يعكس ترتيب ألوانه فيصير علم دولة أخرى أحيانًا.
 */
export function svgFlagSource(basePath = 'assets/flags'): ApPhoneFlagSource {
  const root = basePath.replace(/\/+$/, '');
  return iso2 => ({ kind: 'svg', url: `${root}/${iso2.toLowerCase()}.svg` });
}

export function provideApPhoneSvgFlags(basePath?: string) {
  return { provide: AP_PHONE_FLAG_SOURCE, useValue: svgFlagSource(basePath) };
}

/**
 * مصدر أعلام إيموجي — تحسين تدريجي واعٍ لا افتراض.
 *
 * يبني المحرف من حرفَي ISO عبر Regional Indicator Symbols، فلا خريطة تُكتب.
 * ⚠️ لا يظهر على Windows إطلاقًا. لا تستخدمه إلا إن كان جمهورك غير ويندوزي.
 */
export function emojiFlagSource(): ApPhoneFlagSource {
  return iso2 => {
    if (!/^[A-Za-z]{2}$/.test(iso2)) {
      return null;
    }
    const glyph = [...iso2.toUpperCase()]
      .map(char => String.fromCodePoint(0x1f1e6 + char.charCodeAt(0) - 65))
      .join('');
    return { kind: 'emoji', glyph };
  };
}
