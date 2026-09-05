# Acadimiat — Component Inventory

> **الحالة:** جرد وتحليل فقط. لم يُعدَّل أي ملف إنتاجي.
> **النطاق:** Admin Dashboard UI.
> **القراءة أولًا:** [`DESIGN-SYSTEM-AUDIT.md`](./DESIGN-SYSTEM-AUDIT.md)

---

## 0. كيف تُقرأ هذه الوثيقة

كل مكوّن مصنَّف بأحد الأوضاع التالية:

| الرمز | المعنى |
|---|---|
| 🟢 **موجود ومتماسك** | تنفيذ واحد، أو تنفيذات متقاربة، يصلح أساسًا |
| 🟡 **موجود ومشتّت** | تنفيذات متعدّدة لنفس الوظيفة — يحتاج توحيدًا |
| 🔴 **موجود ومكسور** | يعمل لكنه يخالف معيارًا (تركيز، تباين، دلالة) |
| ⚪ **غير موجود** | يُبنى فقط إذا ثبتت الحاجة — لا يُبنى للاكتمال |

**عدّ الاستخدامات** مأخوذ من `grep` على قوالب `views/admin` ما لم يُذكر غير ذلك.

---

## 1. الملخّص العددي

| الفئة | مكوّنات موجودة | 🟢 | 🟡 | 🔴 | ⚪ |
|---|---|---|---|---|---|
| Actions | 6 | 1 | 3 | 2 | 3 |
| Forms | 11 | 2 | 5 | 4 | 3 |
| Navigation | 8 | 2 | 5 | 1 | 0 |
| Data Display | 12 | 2 | 7 | 3 | 2 |
| Feedback | 7 | 1 | 3 | 3 | 4 |
| Layout | 5 | 0 | 4 | 1 | 1 |
| Domain-specific | 9 | — | — | — | — |
| **الإجمالي** | **58 نمطًا** | **8** | **27** | **14** | **13** |

**الرقم الأهم:** 58 نمط UI متكرّر، منها **8 فقط** لها تنفيذ واحد متماسك. أي **86 % من واجهة الـ Admin بلا مصدر واحد للحقيقة**.

---

## 2. Actions

### 2.1 Button — 🔴 خمسة أنظمة متوازية

#### التنفيذ الحالي

| النظام | التعريف | استخدامات في Admin | المصدر |
|---|---|---|---|
| **Bootstrap `.btn`** | `panel-style.css:3416` + `bootstrap.css` | **970** (`.btn`) — منها `btn-dark` 142، `btn-primary` 121، `btn-danger` 111، `btn-secondary` 82، `btn-light` 51، `btn-success` 19، `btn-xs` 222، `btn-sm` 55، `btn-lg` 3 | قالب مشترى |
| **`.p-btn-*`** | `panel-style.css:6632–6684` | **309** — `p-btn-primary` 175، `p-btn-outline-primary` 55، `p-btn-secondary` 48، `p-btn-rounded` 23، `p-btn-outline-secondary` 5، `p-btn-rounded-sm` 3 | داخلي |
| **Angular Material** | `MatButtonModule` | 11 (`mat-icon-button` فقط) | مكتبة |
| **`<app-button>`** | `shared/ui/button` | **3** عبر المشروع كله (كلها خارج Admin) | داخلي |
| **كلاسات محلية** | SCSS لكل مكوّن | **~40 عائلة**: `icon-btn` 33، `oc-icon-btn` 9، `ab-icon-btn` 8، `btn--primary` 7، `tbl-btn` 5، `rt-icon-btn` 5، `ac-btn` 5، `pv-icon-btn` 4، `aut-icon-btn` 4، `as-icon-btn` 3، `mqd-icon-btn` 2… | مرتجل |

**`<button>` خامٌّ في Admin: 1283.** أي أن الأزرار تُكتب يدويًا كل مرة.

**التكرار الحقيقي:** الشكل نفسه (زر أيقونة مربّع بحدّ رفيع ونصف قطر) أُعيد كتابته **12 مرة** بأسماء مختلفة (`icon-btn`, `oc-icon-btn`, `ab-icon-btn`, `rt-icon-btn`, `pv-icon-btn`, `aut-icon-btn`, `as-icon-btn`, `mqd-icon-btn`, `sd-btn`, `copy-icon-btn`, `picker-btn`, `nav-btn`).

