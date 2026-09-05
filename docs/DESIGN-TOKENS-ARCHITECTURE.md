# Acadimiat — Design Tokens Architecture

> **الحالة:** اقتراح معماري. **لم يُنشأ أي ملف tokens ولم يُعدَّل أي ملف إنتاجي.**
> **مشروط بـ:** اعتماد القرارات في [`DESIGN-DECISION-REPORT.md`](./DESIGN-DECISION-REPORT.md).
> **القراءة أولًا:** [`DESIGN-SYSTEM-AUDIT.md`](./DESIGN-SYSTEM-AUDIT.md)

---

## 1. المبادئ

### 1.1 الطبقات الثلاث

```text
┌─────────────────────────────────────────────────────────┐
│  Primitives      قيم خام، بلا معنى                       │
│  --ap-purple-700: #702ea4                               │
│  --ap-slate-500:  #64748b                               │
│  --ap-space-4:    16px                                  │
└──────────────────────┬──────────────────────────────────┘
                       ↓  (يشير إليها فقط)
┌─────────────────────────────────────────────────────────┐
│  Semantic        معنى داخل الواجهة، بلا مكوّن محدّد        │
│  --ap-color-action-primary:   var(--ap-purple-700)      │
│  --ap-color-text-secondary:   var(--ap-slate-600)       │
│  --ap-color-border-default:   var(--ap-slate-200)       │
└──────────────────────┬──────────────────────────────────┘
                       ↓  (يشير إليها فقط)
┌─────────────────────────────────────────────────────────┐
│  Component       مربوط بمكوّن وحالة                       │
│  --ap-button-primary-bg:      var(--ap-color-action-primary) │
│  --ap-input-border:           var(--ap-color-border-default)  │
│  --ap-input-focus-ring:       var(--ap-color-focus-ring)      │
└─────────────────────────────────────────────────────────┘
```

### 1.2 القواعد الملزِمة

| # | القاعدة |
|---|---|
| R1 | Component token **لا يشير أبدًا** إلى hex أو primitive مباشرةً — بل إلى semantic فقط. |
| R2 | Semantic token **لا يحمل hex** — بل يشير إلى primitive فقط. |
| R3 | لا `hex`/`rgba` خام داخل SCSS المكوّنات — الاستثناء الوحيد: تدرّجات زخرفية موثَّقة. |
| R4 | البادئة `--ap-` لكل شيء (Acadimiat Panel). لا استثناءات. |
| R5 | لا يُبنى شيء فوق متغيّرات Bootstrap (`--bs-*`) — تُعامل كنظام قديم يُهجَر. |
| R6 | Angular Material يُستخدم **للسلوك** (CDK: overlay, a11y, drag-drop) — **لا** لتعريف الهوية البصرية. |
| R7 | Tailwind **مستهلِك** للـ tokens لا مصدرًا لها: `tailwind.config.js` يقرأ من ملف الـ tokens، لا العكس. |
| R8 | كل token له مقاس تباين موثَّق حيث ينطبق. |
| R9 | RTL: خصائص منطقية فقط (`inline-start/end`). لا tokens اتجاهية. |
| R10 | كل primitive جديد يحتاج **دليل استخدام فعلي** — لا يُضاف للاكتمال. |

### 1.3 لماذا CSS Custom Properties لا SCSS variables

- المشروع يحتاج تغييرًا وقت التشغيل (تفضيلات إمكانية الوصول، تكبير الخط، تباين عالٍ، وضع داكن مستقبلًا).
- SCSS variables تُحسم وقت البناء ولا تعبر حدود `::ng-deep` ولا CDK overlay portals.
- الـ overlay portals (dialogs, menus, tooltips) تُصيَّر خارج شجرة المكوّن — الـ custom properties هي الآلية الوحيدة التي تصلها من `:root`.

---

## 2. Primitives

### 2.1 Color — سلالم مشتقّة من ألوان المشروع الفعلية

كل سلّم مثبَّت على **لون موجود فعلًا في الكود** ومحسوب بتباعد إدراكي متساوٍ في فضاء OKLab. أرقام التباين مُقاسة على خلفية بيضاء.

#### `--ap-purple-*` — العلامة (مثبَّت: `#702EA4` = `--p-primary-color`)

| Token | القيمة | تباين/أبيض | الاستخدام المقصود |
|---|---|---|---|
| `--ap-purple-50` | `#f9f4ff` | 1.08 | خلفية بادج/تحديد |
| `--ap-purple-100` | `#f1e6ff` | 1.20 | خلفية hover خفيفة |
| `--ap-purple-200` | `#e5cfff` | 1.43 | حدّ بادج |
| `--ap-purple-300` | `#d5afff` | 1.84 | زخرفي |
| `--ap-purple-400` | `#c283ff` | 2.63 | زخرفي / تدرّجات |
| `--ap-purple-500` | `#a85ee9` | 3.86 | أيقونات على داكن |
| `--ap-purple-600` | `#8c42c9` | 5.62 | hover للتعبئة |
| **`--ap-purple-700`** | **`#702ea4`** | **8.03** | **العلامة الأساسية** — تعبئة الأزرار، السايدبار النشط، الرسوم |
| `--ap-purple-800` | `#582283` | 10.65 | نص على خلفية `-50` |
| `--ap-purple-900` | `#441a66` | 13.25 | نص مؤكَّد |
| `--ap-purple-950` | `#2c1043` | 16.64 | — |

