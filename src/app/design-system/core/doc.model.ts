/* ============================================================================
   Acadimiat Design System Docs — العقد (Contract)
   ----------------------------------------------------------------------------
   هذا الملف هو *العقد* بين المحتوى والعرض. لا يعرف شيئًا عن Angular ولا عن
   أي مكوّن — أنواع خالصة فقط.

   القاعدة الحاكمة:
     المحتوى بيانات · العرض مكوّن واحد عام · التنقّل مشتقّ.

   أي صفحة توثيق جديدة = كائن `DocEntry` واحد يُسجَّل في السجلّ. لا مسار
   جديد، ولا مكوّن جديد، ولا سطر في قائمة التنقّل. الصفحة والتنقّل والفهرس
   كلها تُشتقّ من هذا الكائن.

   التوثيق المرجعي:
     docs/design-system/DESIGN-TOKENS-ARCHITECTURE.md
     docs/design-system/COMPONENT-INVENTORY.md
   ============================================================================ */

/* ---------------------------------------------------------------------------
   1) التصنيف الأعلى — يحدّد بنية الـ URL والتنقّل معًا
   /design-system/<category>/<slug>
   --------------------------------------------------------------------------- */
export type DocCategoryId =
  | 'foundations'
  | 'components'
  | 'patterns'
  | 'content'
  | 'accessibility'
  | 'changelog';

/* ---------------------------------------------------------------------------
   2) حالة نضج الصفحة

   `not-standardized` ليست حالة تجميلية: وثيقة الجرد رصدت 58 نمطًا منها 8
   فقط لها تنفيذ واحد متماسك. توثيق الواقع كما هو — بدل اختراع مواصفة غير
   معتمدة — هو ما يجعل هذا الموقع مرجعًا صادقًا لا قائمة أمنيات.
   --------------------------------------------------------------------------- */
export type DocStatus =
  /** موحّد ومعتمد — يُستخدم كما هو موثَّق. */
  | 'stable'
  /** التوثيق يصف الحالة المستهدفة، والترحيل جارٍ. */
  | 'in-progress'
  /** موجود في المشروع بتنفيذات متعدّدة — لا مواصفة معتمدة بعد. */
  | 'not-standardized'
  /** مخطَّط له ولم يُبنَ. لا يُوثَّق كأنه موجود. */
  | 'planned';

/* ---------------------------------------------------------------------------
   3) أقسام الصفحة — اتّحاد مُميَّز (discriminated union)

   كل `kind` يقابله مُصيّر (renderer) واحد. إضافة نوع قسم مستقبلًا =
   إضافة عضو هنا + فرع في المُصيّر. لا يمسّ ذلك أي صفحة قائمة.

   ⚠️ الأنواع المعلَّمة بـ [P2] معرَّفة في العقد لكن مُصيّرها يُبنى في
      المرحلة 2 (Documentation Infrastructure). تعريفها الآن متعمّد: العقد
      يسبق التنفيذ كي لا تُعاد كتابة المحتوى لاحقًا.
   --------------------------------------------------------------------------- */
export type DocSection =
  | DocProseSection
  | DocListSection
  | DocTableSection
  | DocCalloutSection
  | DocDoDontSection
  | DocAnatomySection      // [P2]
  | DocTokensSection       // [P2]
  | DocDemoSection         // [P2]
  | DocStateMatrixSection; // [P2]

/** فقرات نصّية. كل عنصر في `body` فقرة مستقلّة. */
export interface DocProseSection {
  kind: 'prose';
  title?: string;
  body: string[];
}

/** قائمة نقطية أو مرقّمة. */
export interface DocListSection {
  kind: 'list';
  title?: string;
  ordered?: boolean;
  items: string[];
}

/** جدول بيانات. `rows[i].length` يجب أن يساوي `headers.length`. */
export interface DocTableSection {
  kind: 'table';
  title?: string;
  headers: string[];
  rows: string[][];
  /** نصّ أسفل الجدول — مصدر الرقم أو تحفّظ عليه. */
  caption?: string;
}

/** صندوق تنبيه دلالي. النبرة تُترجم إلى tokens الحالة، لا إلى ألوان خام. */
export interface DocCalloutSection {
  kind: 'callout';
  tone: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  body: string[];
}

/** إرشادات الاستخدام. العمودان متجاوران، وكلاهما إلزامي. */
export interface DocDoDontSection {
  kind: 'do-dont';
  title?: string;
  do: string[];
  dont: string[];
}

/** تشريح المكوّن — أجزاؤه مرقّمة. [P2] */
export interface DocAnatomySection {
  kind: 'anatomy';
  title?: string;
  parts: DocAnatomyPart[];
}

export interface DocAnatomyPart {
  name: string;
  description: string;
  /** هل الجزء إلزامي في كل استخدام؟ */
  required: boolean;
}