#### التشريح (Anatomy) — كما هو مرصود

```text
Button
├── Container  (button / a)
├── Leading icon   ← <i class="fa fa-*"> + mr-1/mr-2  (النمط الأشيع)
├── Label
└── Trailing icon  ← نادر
```

لا يوجد slot للـ loading spinner. الأزرار التي تُظهر تحميلًا تفعله بـ `*ngIf` يبدّل المحتوى كله.

#### الخصائص البصرية

| الخاصية | `.btn` (Bootstrap) | `.p-btn-primary` | `<app-button>` |
|---|---|---|---|
| Padding | `0.6rem 0.9rem` (< 1400px: `0.625rem 1rem`) | يرث `.btn` | `0.5rem 1rem` |
| Height الفعّال | **~40px** | ~40px | **min-height 44px** |
| Border radius | `0.3rem` (4.8px) | يرث | `0.375rem` (6px) |
| Font size | `0.875rem` (< 1400px: `0.813rem`) | يرث | `0.875rem` |
| Font weight | `500` | يرث | `500` |
| Border | من Bootstrap | لا شيء | `1px solid transparent` |
| Shadow | `none` | `none` | `none` |
| Gap أيقونة/نص | لا شيء (يُدار بـ `mr-*`) | — | `0.375rem` |

#### الـ Variants الفعلية

```text
Bootstrap:  primary(أسود!) · secondary · danger · success · warning · info · light · dark
            + outline-*  + .light.btn-*  (نسخة فاتحة)
p-btn:      primary · secondary · outline-primary · outline-secondary  (+ .p-light)
app-button: primary · secondary · ghost · danger · success  (+ filled)
```

**🔴 المشكلة الأولى:** `.btn-primary` مُعاد تعريفه في `panel-style.css` إلى **`#000` أسود**، و**`:hover` أيضًا `#000`** — أي زر Bootstrap الأساسي **بلا أي استجابة بصرية عند المرور**، ولونه لا علاقة له بالعلامة.

**🔴 المشكلة الثانية:** `.p-btn-primary` خلفيته الافتراضية `--p-primary-semi-light` = `#702EA4df` (شفافية 87 %)، وعند `:hover` تصبح `#702EA4` كاملة. أي أن **الحالة الافتراضية أفتح من حالة المرور** — عكس التوقّع، والفرق (6.01:1 → 8.03:1) غير محسوس عمليًا.

#### الأحجام

`btn-xs` (222) · `btn-sm` (55) · افتراضي (~700) · `btn-lg` (3) — إضافةً إلى `.sharp` (40×40) و `.sharp.btn-xs` (26×26).

**26×26 و ~32px (`btn-xs`) أقل من الحد الأدنى 24×24 CSS px** لمعيار WCAG 2.5.8 (Target Size Minimum) عند احتساب التباعد، و**أقل بكثير من 44×44** الموصى به.

#### الحالات

| الحالة | الوضع |
|---|---|
| `default` | ✅ |
| `hover` | ⚠️ موجود عدا `.btn-primary` (نفس اللون) |
| **`focus`** | 🔴 **مُلغى بـ `outline: 0 !important`** في `panel-style.css:3426` — يصيب 970 زرًا. وفي `.p-btn-*` الـ focus **مطابق حرفيًا للـ hover** |
| `active` | ⚠️ `.btn.btn-primary:active { background: #000 }` — لا فرق |
| `disabled` | ⚠️ من Bootstrap فقط (`opacity: .65`)، وفي المكوّنات المحلية 10 قيم مختلفة (0.35–0.9) |
| `loading` | ⚪ غير موجود كنمط — كل مكوّن يرتجل |

#### التوصية

