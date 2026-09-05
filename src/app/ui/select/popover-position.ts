/* ============================================================================
   Acadimiat UI — تموضع اللوحة العائمة
   ----------------------------------------------------------------------------
   دوالّ خالصة يتقاسمها `<ap-select>` و`<ap-phone-field>`.

   ─── لماذا حساب يدوي لا طبقة CDK ─────────────────────────────────────────
   طبقة CDK وtippy تُلحقان العنصر بـ `body`. وموقع التوثيق يعرض المكوّنات
   داخل مسارح `ViewEncapsulation.ShadowDom`، فالعنصر المُلحَق يخرج من الجذر
   الظلّي ويفقد أنماطه كلّها. اللوحة هنا تبقى في شجرتها، ويأتي رفعها فوق
   الصفحة من سمة `popover` (الطبقة العليا) لا من الإلحاق.

   ─── لماذا استُخرجت ──────────────────────────────────────────────────────
   نسختان من هذا الحساب تتباعدان عند أول إصلاح. وقد رُصد ذلك فعلًا في
   `app-phone-input`: لوحته تستمع لـ `window:scroll` وحده، فتنفصل عن زنّادها
   داخل أي حاوٍ قابل للتمرير (جسم حوار مثلًا) وتطفو في مكانها.

   ⚠️ لا يُستدعى أيٌّ من هذا إلا من تفاعل مستخدم، فلا وصول إليه على الخادم
      — ولذلك لا `isPlatformBrowser` هنا ولا `afterNextRender`.
   ============================================================================ */