**الألوان التي تُدمَج على هذا السلّم:** `#7635b5` (144) → `-700` · `#6a2cda` (96) → `-700` · `#7c3aed` (48) → `-700` · `#6d28d9` (11) → `-700` · `#8b5cf6` (42) → `-500` أو `-600` حسب الدور · `#a855f7` (11) → `-500` · `#6b21a8` (10) → `-800` · `#2d1443` (12) → `-950`.

#### `--ap-slate-*` — المحايد (مثبَّت: `#0f172a`، السلّم السائد في الحقبة C)

| Token | القيمة | تباين/أبيض | الدور |
|---|---|---|---|
| `--ap-slate-50` | `#f8fafc` | 1.03 | خلفية الصفحة |
| `--ap-slate-100` | `#f1f5f9` | 1.10 | خلفية خافتة / صف hover |
| `--ap-slate-200` | `#e2e8f0` | 1.23 | حدّ فاصل |
| `--ap-slate-300` | `#cbd5e1` | 1.47 | حدّ حقل |
| `--ap-slate-400` | `#94a3b8` | 2.56 | نص معطَّل فقط ⚠️ |
| `--ap-slate-500` | `#64748b` | 4.76 | نص ثالثي (≥14px فقط) |
| `--ap-slate-600` | `#475569` | 7.50 | نص ثانوي |
| `--ap-slate-700` | `#334155` | 10.35 | نص قوي |
| `--ap-slate-800` | `#1e293b` | 14.09 | عناوين |
| **`--ap-slate-900`** | **`#0f172a`** | **17.85** | **النص الأساسي** |
| `--ap-slate-950` | `#020617` | 19.94 | — |

> **قرار:** أبقيتُ سلّم Tailwind `slate` الأصلي كما هو (بدل سلّم مولَّد) لأن **~700 استخدام** في الكود يطابقه حرفيًا — أي أن تبنّيه يعني صفر تغيير بصري في الحقبة C.

**يُدمج عليه:** `gray` كامل (`#111827`→900، `#374151`→700، `#6b7280`→500، `#e5e7eb`→200، `#f3f4f6`→100، `#f9fafb`→50) · الرماديات المطلقة (`#333`→800، `#666`→500/600، `#999`→400، `#ccc`→300، `#eee`→200، `#e0e0e0`→200، `#f5f5f5`→100، `#fafafa`→50) · رماديات Bootstrap (`#212529`→900، `#495057`→600، `#6c757d`→500، `#dee2e6`→200، `#e9ecef`→100، `#f8f9fa`→50) · رماديات القالب (`#3f4358`→700، `#969ba0`→**500** (إصلاح تباين)، `#8c8c8c`→500، `#817a87`/`#7c7583`→500).

#### `--ap-red-*` — الخطر (مثبَّت: `#dc2626`، الأكثر استخدامًا)

| Token | القيمة | تباين/أبيض |
|---|---|---|
| `--ap-red-50` | `#fff4f3` | 1.08 |
| `--ap-red-100` | `#ffe7e4` | 1.18 |
| `--ap-red-200` | `#fed1cb` | 1.38 |
| `--ap-red-300` | `#ffb0a6` | 1.75 |
| `--ap-red-400` | `#fe8477` | 2.39 |
| `--ap-red-500` | `#fc463f` | 3.45 |
| **`--ap-red-600`** | **`#dc2626`** | **4.83** ← تعبئة الأزرار (أبيض عليها يمرّ) |
| **`--ap-red-700`** | **`#b61317`** | **6.79** ← **نص الخطأ** |
| `--ap-red-800` | `#920a0f` | 9.24 |
| `--ap-red-900` | `#72090b` | 11.94 |
| `--ap-red-950` | `#4c0807` | 15.61 |

**يُدمج:** `#dc3545`, `#ef4444`, `#d93636`, `#d32f2f`, `#e74c3c`, `#f44336`, `#c0392b` → `-600` · `#b91c1c`, `#991b1b` → `-800` · **`#ff4c41`** (لون `.btn-danger` العام، 3.30:1 ❌) → `-600`.

#### `--ap-teal-*` — النجاح (مثبَّت: `#0d9488`، الأكثر استخدامًا) — **رهن القرار D-02**