مكوّن **واحد** `<ap-button>` بـ:
- variants: `primary` · `secondary` · `tertiary/ghost` · `danger` · `link` (خمسة — مستخرجة من الاستخدام الفعلي، بلا اختراع)
- sizes: `sm` (32px) · `md` (40px) · `lg` (48px)
- modifiers: `iconOnly` · `loading` · `fullWidth`
- focus ring إلزامي غير قابل للإلغاء
- `p-btn-rounded` يصبح modifier وليس variant

**يُحذف:** `btn-dark`, `btn-light`, `btn-info`, `btn-warning`, `.light.btn-*`, `btn-embossed`, `btn-darkgrey` — و**الـ 40 عائلة المحلية كلها**.

---

### 2.2 Icon Button — 🟡 اثنا عشر تنفيذًا

12 عائلة كلاسات لنفس الشكل. الأبعاد المرصودة: 26×26، 28×28، 32×32، 36×36، 40×40، 44×44. أحجام الأيقونة داخلها: 8.5px إلى 20px.

**التوصية:** modifier على `<ap-button>` بأحجام `sm`(32) · `md`(40) · `lg`(44)، مع `aria-label` إلزامي (انظر [`ACCESSIBILITY-AUDIT.md`](./ACCESSIBILITY-AUDIT.md) — A-06).

### 2.3 Text / Link Button — 🟡

`btn-link` (9)، `link-btn` (3)، `reply-link-btn` (2)، `.alert__link` — إضافةً إلى `<a>` عارية بألوان محلية. لا نمط موحّد للتمييز عن النص العادي.

### 2.4 Loading Button — ⚪ غير موجود كنمط

يوجد `spinner-border` من Bootstrap (تُستخدم مع `me-2` **الميتة** — انظر §9.2 في وثيقة الـ audit) وأنماط ارتجالية. **الحاجة حقيقية** (225 استخدامًا لـ spinner في Admin) → يُبنى.

### 2.5 Dropdown Action — 🟡

Bootstrap `.dropdown` (5 استخدامات) + `mat-menu` (78–111) + قوائم مرتجلة. **`mat-menu` هو الأمر الواقع.**

### 2.6 Split Button — ⚪ غير موجود ولا حاجة له

`btn-group` مستخدم 8 مرات فقط. **لا يُبنى.**

---

## 3. Form Components

> التفصيل الكامل في [`FORM-COMPONENTS-SPEC.md`](./FORM-COMPONENTS-SPEC.md). هنا الجرد فقط.

| المكوّن | التنفيذ السائد | استخدامات | الوضع |
|---|---|---|---|
| **Text Input** | Bootstrap `.form-control` | **698** | 🔴 ارتفاع 55px، حدّ `#ccc` بتباين 1.61:1، focus بلا ring |
| Password Input | `.form-control` + `type=password` | ~10 | 🟡 لا زر إظهار/إخفاء موحّد |
| Number Input | `.form-control` + `type=number` | 24 | 🟡 |
| Search Input | `.form-control` + `type=search` (3) + `navbar-search` + حقول محلية | — | 🟡 ثلاثة أشكال |
| **Textarea** | `.form-control` + `textarea { resize: none }` عالميًا | — | 🟡 `resize:none` عالمي يمنع تكبير حقول النص الطويل |
| **Select** | `<app-native-select>` | **192** | 🟡 ارتفاع 36px (≠ 55px للـ input)، لوحة زرقاء `#007eff` غريبة عن الهوية |
| Select (بديل) | `mat-select` (10) + `.form-select` (7) | 17 | 🟡 |
| **Checkbox** | `mat-checkbox` (62) **و** `.form-check` (128) | 190 | 🟡 نظامان |
| **Radio** | `mat-radio` (56) **و** `.form-check` | — | 🟡 نظامان |
| **Switch / Toggle** | `mat-slide-toggle` (72) + `sg-switch` + `field-toggle` + `oc-toggle-row` | ~90 | 🟡 أربعة أشكال |
| **Date Picker** | `<app-date-picker>` + عائلة `date-*-picker` (5 مكوّنات standalone) | 14 | 🟢 تنفيذ داخلي موحّد ومُوثَّق |
| Time Picker | `<app-time-picker>` | قليل | 🟢 |
| **File Upload** | Uppy + `ngx-dropzone` + `<input type=file>` (5) + `uploading-container` | — | 🟡 ثلاثة مسارات |
| Phone Input | `shared/form-controls/app-phone-input` | — | 🟢 |
| OTP Input | موجود في `views/home` فقط | 0 في Admin | ⚪ خارج النطاق |
| **Color Input** | `<input type=color>` | 7 | ⚪ خام |
| Range | `<input type=range>` | 4 | ⚪ خام |