export interface ApPopoverPosition {
  placement: 'below' | 'above';
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

/** أدنى ارتفاع تُعرض به اللوحة قبل أن تُقلب إلى الجهة الأخرى. */
const MIN_USABLE_HEIGHT = 160;

/** أقلّ ارتفاع مقبول مهما ضاقت الشاشة — دونه تصير اللوحة غير قابلة للتصفّح. */
const MIN_HEIGHT = 120;

/** هامش عن حافّة النافذة كي لا تلتصق اللوحة بها. */
const VIEWPORT_MARGIN = 16;

/**
 * يحسب موضع اللوحة من مستطيل الزنّاد، ومن اللوحة نفسها متى أمكن قياسها.
 *
 * الارتفاع الأقصى يُقرأ من `--ap-select-menu-max-height` على الزنّاد نفسه:
 * قيمة تصميم تعيش في طبقة الـ tokens، فتُبدَّل بلا إعادة ترجمة.
 *
 * ─── لماذا تُمرَّر اللوحة ─────────────────────────────────────────────────
 * الحساب كان من الزنّاد وحده، فافترض في اللوحة أمرين لا يصدقان إلّا على
 * القائمة المنسدلة الطويلة: أنها تملأ ارتفاعها الأقصى، وأن عرضها عرض زنّادها.
 *
 * `panel` اختياريّ لأن أوّل استدعاء يقع **قبل** `showPopover()`، وعنصر
 * `popover` مغلق لا صندوق له (`display: none`) فقياسه صفر. فيسقط الحساب إلى
 * التقدير في المرور الأوّل ويصحّح نفسه في الثاني — وكلاهما قبل الرسم، فلا
 * يُرى انتقال.
 */
export function computePopoverPosition(
  trigger: HTMLElement,
  panel?: HTMLElement | null,
): ApPopoverPosition {
  const rect = trigger.getBoundingClientRect();
  const max =
    parseFloat(getComputedStyle(trigger).getPropertyValue('--ap-select-menu-max-height')) || 320;

  /*
    ⚠️ `scrollHeight` لا `offsetHeight`: الثاني يُرجع الارتفاع **بعد** قصّه
       بـ `max-height` المكتوب من حسابٍ سابق، فيدور الحساب على نفسه ويحبس
       اللوحة على أضيق قياس مرّ بها. و`scrollHeight` ارتفاع المحتوى مهما كان
       القصّ، فهو ثابت لا يتبع آخر موضع.
  */
  const natural = panel?.scrollHeight ?? 0;
  const measuredWidth = panel?.offsetWidth ?? 0;

  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;

  /*
    تُقلب إلى الأعلى فقط حين لا يتّسع الأسفل **وكان الأعلى أوسع منه**.
    الشرط الثاني ليس تزيّدًا: بدونه تقفز اللوحة إلى الأعلى في نافذة قصيرة
    لتُقصّ هناك أيضًا — فيخسر المستخدم مكانها المتوقّع بلا أن يربح مساحة.

    ⚠️ والمطلوب هو ارتفاع اللوحة الحقيقي مسقوفًا بـ `MIN_USABLE_HEIGHT` لا
       السقف وحده: قائمة أوامر الصفّ سطران (‏~90px)، وقياسها بعتبة 160px كان
       يقلبها إلى الأعلى وتحتها ما يكفيها ويزيد.
  */
  const needed = Math.min(natural > 0 ? natural : max, MIN_USABLE_HEIGHT);
  const openUp = spaceBelow < needed && spaceAbove > spaceBelow;
  const available = (openUp ? spaceAbove : spaceBelow) - VIEWPORT_MARGIN;
  const maxHeight = Math.max(MIN_HEIGHT, Math.min(max, available));

  /*
    ⚠️ الفتح إلى الأعلى يُرفَع بالارتفاع **الفعلي** لا بالأقصى.

    اللوحة تُرسم من أعلاها (`top`)، فالفتح إلى الأعلى يطرح ارتفاعها من قمّة
    الزنّاد. وطرحُ `maxHeight` صحيحٌ للوحة تملأه، وخاطئ لكل ما دونه: قائمة
    الأوامر سطران بارتفاع ~90px، فكانت تُرفَع 320px وتقف معلّقة على بُعد
    ~230px فوق زرّها — تبدو تابعة لصفٍّ آخر أو لا شيء. والعطل لا يظهر إلّا في
    **آخر صفّ** من الجدول، إذ هو وحده ما يضيق تحته الأسفل فيُقلب.
  */
  const height = natural > 0 ? Math.min(natural, maxHeight) : maxHeight;

  /*
    أفقيًا: المحاذاة على الحافّة التي يبدأ منها السطر، لا على `left` دائمًا.

    اللوحة بعرض زنّادها تحاذيه من الطرفين معًا فلا فرق — وهو حال `<ap-select>`
    و`<ap-phone-field>` و`<ap-search-field>`. أمّا الأوسع من زنّادها (قائمة
    الأوامر، ومبدّل الأعمدة) فمحاذاتها يسارًا في RTL تجعلها تنمو بعيدًا عن
    زرّها وتبدو تابعة لشيء آخر. المطلوب أن تنمو نحو داخل الصفحة في الاتجاهين.

    ⚠️ والقصّ عن حافّتي النافذة شرطٌ لا تحسين: زرّ ⋯ في عمود مثبَّت عند نهاية
       الجدول يقف على حافّة الشاشة تقريبًا، ولوحةٌ أوسع منه تخرج عنها بلا هذا.
  */
  const width = measuredWidth || rect.width;
  const rtl = getComputedStyle(trigger).direction === 'rtl';
  const aligned = rtl ? rect.right - width : rect.left;
  const farthest = Math.max(VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN);

  return {
    placement: openUp ? 'above' : 'below',
    top: openUp ? rect.top - height : rect.bottom,
    left: Math.min(Math.max(aligned, VIEWPORT_MARGIN), farthest),
    /* عرض **الزنّاد** لا اللوحة: المستهلك يقرّر أيساويه أم يتّخذه حدًّا أدنى. */
    width: rect.width,
    maxHeight,
  };
}

/**
 * يربط إعادة التموضع مع التمرير وتغيير المقاس، ويعيد دالّة الفكّ.
 *
 * ⚠️ `capture: true` على المستند لا `window:scroll`: الأخير لا يلتقط تمرير
 *    حاوٍ داخلي، فتنفصل اللوحة عن زنّادها. وهذا بالضبط عطل `app-phone-input`
 *    القائم داخل الحوارات.
 *
 * ⚠️ يُربط عند الفتح ويُفكّ عند الإغلاق. الربط الدائم يعني أن كل نسخة من
 *    المكوّن في الصفحة تستمع لكل تمرير — وهو ثمن يتضاعف بلا مقابل.
 */
export function attachViewportSync(onMove: () => void): () => void {
  document.addEventListener('scroll', onMove, true);
  window.addEventListener('resize', onMove);

  return () => {
    document.removeEventListener('scroll', onMove, true);
    window.removeEventListener('resize', onMove);
  };
}