| Token | القيمة | تباين/أبيض |
|---|---|---|
| `--ap-teal-50` | `#edfbf9` | 1.06 |
| `--ap-teal-100` | `#ddf4f0` | 1.15 |
| `--ap-teal-200` | `#bdeae3` | 1.31 |
| `--ap-teal-300` | `#94dad0` | 1.59 |
| `--ap-teal-400` | `#65c5b9` | 2.05 |
| `--ap-teal-500` | `#34ada0` | 2.75 |
| `--ap-teal-600` | `#0d9488` | 3.74 ⚠️ (نص كبير/UI فقط) |
| **`--ap-teal-700`** | **`#02786e`** | **5.36** ← تعبئة الأزرار + نص النجاح |
| `--ap-teal-800` | `#075e56` | 7.65 |
| `--ap-teal-900` | `#024943` | 10.31 |
| `--ap-teal-950` | `#03312c` | 14.19 |

> **ملاحظة حاسمة:** لا يوجد في المشروع **أي أخضر يمرّ 4.5:1 مع نص أبيض** عند درجة 500/600. لذا `--ap-color-action-success` يجب أن تشير إلى **`-700`** لا `-600`. هذا تغيير بصري ملموس (أغمق قليلًا) لكنه شرط للامتثال.

**يُدمج:** `#14b8a6` → `-500` · `#10b981`, `#059669`, `#16a34a`, `#22c55e`, `#28a745` → `-600`/`-700` · `#15803d`, `#065f46` → `-800` · `#68cf29`, `#4f9b21` → **يُحذفان** (تباين كارثي).

#### `--ap-amber-*` — التحذير (مثبَّت: `#f59e0b`)

| Token | القيمة | تباين/أبيض |
|---|---|---|
| `--ap-amber-50` | `#fff8f1` | 1.05 |
| `--ap-amber-100` | `#fff0e0` | 1.12 |
| `--ap-amber-200` | `#ffe3c4` | 1.23 |
| `--ap-amber-300` | `#ffcf99` | 1.43 |
| `--ap-amber-400` | `#ffb65b` | 1.74 |
| `--ap-amber-500` | `#f59e0b` | 2.15 ❌ — **تعبئة فقط مع نص داكن** |
| `--ap-amber-600` | `#cb8209` | 3.12 |
| `--ap-amber-700` | `#a56a0c` | 4.50 ← الحدّ الأدنى للنص |
| `--ap-amber-800` | `#835305` | 6.55 |
| **`--ap-amber-900`** | **`#674001`** | **9.09** ← **نص التحذير** |
| `--ap-amber-950` | `#472a00` | 13.13 |

> **قاعدة إلزامية:** لا يوجد كهرماني يقبل نصًا أبيض. تحذير بتعبئة ممتلئة = **نص داكن (`-900`) على تعبئة `-500`**، أو الأفضل: بادج فاتح (`-50` + نص `-900` = 9.09:1). **يُمنع** `bg: #f59e0b; color: #fff`.

**يُدمج:** `#fbbf24`, `#ffab2d`, `#f4b35b` → `-400` · `#d97706` → `-600` · `#b45309`, `#92400e` → `-800`/`-900` · `#ffc107`, `#ff9800` → `-500`.

#### `--ap-blue-*` — المعلومة (مثبَّت: `#0d6efd`، Bootstrap، 70 استخدامًا)

| Token | القيمة | تباين/أبيض |
|---|---|---|
| `--ap-blue-50` | `#f3f7ff` | 1.07 |
| `--ap-blue-100` | `#e4eeff` | 1.17 |
| `--ap-blue-200` | `#cbdfff` | 1.35 |
| `--ap-blue-300` | `#a8c9fe` | 1.69 |
| `--ap-blue-400` | `#7cadff` | 2.26 |
| `--ap-blue-500` | `#4d8ffd` | 3.15 |
| **`--ap-blue-600`** | **`#0d6efd`** | **4.50** ← الحدّ الأدنى |
| **`--ap-blue-700`** | **`#0558d0`** | **6.34** ← الروابط والنص |
| `--ap-blue-800` | `#0244a7` | 8.80 |
| `--ap-blue-900` | `#003485` | 11.48 |
| `--ap-blue-950` | `#022259` | 15.27 |

**يُدمج:** `#3b82f6`, `#0ea5e9`, `#51a6f5`, `#007eff` (لوحة `native-select`) → `-500`/`-600` · `#2563eb`, `#1d4ed8` → `-700`/`-800`.

#### ثابتان

```css
--ap-white: #ffffff;
--ap-black: #000000;   /* للأوفرلاي فقط، لا للنص */
```

### 2.2 Spacing

```css
--ap-space-0:    0;
--ap-space-0-5:  2px;
--ap-space-1:    4px;
--ap-space-1-5:  6px;
--ap-space-2:    8px;
--ap-space-3:    12px;
--ap-space-4:    16px;
--ap-space-5:    20px;
--ap-space-6:    24px;
--ap-space-8:    32px;
--ap-space-10:   40px;
--ap-space-12:   48px;
--ap-space-16:   64px;
```

> **قرار الوحدة:** `px` لا `rem`. السبب: التطبيق يوفّر تكبير خط عبر `html { font-size }` — لو كانت المسافات بالـ rem لتضخّم التخطيط كله مع الخط وانهار على الشاشات الكثيفة. المسافات تبقى ثابتة، **النصوص وحدها تتجاوب** (§2.3).