**الرقم الأخطر:** 1280 `<input>` في Admin، منها **24 فقط** لها `id`، و 1329 `<label>` منها **166 فقط** لها `for`.

---

## 4. Navigation

### 4.1 Sidebar (`<app-deznav-native>`) — 🟢 الأنضج في المشروع

`views/global/deznav-native/` — 493 سطر HTML + 178 SCSS، مكتوب بـ Tailwind، مُوثَّق بتعليقات ممتازة، بديل native لمكوّن jQuery سابق.

**التشريح:**

```text
Sidebar
├── Rail (aside)         ← عرض 5rem مطويًا / كامل موسّعًا
├── Scroll container     ← scrollbar رفيع native
├── Nav item (.dn-item)
│   ├── Icon (.dn-icon)
│   ├── Label (.tw-truncate)
│   └── Chevron (.dn-chevron)  ← للمجموعات
├── Sub-link (.dn-sublink)
├── Tooltip portal (.dn-tooltip)   ← شقيق للـ aside لا ابن (مبرَّر بتعليق دقيق)
└── Flyout portal (.dn-flyout)
```

| الخاصية | القيمة |
|---|---|
| خلفية | `#fff` |
| نص العنصر | `#3f4358` — 9.74:1 ✅ |
| أيقونة | `#969ba0` — **2.80:1** 🔴 |
| نشط | خلفية `#702ea4` + نص `#fff` + وزن 500 — 8.03:1 ✅ |
| Hover | نص `#000` + انزلاق `translateX(10px)` |
| **Focus** | 🔴 **مطابق للـ hover** (`.dn-item:hover, .dn-item:focus`) |
| Tooltip | `#333` / `#fff` / radius 4px / 14px — مستنسخ من tippy.js |
| Flyout | `#fff` / radius 8px / `0 10px 30px rgba(0,0,0,.12)` |
| Reduced motion | ✅ مدعوم |

**التوصية:** يُعتمد كمرجع، مع إصلاحين: لون الأيقونة → `slate-500` (4.76:1)، وفصل الـ focus عن الـ hover.

### 4.2 Top Bar (`<app-header>` + `<app-nav-header>`) — 🟡

`header.component.scss` — 323 سطرًا يعتمد بالكامل على `!important` لتصحيح سلوك dropdown من القالب. يحتوي `.notif-bell-btn` (40×40، radius 10px، `#334155`) — نمط جيد لكنه محلي ويلغي الـ outline صراحة.

### 4.3 Breadcrumb (`<app-breadcrumbs>`) — 🟢

مكوّن standalone واحد، مُستخدم في الـ shell (`base.component.html`). تنفيذ نظيف.

### 4.4 Tabs — 🟡 أربع آليات، وأكثرها ليس تبويبًا

| الآلية | ملفات | ما هي فعلًا |
|---|---|---|
| `.nav-pills` + `routerLinkActive` | **12** | **تنقّل** بين مسارات، لا تبويب |
| `.nav-tabs`/`.nav-pills` داخل الصفحة | **12** | ودجة تبويب حقيقية |
| `queryParams` + `isActive()` يدوية | **52** (كلها `page-edit`) | تنقّل بمعامل استعلام |
| `<mat-tab-group>` | **5 مجموعات** | تبويب داخل الصفحة |

> ⚠️ الرقم **71** المسجَّل سابقًا لـ `mat-tab` كان خطأ عدّ: السلسلة `mat-tab`
> جزء من `mat-table`، و54 من 84 مطابقة كانت جداول. المجموعات الحقيقية خمس.