/** جدول الـ tokens المرتبطة بالمكوّن. [P2] */
export interface DocTokensSection {
  kind: 'tokens';
  title?: string;
  /** أسماء custom properties بلا `var()` — مثال: `--ap-button-primary-bg`. */
  tokens: string[];
}

/** معاينة حيّة لمكوّن Angular. [P2] */
export interface DocDemoSection {
  kind: 'demo';
  title?: string;
  description?: string;
  demo: DocDemoRef;
}

/**
 * الجسر بين البيانات والمكوّن الحيّ.
 *
 * `load` استيراد كسول: يبقى المحتوى بيانات خالصة، ويبقى العرض Angular
 * حقيقيًا. لا نسخ HTML ولا لقطات شاشة.
 */
export interface DocDemoRef {
  id: string;
  /** يُستدعى في المتصفّح فقط — لا أثر على SSR. */
  load: () => Promise<unknown>;
  /** الشيفرة المعروضة تحت المعاينة. */
  source?: string;
}

/** مصفوفة الحالات: variants × states. [P2] */
export interface DocStateMatrixSection {
  kind: 'matrix';
  title?: string;
  description?: string;
  variants: DocMatrixAxis[];
  states: DocMatrixAxis[];
  demo: DocDemoRef;
  /**
   * أدنى عرض للعمود (طول CSS). الافتراضي يكفي زرًّا؛ المكوّنات الأعرض —
   * الحقل مثلًا، ومعه label ورسالة — تحتاج أكثر وإلّا انسحق المحتوى.
   *
   * الشبكة تُمرَّر أفقيًا عند التجاوز، والتمرير أصدق من السحق: المصفوفة
   * المسحوقة تعرض المكوّن بعرض لا يستخدمه أحد فعلًا.
   */
  columnMin?: string;
}

export interface DocMatrixAxis {
  id: string;
  label: string;
  /** المدخلات التي تُمرَّر للمكوّن لتحقيق هذا المحور. */
  inputs?: Record<string, unknown>;
}

/* ---------------------------------------------------------------------------
   4) الصفحة
   --------------------------------------------------------------------------- */
export interface DocEntry {
  /** الجزء الأخير من المسار. حروف صغيرة وشرطات فقط. */
  slug: string;
  category: DocCategoryId;
  /**
   * معرّف المجموعة داخل التصنيف — للتنقّل فقط، لا يظهر في الـ URL.
   * تُعرَّف المجموعات في `DOCS_NAV_SECTIONS`.
   */
  group?: string;
  /** العنوان العربي — يظهر في التنقّل وفي رأس الصفحة. */
  title: string;
  /** المقابل اللاتيني — للبحث ولأسماء المكوّنات. اختياري. */
  titleEn?: string;
  /** سطر واحد. يظهر تحت العنوان وفي بطاقات الفهرس. */
  summary: string;
  status: DocStatus;
  sections: DocSection[];
  /** كلمات يبحث بها المستخدم ولا ترد في العنوان. */
  keywords?: string[];
}

/* ---------------------------------------------------------------------------
   5) تكوين التنقّل

   هذا هو *التكوين الوحيد* للتنقّل في الموقع كلّه. لا قائمة مكرّرة داخل أي
   مكوّن. الشريط الجانبي والصفحة الرئيسية وصفحات الفهرس تقرأ من هنا حصرًا.
   --------------------------------------------------------------------------- */
export interface DocNavSection {
  id: DocCategoryId;
  title: string;
  /** يظهر في بطاقة التصنيف على الصفحة الرئيسية. */
  description: string;
  /** رمز توضيحي — محايد، غير معتمد عليه لنقل معنى. */
  icon: string;
  /**
   * مجموعات فرعية داخل التصنيف. فارغة = عرض مسطّح.
   * الترتيب هنا هو ترتيب العرض.
   */
  groups?: DocNavGroup[];
}

export interface DocNavGroup {
  id: string;
  title: string;
}

/* ---------------------------------------------------------------------------
   6) شكل التنقّل المُشتقّ — ما يستهلكه الشريط الجانبي فعليًا
   --------------------------------------------------------------------------- */
export interface DocNavTree {
  section: DocNavSection;
  /** مدخلات بلا مجموعة — تُعرض قبل المجموعات. */
  looseEntries: DocNavLink[];
  groups: DocNavTreeGroup[];
  /** إجمالي المدخلات المنشورة في هذا التصنيف. */
  count: number;
}

export interface DocNavTreeGroup {
  group: DocNavGroup;
  entries: DocNavLink[];
}

export interface DocNavLink {
  slug: string;
  title: string;
  status: DocStatus;
  /** المسار الكامل الجاهز لـ routerLink. */
  path: string[];
}