### 2.3 Typography

```css
/* العائلة */
--ap-font-sans: 'Readex Pro', system-ui, -apple-system, 'Segoe UI', sans-serif;
--ap-font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;

/* الأحجام — rem كي تتجاوب مع تكبير الخط */
--ap-font-size-2xs:  0.6875rem;  /* 11px */
--ap-font-size-xs:   0.75rem;    /* 12px */
--ap-font-size-sm:   0.8125rem;  /* 13px */
--ap-font-size-md:   0.875rem;   /* 14px  ← الأساس */
--ap-font-size-lg:   1rem;       /* 16px */
--ap-font-size-xl:   1.125rem;   /* 18px */
--ap-font-size-2xl:  1.25rem;    /* 20px */
--ap-font-size-3xl:  1.5rem;     /* 24px */
--ap-font-size-4xl:  1.75rem;    /* 28px */
--ap-font-size-5xl:  2rem;       /* 32px */

/* الأوزان — الأربعة المحمّلة فقط */
--ap-font-weight-regular:  400;
--ap-font-weight-medium:   500;
--ap-font-weight-semibold: 600;
--ap-font-weight-bold:     700;

/* ارتفاعات الأسطر — مضبوطة للعربية */
--ap-leading-none:    1;
--ap-leading-tight:   1.3;   /* عناوين */
--ap-leading-snug:    1.45;  /* واجهة، أزرار، خلايا */
--ap-leading-normal:  1.6;   /* نص جارٍ */
--ap-leading-relaxed: 1.75;  /* فقرات طويلة */

/* التتبّع — صفر إلزامي للعربية */
--ap-tracking-normal: 0;
--ap-tracking-tight: -0.01em;  /* للعناوين اللاتينية الكبيرة فقط */
```

> **🔴 إجراء إلزامي مصاحب:** إما إضافة الوزن 800 إلى رابط Google Fonts، أو **حذف الـ 146 استخدامًا** لأوزان 750/800/850/900. الوضع الحالي (استخدام أوزان غير محمّلة) ينتج faux-bold مشوّهًا، خصوصًا في العربية. **التوصية: الحذف** — أربعة أوزان تكفي هرمًا كاملًا، والوزن الخامس يزيد حجم التحميل بلا مقابل.

**ستايلات النص الدلالية:**

| Style | Size | Weight | Leading | الاستخدام |
|---|---|---|---|---|
| `display` | 5xl (32) | bold | tight | شاشات ترحيب |
| `heading-1` | 4xl (28) | bold | tight | عنوان صفحة رئيسي |
| `heading-2` | 3xl (24) | bold | tight | عنوان صفحة |
| `heading-3` | 2xl (20) | semibold | tight | عنوان قسم / بطاقة |
| `heading-4` | xl (18) | semibold | snug | عنوان فرعي |
| `heading-5` | lg (16) | semibold | snug | عنوان صغير |
| `body-lg` | lg (16) | regular | normal | نص بارز |
| **`body`** | **md (14)** | regular | normal | **النص الأساسي** |
| `body-strong` | md (14) | semibold | normal | تأكيد |
| `body-sm` | sm (13) | regular | snug | نص ثانوي / خلايا |
| `label` | sm (13) | medium | snug | تسميات الحقول |
| `caption` | xs (12) | regular | snug | نص مساعد |
| `micro` | 2xs (11) | medium | none | شارات، عدّادات |
| `button` | md (14) | medium | none | نص الأزرار |
| `input` | md (14) | regular | none | قيمة الحقل |
| `table-header` | xs (12) | semibold | none | رأس الجدول |
| `table-cell` | sm (13) | regular | snug | خلية |

### 2.4 Radius

```css
--ap-radius-none: 0;
--ap-radius-xs:   4px;
--ap-radius-sm:   6px;
--ap-radius-md:   8px;    /* الأشيع (153) */
--ap-radius-lg:   12px;   /* البطاقات */
--ap-radius-xl:   16px;
--ap-radius-2xl:  20px;
--ap-radius-full: 9999px;
```

### 2.5 Elevation

```css
/* لون ظل واحد مشتقّ من slate-900 */
--ap-shadow-color: 15 23 42;   /* #0f172a كأرقام RGB */

--ap-shadow-none: none;
--ap-shadow-xs:   0 1px 2px  rgb(var(--ap-shadow-color) / 0.05);
--ap-shadow-sm:   0 2px 6px  rgb(var(--ap-shadow-color) / 0.06);
--ap-shadow-md:   0 7px 18px rgb(var(--ap-shadow-color) / 0.08);
--ap-shadow-lg:   0 14px 30px rgb(var(--ap-shadow-color) / 0.14);
--ap-shadow-xl:   0 24px 60px rgb(var(--ap-shadow-color) / 0.22);

/* ظل ملوّن — للعناصر النشطة (نمط موجود بـ ~20 استخدامًا) */
--ap-shadow-brand: 0 6px 16px rgb(112 46 164 / 0.28);
```