الأهمّ أن الغالبية **تنقّل** لا تبويب: كل «لوحة» مسار مستقلّ خلف
`<router-outlet>`. ولذلك الهدف مكوّنان لا واحد — `<ap-tab-nav>` (مبنيّ،
موثَّق في `/design-system/components/tab-nav`) للتنقّل، و`<ap-tabs>` للودجة
الحقيقية ولم يُبنَ بعد.

و`aria-current` موجودة في المشروع كلّه **ثلاث مرّات**، و`role="tablist"` في
**5** ملفات من 77 — أي أن القسم المفتوح يُبلَّغ باللون وحده.

### 4.5 Pagination — 🟡 نظامان

`mat-paginator` (**80**، مع `paginator-intl.ts` للتعريب) و `ngx-pagination` (**58**).

### 4.6 Stepper — 🟡

`<app-stepper>` standalone (4 استخدامات) + `steps-progress` + `step-badge` محليان. `mat-stepper` غير مستخدم.

### 4.7 Back Button — ⚪

لا نمط موحّد — يوجد `block-return-btn` (58 استخدامًا في `page-edit`) وهو خاص بالمحرّر.

### 4.8 Menu — 🟡

`mat-menu` (78–111) هو الأمر الواقع، مع Bootstrap `.dropdown` (5).

---

## 5. Data Display

### 5.1 Card — 🔴 نمطان متباعدان بصريًا

| النمط | التعريف | استخدامات |
|---|---|---|
| **Bootstrap `.card`** | `panel-style.css` | `.card` **274** · `.card-body` **334** · `.card-header` 79 · `.card-title` 78 · `.card-footer` 11 |
| **بطاقة الحقبة C** | SCSS محلي | `funnel-card`, `sg-card`, `ac-stat-card`, `asubs-card`, `summary-card`, `detail-card`, `canvas-card`, `template-card`, `big-card`… (~15 عائلة) |

**المقارنة البصرية:**

| الخاصية | `.card` (A) | بطاقة الحقبة C |
|---|---|---|
| نصف القطر | `0.35rem` = **5.6px** | **14px** |
| الحدّ | `0` | `1px solid rgba(15,23,42,.08)` |
| الظل | `0 0 13px rgba(82,63,105,.05)` | `none` افتراضيًا، `0 10px 24px rgba(15,23,42,.08)` عند hover |
| `padding` | `1.875rem` = **30px** (< 575px: 16px) | **16px** |
| `margin-bottom` | `1.875rem` = 30px | يُدار بـ `gap` |
| `transition` | `all .5s ease-in-out` ⚠️ | `140ms` على خصائص محدّدة |
| hover | لا شيء | `translateY(-2px)` + ظل + لون حدّ |
| عنوان | `.card-title` 1.25rem/500/`#000` | `h5` 700/`#0f172a` |

`transition: all 0.5s` على 274 بطاقة = عبء أداء حقيقي + إحساس بطيء.

### 5.2 Stat / KPI Card — 🟡 خمسة تنفيذات

`statistics-item` (17)، `kpi__value/__label/__sub` (13)، `fa-kpi` (8)، `ac-stat-card` (9)، `ac-reminder-card__stat` (6)، `state-box`, `summary-card`.

**النمط المشترك المرصود:** رقم كبير (20–32px / وزن 700–800) + label صغير (11–13px / `slate-500`) + دلتا اختيارية بلون دلالي.

**⚠️ ملاحظة إمكانية وصول:** الدلتا (زيادة/نقصان) تُعبَّر عنها **باللون فقط** في معظم التنفيذات — بلا سهم أو إشارة.

### 5.3 Table — 🔴 نظامان

| النظام | استخدامات |
|---|---|
| `mat-table` (`matColumnDef`, `mat-header-cell`, `mat-cell`, `mat-sort-header`) | **291** |
| `<table>` خام + Bootstrap `.table` | **78** |

**🔴 مشكلة عالمية:** `panel-style.css` يعرّف محدّد عنصر عارٍ:

```css
table { border: 1px solid #eee; padding: 10px; border-radius: 10px; color: #000; }
```

هذا يصيب **كل** جدول في التطبيق بما فيه `mat-table` والجداول داخل محرّر المحتوى (Jodit) والجداول في معاينات الصفحات — بلا أي نطاق.

