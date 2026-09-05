/* ============================================================================
   Acadimiat Design System Docs — استنتاج نوع الـ token
   ----------------------------------------------------------------------------
   النوع يُستنتج من **الاسم** لا من القيمة ولا من تصريح في البيانات.

   لماذا لا من القيمة: القيمة وحدها غامضة. `0` مسافة أم مدّة أم شفافية؟
   `1` ارتفاع سطر أم وزن؟ الاستنتاج من القيمة يعمل حتى يفشل صامتًا.

   لماذا لا بتصريح في البيانات: ازدواجية. صاحب الـ token يسمّيه في CSS،
   ثم يصنّفه ثانيةً في ملف توثيق — ويتباعد الاثنان خلال أسابيع.

   لماذا من الاسم: في نظام tokens ناضج، **الاسم هو العقد**. وهذا يجعل
   المُصيّر أداة lint مجانية: كل token يعجز عن التصنيف يظهر بشارة
   «غير مصنَّف» صارخة في الصفحة — أي أن خللًا في انضباط التسمية يصبح
   مرئيًا لمن يقرأ التوثيق، لا مدفونًا في ملف CSS.

   ⚠️ المطابقة على **مقاطع** الاسم لا على بادئته وحدها. طبقة المكوّنات تضع
      النوع في اللاحقة لا البادئة (`--ap-button-primary-bg` لون،
      `--ap-card-radius` نصف قطر)، فالاكتفاء بالبادئة يفشل في الطبقة الثالثة
      كلها.
   ============================================================================ */

export type TokenType =
  | 'color'
  | 'spacing'
  | 'radius'
  | 'shadow'
  | 'font-family'
  | 'font-size'
  | 'font-weight'
  | 'line-height'
  | 'letter-spacing'
  | 'duration'
  | 'easing'
  | 'size'
  | 'border-width'
  | 'opacity'
  | 'z-index'
  | 'unknown';

/** أسماء السلالم اللونية في الطبقة الأولى — مجموعة مغلقة معرَّفة في _primitives.css. */
const COLOR_SCALES = ['purple', 'slate', 'red', 'teal', 'amber', 'blue', 'white', 'black'];

/**
 * الترتيب مُلزِم: القاعدة الأولى المطابقة تفوز.
 *
 * مثال على أهمّية الترتيب: `--ap-border-width-thin` يطابق `border` (لون)
 * و`width` (مقاس) معًا. وضع `border-width` قبلهما يحسم الأمر.
 */
const RULES: ReadonlyArray<{ type: TokenType; test: (name: string) => boolean }> = [
  { type: 'border-width', test: n => n.includes('border-width') },
  { type: 'font-size', test: n => n.includes('font-size') },
  { type: 'font-weight', test: n => n.includes('font-weight') },
  { type: 'font-family', test: n => n.includes('font-sans') || n.includes('font-mono') },
  { type: 'line-height', test: n => n.includes('leading') },
  { type: 'letter-spacing', test: n => n.includes('tracking') },
  { type: 'duration', test: n => n.includes('duration') },
  { type: 'easing', test: n => n.includes('ease') },
  { type: 'radius', test: n => n.includes('radius') },
  { type: 'shadow', test: n => n.includes('shadow') || n.includes('elevation') },
  { type: 'opacity', test: n => n.includes('opacity') },
  { type: 'z-index', test: n => /(^|-)z-/.test(n) },
  { type: 'spacing', test: n => /(^|-)space(-|$)/.test(n) || n.includes('gap') || n.includes('padding') },

  /*
     اللون قبل المقاس عمدًا: `--ap-switch-track-on` لون، و`--ap-switch-track-width`
     مقاس — الفارق في اللاحقة، ومطابقة اللون أضيق فتُختبر أولًا.
  */
  {
    type: 'color',
    test: n =>
      n.includes('color')
      || /(^|-)(bg|fg)(-|$)/.test(n)
      || /-(bg|fg)-/.test(n)
      || n.includes('chart')
      || n.includes('focus-ring')
      || COLOR_SCALES.some(scale => new RegExp(`-${scale}(-\\d+)?$`).test(n))
      || (n.includes('border') && !n.includes('width')),
  },

  { type: 'size', test: n => n.includes('width') || n.includes('height') || n.includes('size') || n.includes('icon') },
];

/** دالة خالصة — قابلة للاختبار بلا DOM. */
export function inferTokenType(name: string): TokenType {
  const normalized = name.trim().toLowerCase();
  return RULES.find(rule => rule.test(normalized))?.type ?? 'unknown';
}

/**
 * دور اللون: هل يُرسم به النصّ، أم يُرسم النصّ فوقه؟
 *
 * ⚠️ هذا التمييز ليس تجميليًا. قياس التباين له اتجاه، وعكسه يُنتج حكمًا
 *    خاطئًا: الدرجة ‎--ap-purple-50‎ خلفية فاتحة تباينها مع سطح البطاقة
 *    1.08:1، فلو قيست كأنها لون نصّ ظهرت «ساقطة» — وهي لم تُصمَّم نصًّا قطّ.
 *
 *    القياس الصحيح لها هو: كيف يُقرأ النصّ الأساسي **فوقها**.
 */
export type ColorRole = 'foreground' | 'background';

export function inferColorRole(name: string): ColorRole {
  const n = name.toLowerCase();

  /* أدوار نصّية صريحة. `on-primary`/`on-danger` ألوان نصّ فوق تعبئة. */
  if (
    n.includes('text')
    || /-fg(-|$)/.test(n)
    || n.includes('-on-')
    || n.includes('link')
    || n.includes('chart-axis')
  ) {
    return 'foreground';
  }

  return 'background';
}

/** العنوان العربي للمجموعة، بترتيب العرض. */
export const TOKEN_TYPE_ORDER: ReadonlyArray<{ type: TokenType; label: string }> = [
  { type: 'color', label: 'الألوان' },
  { type: 'spacing', label: 'المسافات' },
  { type: 'size', label: 'الأبعاد' },
  { type: 'radius', label: 'أنصاف الأقطار' },
  { type: 'border-width', label: 'عرض الحدّ' },
  { type: 'shadow', label: 'الظلال' },
  { type: 'font-family', label: 'عائلات الخط' },
  { type: 'font-size', label: 'أحجام الخط' },
  { type: 'font-weight', label: 'أوزان الخط' },
  { type: 'line-height', label: 'ارتفاعات الأسطر' },
  { type: 'letter-spacing', label: 'التباعد الحرفي' },
  { type: 'duration', label: 'المدد' },
  { type: 'easing', label: 'منحنيات الحركة' },
  { type: 'opacity', label: 'الشفافية' },
  { type: 'z-index', label: 'الطبقات' },
  { type: 'unknown', label: 'غير مصنَّف' },
];