مشتقّة من القيم الأكثر تكرارًا فعليًا (`0 2px 5px .035` → xs/sm، `0 7px 18px .07` → md، `0 14px 30px .2` → lg، `0 24px 60px .25` → xl).

### 2.6 Z-index

```css
--ap-z-base:      0;
--ap-z-raised:    10;   /* عناصر مرفوعة داخل التدفّق */
--ap-z-sticky:    100;  /* رؤوس جداول لاصقة */
--ap-z-header:    200;  /* الشريط العلوي */
--ap-z-sidebar:   300;
--ap-z-backdrop:  900;
--ap-z-modal:     1000;
--ap-z-popover:   1100; /* قوائم، dropdowns، flyouts */
--ap-z-tooltip:   1200;
--ap-z-toast:     1300;
```

### 2.7 Motion

```css
--ap-duration-instant: 100ms;
--ap-duration-fast:    150ms;
--ap-duration-normal:  200ms;
--ap-duration-slow:    300ms;

--ap-ease-standard:  cubic-bezier(0.2, 0, 0, 1);
--ap-ease-decelerate: cubic-bezier(0, 0, 0, 1);
--ap-ease-accelerate: cubic-bezier(0.3, 0, 1, 1);
```

✅ `prefers-reduced-motion` مطبَّق أصلًا في `styles.scss` — يُحافَظ عليه.

### 2.8 Breakpoints

```css
--ap-bp-sm:  640px;
--ap-bp-md:  768px;
--ap-bp-lg:  1024px;
--ap-bp-xl:  1280px;
--ap-bp-2xl: 1536px;
```

> **قرار:** اعتماد نقاط Tailwind لا Bootstrap 4. السبب: النقاط الحالية 18 قيمة بلا نظام، ونقطة `768px` هي الأكثر استخدامًا (19 مرة) وهي مشتركة بين النظامين. النقاط الأخرى تُهاجر تدريجيًا. → **القرار D-09**

### 2.9 Sizing (أهداف اللمس والأيقونات)

```css
--ap-size-touch-min: 44px;   /* WCAG 2.5.5 AAA / التوصية */
--ap-size-touch-sm:  32px;   /* الحدّ الأدنى المسموح مع تباعد كافٍ */

--ap-icon-xs: 12px;
--ap-icon-sm: 14px;
--ap-icon-md: 16px;
--ap-icon-lg: 20px;
--ap-icon-xl: 24px;

--ap-control-height-sm: 32px;
--ap-control-height-md: 40px;   /* الافتراضي لكل عناصر التحكّم */
--ap-control-height-lg: 48px;
```

---

## 3. Semantic Tokens

```css
/* ═══ الأسطح ═══ */
--ap-color-bg-page:        var(--ap-slate-50);
--ap-color-bg-surface:     var(--ap-white);
--ap-color-bg-subtle:      var(--ap-slate-50);
--ap-color-bg-muted:       var(--ap-slate-100);
--ap-color-bg-hover:       var(--ap-slate-100);
--ap-color-bg-selected:    var(--ap-purple-50);
--ap-color-bg-inverse:     var(--ap-slate-900);
--ap-color-bg-overlay:     rgb(15 23 42 / 0.55);

/* ═══ النص ═══ */
--ap-color-text-primary:   var(--ap-slate-900);   /* 17.85:1 */
--ap-color-text-secondary: var(--ap-slate-600);   /*  7.50:1 */
--ap-color-text-tertiary:  var(--ap-slate-500);   /*  4.76:1 — ≥14px فقط */
--ap-color-text-disabled:  var(--ap-slate-400);   /*  2.56:1 — معطَّل فقط */
--ap-color-text-inverse:   var(--ap-white);
--ap-color-text-link:      var(--ap-blue-700);    /*  6.34:1 */
--ap-color-text-brand:     var(--ap-purple-700);  /*  8.03:1 */

/* ═══ الحدود ═══ */
--ap-color-border-subtle:   var(--ap-slate-200);
--ap-color-border-default:  var(--ap-slate-300);
--ap-color-border-strong:   var(--ap-slate-400);
--ap-color-border-brand:    var(--ap-purple-700);
--ap-color-border-inverse:  var(--ap-slate-700);

/* ═══ الأفعال ═══ */
--ap-color-action-primary:         var(--ap-purple-700);
--ap-color-action-primary-hover:   var(--ap-purple-800);
--ap-color-action-primary-active:  var(--ap-purple-900);
--ap-color-action-primary-subtle:  var(--ap-purple-50);
--ap-color-action-on-primary:      var(--ap-white);

--ap-color-action-secondary:        var(--ap-white);
--ap-color-action-secondary-hover:  var(--ap-slate-50);
--ap-color-action-secondary-border: var(--ap-slate-300);
--ap-color-action-on-secondary:     var(--ap-slate-800);

--ap-color-action-danger:        var(--ap-red-600);
--ap-color-action-danger-hover:  var(--ap-red-700);
--ap-color-action-danger-subtle: var(--ap-red-50);
--ap-color-action-on-danger:     var(--ap-white);

/* ═══ الحالات الدلالية ═══ */
--ap-color-success:        var(--ap-teal-700);    /* 5.36:1 مع أبيض */
--ap-color-success-text:   var(--ap-teal-800);
--ap-color-success-bg:     var(--ap-teal-50);
--ap-color-success-border: var(--ap-teal-200);

--ap-color-error:          var(--ap-red-600);
--ap-color-error-text:     var(--ap-red-700);     /* 6.79:1 */
--ap-color-error-bg:       var(--ap-red-50);
--ap-color-error-border:   var(--ap-red-200);

--ap-color-warning:        var(--ap-amber-500);   /* تعبئة فقط */
--ap-color-warning-text:   var(--ap-amber-900);   /* 9.09:1 */
--ap-color-warning-bg:     var(--ap-amber-50);
--ap-color-warning-border: var(--ap-amber-200);

--ap-color-info:           var(--ap-blue-600);
--ap-color-info-text:      var(--ap-blue-700);
--ap-color-info-bg:        var(--ap-blue-50);
--ap-color-info-border:    var(--ap-blue-200);

/* ═══ التركيز — المفتاح الوحيد لأخطر مشكلة في النظام ═══ */
--ap-color-focus-ring:        var(--ap-purple-700);
--ap-color-focus-ring-danger: var(--ap-red-600);
--ap-focus-ring-width:        3px;
--ap-focus-ring-offset:       2px;
--ap-focus-ring:              0 0 0 var(--ap-focus-ring-width) rgb(112 46 164 / 0.35);

/* ═══ الارتفاع ═══ */
--ap-elevation-flat:    var(--ap-shadow-none);
--ap-elevation-card:    var(--ap-shadow-xs);
--ap-elevation-raised:  var(--ap-shadow-sm);
--ap-elevation-dropdown:var(--ap-shadow-md);
--ap-elevation-drawer:  var(--ap-shadow-lg);
--ap-elevation-modal:   var(--ap-shadow-xl);
```