**التشريح المرصود:** لا يوجد نمط موحّد لـ header sticky، ولا لعرض الأعمدة، ولا لـ zebra، ولا لحالة الصف المحدّد، ولا لحالة الجدول الفارغ.

### 5.4 Empty State — 🔴 غياب شبه كامل

`empty-state` كلاس واحد، `no-data` واحد. النمط الفعلي مكرّر يدويًا: `funnel-list__empty`, `ac-reminders__state`, `cart-details-drawer__state`, `loading-state`، ونصوص `noDataText` في المخططات.

**النمط الأنضج (من `funnel-list`):** حشوة `48px 24px` · محاذاة وسط · حدّ متقطّع `1px dashed rgba(15,23,42,.12)` · نصف قطر 14px · أيقونة 36px بشفافية 0.6 · عنوان `h5` 700 · نص `slate-500` · زر إجراء.

**التوصية:** هذا النمط الجاهز يُرقّى إلى مكوّن `<ap-empty-state>` — الحاجة مثبتة (كل قائمة تحتاجه) والتنفيذ موجود.

### 5.5 Avatar — 🟡 لا مكوّن

`input-avatar`, `comment-avatar`, `preview-avatar`, `reply-avatar`, `trainee-avatar`, `sp-card__thumb`… — كلها `<img>` + `border-radius: 50%` بأحجام مرتجلة. لا حالة fallback موحّدة (بعضها له `*-fallback`، أغلبها لا).

### 5.6 Badge / Tag / Status — 🟡

| النمط | استخدامات |
|---|---|
| Bootstrap `.badge` (+ `badge-success` 11، `badge-danger` 9، `badge-light` 2، `badge-sm` 5) | 31 |
| `status-badge` | 7 |
| `chip` / `ac-channel-chip` / `flow-chip` / `sp__chip` / `word-chip` / `pe-v2-add-panel__chip` | ~15 |
| `sg-status` (نقطة + label) | 6 |
| `trainer-badge`, `ab-badge`, `step-badge`, `comments-count-badge`, `new-feature-badge` | ~10 |

**النمط الصحّي المرصود:** بادج فاتح = خلفية `-50/-100` + نص `-800` + نصف قطر 999px + حشوة `2px 8px` + 11–12px. تباينه ممتاز (§1.5 في وثيقة الـ audit). يُرقّى إلى `<ap-badge>`.

### 5.7 Tooltip — 🟡 ثلاثة أنظمة

`matTooltip` (**125**) · `tippy` عبر `ngx-tippy-wrapper` (**77**) · `<app-info-tooltip>` (5) · `.dn-tooltip` (السايدبار) · `journey-tooltip` (`shared/components`).

**خمسة مظاهر tooltip.** وثيقة `docs/reusable-tooltip-doc.md` موجودة لكن التبنّي جزئي.

### 5.8 Progress — 🟡

Bootstrap `.progress`/`.progress-bar` (13) · `mat-progress-bar` (2، معلّق في الكود) · أشرطة محلية (`runner__progress`, `progress-fill`, `steps-progress`).

### 5.9 Charts — 🔴

ApexCharts، 14 استخدامًا. راجع §1.8 في وثيقة الـ audit: لوحة الـ Pie تعتمد الشفافية وحدها، الـ legend مخفي، وبقية المخططات على اللوحة الافتراضية للمكتبة.

### 5.10 List / Data Row — ⚪ نمط ضمني

يتكرّر عشرات المرات (صف بأيقونة + عنوان + وصف + إجراء) بلا اسم موحّد. مرشّح قوي لمكوّن.

---

## 6. Feedback

### 6.1 Modal / Dialog — 🔴 نظامان متوازيان

| النظام | استخدامات |
|---|---|
| **Angular Material** `MatDialog` | **599** مرجعًا في TS · **352** في القوالب (`mat-dialog-*`) |
| **SweetAlert2** | **238** |
| `<app-custom-dialog>` (`shared/custom-dialog`) | **2** |
| `modal-*` (Bootstrap markup) | 42 |

**92 مكوّن Dialog** في Admin.