### 3.1 Data Visualization — طبقة دلالية منفصلة

```css
/* سلسلة قاطعة — مميّزة بالدرجة اللونية لا بالشفافية */
--ap-chart-1: var(--ap-purple-700);  /* #702ea4 */
--ap-chart-2: var(--ap-teal-600);    /* #0d9488 */
--ap-chart-3: var(--ap-amber-500);   /* #f59e0b */
--ap-chart-4: var(--ap-blue-600);    /* #0d6efd */
--ap-chart-5: var(--ap-purple-400);  /* #c283ff */
--ap-chart-6: var(--ap-slate-500);   /* #64748b */

/* اتجاهي */
--ap-chart-positive: var(--ap-teal-700);
--ap-chart-negative: var(--ap-red-600);
--ap-chart-neutral:  var(--ap-slate-400);

/* شبكة ومحاور */
--ap-chart-grid: var(--ap-slate-200);
--ap-chart-axis: var(--ap-slate-500);
```

**قواعد إلزامية:**
1. **يُمنع** تمييز السلاسل بالشفافية وحدها (النمط الحالي في `product-statistics-tab`).
2. الـ legend **ظاهر دائمًا** — أو تسميات مباشرة على الرسم.
3. كل سلسلة تحمل تمييزًا ثانيًا غير اللون (نمط تعبئة، شكل نقطة، تسمية).
4. لا يُترك ApexCharts على لوحته الافتراضية — كل مخطط يمرَّر `colors`.

---

## 4. Component Tokens (نماذج)

```css
/* ═══ Button ═══ */
--ap-button-height-sm:  var(--ap-control-height-sm);
--ap-button-height-md:  var(--ap-control-height-md);
--ap-button-height-lg:  var(--ap-control-height-lg);
--ap-button-padding-x:  var(--ap-space-4);
--ap-button-gap:        var(--ap-space-2);
--ap-button-radius:     var(--ap-radius-md);
--ap-button-font-size:  var(--ap-font-size-md);
--ap-button-font-weight:var(--ap-font-weight-medium);

--ap-button-primary-bg:        var(--ap-color-action-primary);
--ap-button-primary-bg-hover:  var(--ap-color-action-primary-hover);
--ap-button-primary-bg-active: var(--ap-color-action-primary-active);
--ap-button-primary-fg:        var(--ap-color-action-on-primary);
--ap-button-primary-focus-ring:var(--ap-focus-ring);

--ap-button-secondary-bg:      var(--ap-color-action-secondary);
--ap-button-secondary-border:  var(--ap-color-action-secondary-border);
--ap-button-secondary-fg:      var(--ap-color-action-on-secondary);

--ap-button-danger-bg:         var(--ap-color-action-danger);
--ap-button-danger-fg:         var(--ap-color-action-on-danger);

--ap-button-disabled-opacity:  0.5;   /* قيمة واحدة بدل 10 */

/* ═══ Input ═══ */
--ap-input-height:        var(--ap-control-height-md);
--ap-input-padding-x:     var(--ap-space-3);
--ap-input-radius:        var(--ap-radius-md);
--ap-input-font-size:     var(--ap-font-size-md);
--ap-input-bg:            var(--ap-color-bg-surface);
--ap-input-bg-disabled:   var(--ap-color-bg-muted);
--ap-input-border:        var(--ap-color-border-default);
--ap-input-border-hover:  var(--ap-color-border-strong);
--ap-input-border-focus:  var(--ap-color-border-brand);
--ap-input-border-error:  var(--ap-color-error);
--ap-input-focus-ring:    var(--ap-focus-ring);
--ap-input-fg:            var(--ap-color-text-primary);
--ap-input-placeholder:   var(--ap-color-text-tertiary);
--ap-input-label-gap:     var(--ap-space-1-5);
--ap-input-message-gap:   var(--ap-space-1);
--ap-field-gap:           var(--ap-space-4);

/* ═══ Card ═══ */
--ap-card-bg:          var(--ap-color-bg-surface);
--ap-card-border:      var(--ap-color-border-subtle);
--ap-card-radius:      var(--ap-radius-lg);
--ap-card-padding:     var(--ap-space-4);
--ap-card-padding-lg:  var(--ap-space-6);
--ap-card-gap:         var(--ap-space-4);
--ap-card-shadow:      var(--ap-elevation-card);
--ap-card-shadow-hover:var(--ap-elevation-raised);

/* ═══ Table ═══ */
--ap-table-header-bg:      var(--ap-color-bg-subtle);
--ap-table-header-fg:      var(--ap-color-text-secondary);
--ap-table-header-size:    var(--ap-font-size-xs);
--ap-table-header-weight:  var(--ap-font-weight-semibold);
--ap-table-cell-size:      var(--ap-font-size-sm);
--ap-table-cell-padding-y: var(--ap-space-3);
--ap-table-cell-padding-x: var(--ap-space-4);
--ap-table-border:         var(--ap-color-border-subtle);
--ap-table-row-hover:      var(--ap-color-bg-hover);
--ap-table-row-selected:   var(--ap-color-bg-selected);

/* ═══ Sidebar ═══ */
--ap-sidebar-bg:            var(--ap-color-bg-surface);
--ap-sidebar-width:         260px;
--ap-sidebar-width-collapsed:80px;
--ap-sidebar-item-fg:       var(--ap-slate-700);
--ap-sidebar-item-icon:     var(--ap-slate-500);   /* إصلاح #969ba0 */
--ap-sidebar-item-fg-hover: var(--ap-slate-900);
--ap-sidebar-item-bg-hover: var(--ap-color-bg-hover);
--ap-sidebar-item-bg-active:var(--ap-color-action-primary);
--ap-sidebar-item-fg-active:var(--ap-color-text-inverse);

/* ═══ Badge ═══ */
--ap-badge-radius:    var(--ap-radius-full);
--ap-badge-padding:   2px var(--ap-space-2);
--ap-badge-font-size: var(--ap-font-size-2xs);
--ap-badge-font-weight: var(--ap-font-weight-medium);

/* ═══ Dialog ═══ */
--ap-dialog-bg:        var(--ap-color-bg-surface);
--ap-dialog-radius:    var(--ap-radius-xl);
--ap-dialog-padding:   var(--ap-space-6);
--ap-dialog-shadow:    var(--ap-elevation-modal);
--ap-dialog-backdrop:  var(--ap-color-bg-overlay);
--ap-dialog-width-sm:  420px;
--ap-dialog-width-md:  560px;
--ap-dialog-width-lg:  760px;

/* ═══ Tooltip ═══ */
--ap-tooltip-bg:        var(--ap-color-bg-inverse);
--ap-tooltip-fg:        var(--ap-color-text-inverse);
--ap-tooltip-radius:    var(--ap-radius-sm);
--ap-tooltip-padding:   var(--ap-space-1-5) var(--ap-space-2);
--ap-tooltip-font-size: var(--ap-font-size-xs);
```

---

## 5. البنية الملفية المقترحة

```text
src/styles/
├── tokens/
│   ├── _primitives.css     ← الطبقة 1 (:root)
│   ├── _semantic.css       ← الطبقة 2 (:root)
│   ├── _components.css     ← الطبقة 3 (:root)
│   └── index.css           ← يستورد الثلاثة بالترتيب
├── foundations/
│   ├── _reset.css          ← تطبيع محدود (لا يصارع القالب)
│   ├── _typography.css     ← ستايلات النص الدلالية
│   ├── _focus.css          ← 🔴 نظام التركيز العالمي — الملف الأهم
│   └── _rtl.css            ← قواعد منطقية (يستبدل rtl.css تدريجيًا)
└── legacy/
    ├── panel-style.css     ← مجمَّد، يُقلَّص فقط
    ├── bootstrap.css       ← مجمَّد
    └── rtl.css             ← مجمَّد، يُقلَّص مع كل ترحيل
```