المظهر يُضبط عالميًا في `styles.scss` عبر `--mdc-dialog-container-shape` و `::ng-deep`، وثيمة SweetAlert مخصّصة (`.app-swal-confirm` مع `--swal-confirm-accent`, `.app-swal-btn-confirm`, `.app-swal-btn-cancel`) — أي **مظهران مختلفان للتأكيد على نفس الشاشة**.

**ملاحظة إيجابية:** ثيمة SweetAlert المخصّصة تحتوي `:focus-visible` صحيحًا على أزرارها — من القلائل التي نجت.

### 6.2 Confirmation Dialog — 🟡

`shared/components/confirm-dialog` + `standalone/accept-dialog` + `standalone/confirm-unsaved-dialog` + SweetAlert `.app-swal-confirm`. **أربعة مسارات لنفس القرار.**

### 6.3 Alert (inline) — 🔴 شبه معدوم

`.alert` مستخدم **9 مرات فقط** في 400 ملف. البدائل: `alert-danger` (3)، `alert-warning` (1)، بانرات inline في `base.component.html` بـ `style="background-color: antiquewhite"`.

**النتيجة:** لا توجد وسيلة موحّدة لعرض رسالة سياقية داخل الصفحة → كل شيء يُدفع إلى نافذة منبثقة. هذا نمط تفاعل ثقيل (يقطع سياق المستخدم) وهو سبب رئيسي لاعتماد SweetAlert بـ 238 استخدامًا.

### 6.4 Toast / Snackbar — ⚪ غير موجود إطلاقًا

`MatSnackBar`: **0**. لا خدمة toast. **هذه فجوة حقيقية** — كل تأكيد نجاح يتحوّل إلى نافذة تتطلّب نقرة إغلاق.

### 6.5 Loading / Spinner — 🟡

225 استخدامًا لـ "spinner" في قوالب Admin: `spinner-border` (Bootstrap) · `sk-three-bounce` (preloader القالب) · `ns-spinner` (native-select) · `<app-uploading-spinner-dialog>` · `@ngx-loading-bar` · دوّارات محلية. **ستة أشكال.**

### 6.6 Skeleton — ⚪ شبه معدوم (4 استخدامات)

مرشّح للبناء: الشاشات كثيفة البيانات (جداول، بطاقات) تعرض حاليًا دوّارًا في الوسط بدل هيكل عظمي.

### 6.7 Error / Success State — 🟡

`form-errors` (**133**) · `invalid-feedback` (95) · `field-error` (20) · `form-error` (8) · `text-danger` (23) · `modal__error` / `mqd-field-error` / `reminder-dialog__error`. **سبعة أنماط.** التفصيل في [`FORM-COMPONENTS-SPEC.md`](./FORM-COMPONENTS-SPEC.md).

---

## 7. Layout

| المكوّن | الحالة |
|---|---|
| **Page Container** | 🟡 `.content-body` + `.container-fluid` (A) مقابل `.funnel-list { padding:24px; max-width:1200px }` (C) — لا مكوّن |
| **Content Container** | 🟡 غير معرَّف — يُرتجل |
| **Section** | ⚪ لا نمط — يُبنى بـ `.card` أو `<div>` |
| **Grid** | 🟡 Bootstrap 4 `.row/.col-*` (1855+750) مقابل CSS Grid في الحقبة C |
| **Card Container** | 🟡 `.row` + `.col-*` مقابل `grid auto-fill minmax(280px,1fr) gap:16px` |
| **Page Header** | 🟡 نمط متكرّر (عنوان + وصف + أزرار) بلا اسم — `funnel-list__head` هو أنضج تنفيذ |
| **Drawer / Side panel** | 🟡 `cart-details-drawer`, `change-password-drawer`, `--drawer-*` tokens — نمط ناشئ |

---

## 8. مكوّنات خاصة بالمجال (Domain)

هذه ليست مكوّنات نظام تصميم عامة، لكنها كثيفة الاستخدام وتستهلك الـ tokens:

| المكوّن | الموقع | ملاحظة |
|---|---|---|
| Page Builder Sidebar | `page-edit/sidebar` (33 مكوّنًا) + `page-edit-v2/sidebar` (31) | **نسختان كاملتان متوازيتان** — 64 مكوّنًا |
| Funnel Canvas / Flow View | `funnel-builder` | يستخدم CDK drag-drop |
| Automation Builder | `automations-builder` | — |
| Course Content Tree | `products/courses/course-details/course-content-tab` | — |
| Rich Editor | `standalone/course-rich-editor` + Jodit | ثيمة Jodit منفصلة تمامًا |
| Certificate Designer | `main-features/certificates` | يستخدم `Droid Arabic Kufi` غير المحمّل |
| File Bank Picker | `funnel-builder/file-bank-picker` + `main-features/filebank` | تنفيذان |
| Linktree Editor | `main-features/linktree-standalone` (19 مكوّنًا) | — |
| Video / Meeting | `standalone/dyte-meeting`, `zoom-meeting` | ثيمة خارجية |

**ملاحظة استراتيجية:** `page-edit` و `page-edit-v2` معًا = **74 مكوّنًا (17.5 % من Admin)**. ترحيلهما مكلف وعائده البصري منخفض (واجهة محرّر لا واجهة إدارة). يُؤجَّلان إلى آخر الخطة.

---

## 9. جدول التوحيد المقترح

| النمط | تنفيذات اليوم | المستهدف | يُحذف | الأثر |
|---|---|---|---|---|
| Button | 5 أنظمة + ~40 كلاس | `<ap-button>` (5 variants × 3 sizes) | `btn-dark/light/info/warning`, `.light.btn-*`, 40 كلاس محلي | 1283 زر |
| Icon Button | 12 | modifier على `<ap-button>` | 11 عائلة | ~90 |
| Input | 3 | `<ap-input>` | — | 698 |
| Select | 3 | `<app-native-select>` (يُطوَّر) | `mat-select`, `.form-select` | 209 |
| Checkbox/Radio | 2 | `<ap-checkbox>` / `<ap-radio>` | `mat-checkbox`, `mat-radio` | 190 |
| Toggle | 4 | `<ap-switch>` | `mat-slide-toggle` + 3 محلية | ~90 |
| Card | 2+15 | `<ap-card>` | `.card` من القالب | 274+ |
| Table | 2 | `<ap-table>` (على CDK) | `mat-table` | 369 |
| Tabs | 4 | `<ap-tab-nav>` (مبنيّ) + `<ap-tabs>` (لم يُبنَ) | `nav-pills`, `isActive()` المكرّرة | 76 ملفًا |
| Pagination | 2 | `<ap-pagination>` | أحدهما | 138 |
| Tooltip | 5 | `<ap-tooltip>` | `matTooltip`, tippy | 207 |
| Dialog | 4 | `<ap-dialog>` | SweetAlert للتأكيدات | 92 مكوّنًا |
| Badge | 5 | `<ap-badge>` | — | ~70 |
| Empty State | ~6 مرتجلة | `<ap-empty-state>` | — | كل قائمة |
| Toast | 0 | `ApToastService` **جديد** | — | يستبدل ~150 SweetAlert |
| Skeleton | 4 | `<ap-skeleton>` **جديد** | — | يستبدل دوّارات الصفحة |

**المكوّنات الجديدة الثلاثة الوحيدة المبرَّرة:** Toast، Skeleton، Empty State — كلها بحاجة مثبتة بالاستخدام، لا بالاكتمال النظري.

---

## 10. ما لا يُبنى (رغم شيوعه في أنظمة أخرى)

| المكوّن | لماذا لا |
|---|---|
| Split Button | `btn-group` مستخدم 8 مرات فقط |
| Accordion كمكوّن نظام | مستخدم في `page-edit` فقط (سياق محرّر) — يبقى محليًا |
| Carousel | موجود في `shared/ui/carousel` لكنه للموقع العام لا للـ Admin |
| Command Palette | لا استخدام |
| Dark Mode | `darkMode: "class"` مُعلن في Tailwind لكن **صفر تنفيذ** — يُترك كامتداد مستقبلي في بنية الـ tokens، بلا بناء الآن |
| Data Grid متقدّم (تجميد أعمدة، تحرير inline) | لا استخدام حالي |