**ترتيب التحميل في `angular.json`:**

```text
1. bootstrap.css        (legacy)
2. panel-style.css      (legacy)
3. rtl.css              (legacy)
4. styles/tokens/index.css      ← جديد — يعلو على القديم بالترتيب لا بـ !important
5. styles/foundations/*.css     ← جديد
6. styles.scss                  (يُقلَّص تدريجيًا)
```

**نقطة جوهرية:** لأن الملفات الجديدة تُحمَّل **بعد** القديمة، فإن معظم التعارضات تُحسم بالترتيب وحده — وهذا يسمح بتقليص الـ 406 `!important` تدريجيًا بدل مضاعفتها.

---

## 6. النطاق (Scoping) — الخطوة صفر

بما أنه **لا يوجد أي فصل CSS بين Admin والموقع العام** (§0.5 في وثيقة الـ audit)، فأي token جديد سيتسرّب إلى الموقع.

**الحل المقترح:** إضافة كلاس نطاق على غلاف الـ Admin:

```html
<!-- admin.component.html -->
<div id="main-content" class="ap-admin" role="main">
```

```css
:root         { /* primitives — عامة، عديمة الضرر */ }
.ap-admin     { /* semantic + component tokens — معزولة */ }
```

هذا يجعل كل ما يلي **صفر-مخاطرة على الموقع العام**، ويتيح لاحقًا إضافة `.ap-site` بهويته الخضراء القابلة للتخصيص وبنفس البنية.

**هذه هي المهمّة الأولى المطلقة في خارطة الطريق.** → **القرار D-10**

---

## 7. التكامل مع Tailwind

`tailwind.config.js` يُعاد كتابته ليقرأ من الـ tokens لا ليعرّف قيمًا:

```js
module.exports = {
  prefix: 'tw-',
  theme: {
    extend: {
      colors: {
        'ap-brand':   'var(--ap-color-action-primary)',
        'ap-surface': 'var(--ap-color-bg-surface)',
        'ap-text':    'var(--ap-color-text-primary)',
        'ap-muted':   'var(--ap-color-text-tertiary)',
        'ap-border':  'var(--ap-color-border-default)',
        /* … */
      },
      spacing:      { /* var(--ap-space-*) */ },
      borderRadius: { /* var(--ap-radius-*) */ },
      boxShadow:    { /* var(--ap-shadow-*) */ },
      fontSize:     { /* var(--ap-font-size-*) */ },
      screens:      { sm:'640px', md:'768px', lg:'1024px', xl:'1280px' },
    },
  },
};
```

**نتيجة مباشرة:** الـ 68 قيمة عشوائية الحالية (`tw-text-[13px]`, `tw-border-[#ccc]`, `tw-text-[var(--p-primary-color,#7635b5)]`) تُستبدل بـ `tw-text-ap-sm`, `tw-border-ap-border`, `tw-text-ap-brand`. والأهم: **يختفي تناقض قيمة الاحتياط** `#7635b5` مقابل `#702EA4`.

**التوصية الثانية:** إلغاء الـ `safelist` اليدوي (~90 سطرًا) والاعتماد على JIT scanning — الـ safelist الحالي يوسّع الحزمة بلا داعٍ ويحتاج صيانة يدوية.

---

## 8. الوضع الداكن (Dark Mode)

`darkMode: "class"` مُعلن في `tailwind.config.js` لكن **صفر تنفيذ**.

البنية المقترحة تدعمه **بلا عمل إضافي الآن**: يكفي لاحقًا إضافة بلوك يعيد تعريف الطبقة الدلالية فقط:

```css
.ap-admin[data-theme="dark"] {
  --ap-color-bg-page:      var(--ap-slate-950);
  --ap-color-bg-surface:   var(--ap-slate-900);
  --ap-color-text-primary: var(--ap-slate-50);
  /* … الطبقة الدلالية وحدها — لا primitives ولا component tokens */
}
```

**لا يُبنى الآن** (لا استخدام، ولا طلب) — لكن البنية لا تمنعه، وهذا هو الفرق بين نظام قابل للتوسّع ونظام مغلق.

---

## 9. الحوكمة

| القاعدة | آلية التطبيق |
|---|---|
| لا hex خام في SCSS المكوّنات الجديدة | قاعدة stylelint: `color-no-hex` مع استثناء `styles/tokens/` |
| لا `!important` جديد | قاعدة stylelint: `declaration-no-important` على الملفات الجديدة |
| لا خصائص فيزيائية | قاعدة stylelint: `csstools/use-logical` |
| لا `outline: none` بلا بديل | مراجعة يدوية + قاعدة مخصّصة |
| Component token لا يشير إلى hex | فحص في CI على `_components.css` |
| كل token جديد له استخدام | مراجعة PR |

**قياس التقدّم:** عدد قيم الـ hex الخام داخل `views/admin` — من **448** اليوم إلى **صفر**. رقم واحد قابل للقياس آليًا في كل PR.
