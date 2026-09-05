# Acadimiat — Form Components Specification

> **الحالة:** تحليل ومواصفة مقترحة. لم يُعدَّل أي ملف إنتاجي.
> **النطاق:** كل عناصر الإدخال داخل Admin Dashboard.
> **القراءة أولًا:** [`DESIGN-SYSTEM-AUDIT.md`](./DESIGN-SYSTEM-AUDIT.md)

---

## 0. لماذا النماذج أولوية قصوى

| القياس | العدد |
|---|---|
| `<input>` في قوالب Admin | **1280** |
| `.form-control` | **698** |
| `<label>` | **1329** |
| `<label for="…">` | **166** (12.5 %) |
| `<input id="…">` | **24** (1.9 %) |
| `aria-describedby` | 33 |
| `aria-invalid` | **10** |
| `aria-required` | **1** |
| مكوّنات Dialog (أغلبها نماذج) | 92 |

النماذج هي **أكثر أنواع الواجهة كثافة في الـ Admin وأكثرها كسرًا**. وهي أيضًا المكان الذي تجتمع فيه كل مشاكل النظام: ثلاث حِقب لونية، أربعة أنظمة عناصر، تركيز مُعطَّل، وربط دلالي شبه معدوم.

---

## 1. الأنظمة المتعايشة

| النظام | العناصر | استخدامات | الوضع |
|---|---|---|---|
| **Bootstrap 4** | `.form-control`, `.form-group`, `.form-check`, `.invalid-feedback`, `.form-select` | 698 + 128 + 95 + 7 | السائد |
| **Angular Material** | `mat-checkbox` (62), `mat-radio` (56), `mat-slide-toggle` (72), `mat-select` (10), `mat-form-field` (14), `matInput` (1), `mat-datepicker` (2) | ~217 | جزئي |
| **داخلي (Standalone)** | `app-native-select` (192), `app-date-picker` (14), `date-range-picker`, `date-time-picker`, `time-picker`, `schedule-picker`, `app-phone-input` | ~220 | ناشئ |
| **محلي (SCSS لكل مكوّن)** | `field-toggle`, `sg-switch`, `oc-toggle-row`, `mqd-field-error`, `modal__error`… | عشرات | مرتجل |

**نتيجة عملية:** على شاشة إعدادات واحدة قد يجتمع حقل نصّي بارتفاع 55px، وقائمة اختيار بارتفاع 36px، ومفتاح Material بلون indigo، ومربّع اختيار Bootstrap — كلها بأنصاف أقطار وألوان تركيز مختلفة.

---

## 2. Text Input — `.form-control`

### 2.1 التنفيذ الحالي

`assets/css/panel-style.css:2749`

```css
.form-control {
    background: #fff;
    border: 1px solid #CCCCCC;
    color: black;
    height: 55px;
    padding: 10px 20px;
    border-radius: 0.5rem;
}
@media (max-width: 1400px) { .form-control { height: 41px; } }

.form-control:focus,
.form-control.active {
    box-shadow: none;
    background: #fff;
    color: black;
    border: 1px solid var(--p-primary-color) !important;
}
```

### 2.2 التشريح المرصود — وهنا مشكلة بنيوية

يوجد **ترتيبان متعاكسان** في المشروع:

**النمط A (`form-errors` — 133 استخدامًا)** — رسالة الخطأ **قبل** الـ label:

```html
<div class="form-group">
  <div class="form-errors" *ngIf="showErrors && getFormError('name')">يرجى تعبئة الحقل</div>
  <label>الاسم</label>
  <input type="text" formControlName="name" class="form-control" />
</div>
```

**النمط B (`invalid-feedback` — 95 استخدامًا)** — رسالة الخطأ **بعد** الحقل:

```html
<label class="text-black text-left col-12">نسبة مئوية</label>
<input type="number" class="form-control" formControlName="percent">
<div class="invalid-feedback" [ngClass]="{'d-block': …}">يجب اضافة نسبة مئوية</div>
```

**النمط A خاطئ بصريًا ودلاليًا:** الخطأ يظهر قبل أن يقرأ المستخدم اسم الحقل أصلًا، وقارئ الشاشة يقرأ "يرجى تعبئة الحقل" ثم "الاسم" ثم مربّع نص — بلا أي رابط بينها.

### 2.3 التشريح المستهدف

```text
Field
├── Label            (إلزامي، مربوط بـ for/id)
│   └── Required mark  (*  + aria-required)
├── Helper text      (اختياري — قبل الحقل، مربوط بـ aria-describedby)
├── Input container
│   ├── Leading icon   (اختياري)
│   ├── Input value / Placeholder
│   ├── Trailing icon / action  (مسح، إظهار كلمة المرور، وحدة قياس)
│   └── Loading / validation indicator
└── Message slot     (خطأ | نجاح | عدّاد أحرف — مربوط بـ aria-describedby + role="alert")
```

### 2.4 المشاكل المرصودة

| # | المشكلة | الدليل | الخطورة |
|---|---|---|---|
| F-01 | **ارتفاع 55px** — ضخم بلا مبرّر، ويقفز إلى 41px تحت 1400px (قفزة 25 %) | `panel-style.css:2755` | عالية |
| F-02 | **حدّ `#CCCCCC` بتباين 1.61:1** — غير مرئي عمليًا | مُقاس | **حرجة** (WCAG 1.4.11) |
| F-03 | **التركيز = تغيير لون حدّ 1px فقط، بلا ring، بـ `box-shadow: none`** | `panel-style.css:2764` | **حرجة** (WCAG 2.4.7) |
| F-04 | `color: black` مطلق بدل token | — | متوسطة |
| F-05 | لا حالة `hover` معرّفة إطلاقًا | — | متوسطة |
| F-06 | لا حالة `readonly` معرّفة | — | متوسطة |
| F-07 | `disabled` يعتمد على افتراضي Bootstrap فقط (`#e9ecef`) | — | منخفضة |
| F-08 | `.form-control.is-invalid { border-right: 0 !important }` — **خاصية فيزيائية** تكسر في LTR | `panel-style.css` | متوسطة |
| F-09 | `.is-invalid` مطبَّق على **9** حقول فقط مقابل **95** رسالة خطأ → في 86 حالة **تظهر الرسالة والحقل بلا أي تمييز بصري** | مُقاس | عالية |
| F-10 | `.invalid-feedback` لونه `#ff4c41` (3.30:1) — **يسقط** لنص عادي | `bootstrap.css:2514` | عالية |
| F-11 | `.form-errors` لونه `#f00a` → فعليًا `#ff5555` = **3.14:1** — يسقط | `styles.scss:359` | عالية |
| F-12 | `.form-errors` حدّه `#f008` → `#ff7777` = **2.57:1** — يسقط (المطلوب 3:1) | `styles.scss:360` | متوسطة |
| F-13 | لا `role="alert"` ولا `aria-live` على أي رسالة خطأ | مُقاس | عالية |
| F-14 | Placeholder يُستخدم أحيانًا بديلًا عن label | 152 حقل نصّي | عالية |

### 2.5 المواصفة المقترحة

| الخاصية | `sm` | `md` (افتراضي) | `lg` |
|---|---|---|---|
| الارتفاع | 32px | **40px** | 48px |
| الحشوة الأفقية | 8px | 12px | 16px |
| حجم الخط | 13px | **14px** | 16px |
| نصف القطر | 6px | **8px** | 8px |
| حجم الأيقونة | 14px | 16px | 18px |
| فجوة أيقونة/نص | 6px | 8px | 8px |

> **لماذا 40px لا 55px؟** 40px هو الارتفاع الفعلي لـ `.btn` في المشروع، وهو الارتفاع السائد في مكوّنات الحقبة C (`native-select` = 36px، `notif-bell-btn` = 40px). التوحيد على 40px يجعل الحقل والزر والقائمة على سطر واحد بلا تعديل — وهو ما لا يتحقّق اليوم. → **القرار D-07**

**المسافات:**

```text
Label → Input        : 6px
Input → Message      : 4px
Field → Field        : 16px   (بدل .form-group margin-bottom: 1rem)
Field → Section      : 24px
```

**الحدود والألوان (بالإشارة إلى tokens مقترحة):**

| الحالة | الحدّ | الخلفية | النص |
|---|---|---|---|
| `default` | `slate-300` (تباين 2.1:1 على أبيض) — أو `slate-400` لبلوغ 3:1 | `#fff` | `slate-900` |
| `hover` | `slate-400` | `#fff` | `slate-900` |
| `focus` | `purple-700` + **ring `0 0 0 3px purple-700/15%`** | `#fff` | `slate-900` |
| `filled` | كـ default | `#fff` | `slate-900` |
| `disabled` | `slate-200` | `slate-50` | `slate-400` + `cursor: not-allowed` |
| `readonly` | `slate-200` | `slate-50` | `slate-700` (نص مقروء بالكامل) |
| `error` | `red-600` + ring `red-600/15%` عند التركيز | `#fff` | `slate-900` |
| `success` | `teal-600` | `#fff` | `slate-900` |

> **ملاحظة على حدّ الحالة الافتراضية:** WCAG 1.4.11 يشترط 3:1 لحدود عناصر الواجهة **حين يكون الحدّ هو الوسيلة الوحيدة لتحديد العنصر**. `slate-300` (~2.1:1) لا يبلغ ذلك. الخياران: (أ) `slate-400` (2.56:1 — ما زال دون العتبة)، (ب) `slate-500` (4.76:1 — يمرّ لكنه ثقيل بصريًا)، (ج) `slate-300` + خلفية `slate-50` داخل الحقل ليصبح الحقل مميّزًا بالتعبئة لا بالحدّ وحده. **الخيار (ج) هو التوصية** → **القرار D-08**.

---

## 3. Textarea

| البند | الحالي | المقترح |
|---|---|---|
| النمط | `.form-control` (يرث ارتفاع 55px 🔴) | `<ap-textarea>` |
| `resize` | **`textarea { resize: none }` عالميًا في `styles.scss:369`** | `resize: vertical` افتراضيًا، `none` عند الطلب |
| الحد الأدنى للأسطر | غير معرَّف | 3 أسطر (~88px) |
| عدّاد الأحرف | مرتجل | slot موحّد في منطقة الرسالة |

**🔴 `resize: none` على محدّد عنصر عالمي** يمنع المستخدم من تكبير حقول النصوص الطويلة (وصف منتج، محتوى بريد) — قيد قابلية استخدام حقيقي، ويصيب المحرّرات الغنية أيضًا.

---

## 4. Select — `<app-native-select>`

### 4.1 التنفيذ الحالي

`src/app/standalone/native-select/` — مكوّن Tailwind كامل، بديل native لـ `ng-select`، يدعم `role="combobox"` و `aria-expanded` و `aria-controls` والتنقّل بلوحة المفاتيح. **بنيته الدلالية جيدة.**

### 4.2 المشاكل

| # | المشكلة | الدليل |
|---|---|---|
| S-01 | **`min-height: 36px`** مقابل 55px للـ `.form-control` — فارق 19px على نفس السطر | `tw-min-h-[36px]` |
| S-02 | حجم الخط `13px` مقابل 14px للحقول | `tw-text-[13px]` |
| S-03 | نصف القطر `rounded` (4px) مقابل `0.5rem` (8px) للحقول | — |
| S-04 | **لوحة ألوان زرقاء غريبة عن الهوية:** تركيز `#007eff`، خيار محدَّد `#ebf5ff`، خيار نشط `#f5faff`، رقاقة متعدّد `#ebf5ff`/`#d6ebff`، سهم `#999` | `native-select.component.scss` + HTML |
| S-05 | لون النص `#333` مطلق | `tw-text-[#333]` |
| S-06 | الحالة المعطّلة `#f9f9f9` بدل token | — |
| S-07 | ✅ **التركيز صحيح** — `border-[#007eff]` + `shadow inset + 0 0 0 3px rgba(0,126,255,0.1)` — لكنه **باللون الخطأ** | — |

**التقييم:** هذا المكوّن هو **أقرب شيء إلى focus ring صحيح في المشروع كله** — لكنه ورث لوحة `ng-select` الافتراضية بالكامل. الإصلاح لوني بحت، لا بنيوي.

### 4.3 المواصفة المقترحة

نفس أبعاد `<ap-input>` بالضبط (40px / 14px / radius 8px)، ونفس ألوان الحالات، مع:

| العنصر | القيمة |
|---|---|
| السهم | `slate-500`، 16px |
| القائمة | خلفية `#fff`، radius 8px، ظل `e3`، أقصى ارتفاع 320px |
| خيار hover | `slate-50` |
| خيار محدَّد | `purple-50` + نص `purple-800` + وزن 600 |
| خيار مركَّز (لوحة مفاتيح) | `slate-100` + **حدّ داخلي `purple-700`** (ليتميّز عن hover) |
| رقاقة متعدّد | `purple-50` / نص `purple-800` / radius 999px |

---

## 5. Checkbox & Radio — 🟡 نظامان

| النظام | Checkbox | Radio | ملاحظة |
|---|---|---|---|
| Angular Material | 62 | 56 | لون indigo من ثيمة Material الميتة — **لا علاقة له بالعلامة** |
| Bootstrap `.form-check` | مشترك 128 | مشترك | `.custom-control` 17 إضافية |
| `<input type=checkbox>` خام | 23 | 9 (radio) | بلا تنسيق |

**المشاكل:**

| # | المشكلة |
|---|---|
| C-01 | حجم عنصر التحكّم مختلف: Material 18px / Bootstrap 16px / خام حسب المتصفح |
| C-02 | لون التحديد: Material indigo مقابل البنفسجي في المكوّنات المحلية |
| C-03 | حالة `indeterminate` مدعومة في Material فقط |
| C-04 | مساحة اللمس أقل من 24×24 في تنفيذ Bootstrap |
| C-05 | ربط الـ label: Material يربط تلقائيًا؛ Bootstrap يحتاج `for`/`id` — وهما شبه غائبين |
| C-06 | التركيز: Material له ripple لا outline؛ Bootstrap مُلغى عالميًا |

**المواصفة المقترحة:**

| البند | Checkbox | Radio |
|---|---|---|
| حجم التحكّم | 18×18 | 18×18 |
| مساحة اللمس | 40×40 (padding شفاف) | 40×40 |
| نصف القطر | 4px | 50% |
| حدّ غير محدَّد | `1.5px slate-400` | `1.5px slate-400` |
| محدَّد | تعبئة `purple-700` + علامة بيضاء 12px | نقطة `purple-700` قطرها 8px |
| `indeterminate` | تعبئة `purple-700` + شرطة بيضاء | — |
| focus | ring `0 0 0 3px purple-700/15%` | نفسه |
| disabled | حدّ `slate-200` / تعبئة `slate-100` | نفسه |
| فجوة → label | 8px |
| حجم label | 14px / `slate-800` |

---

## 6. Switch / Toggle — 🟡 أربعة تنفيذات

`mat-slide-toggle` (72) · `sg-switch` (`__track` + `__thumb`) · `field-toggle` · `oc-toggle-row` — بالإضافة إلى `--switch-active` / `--switch-inactive` كمتغيّرين معزولين.

**المواصفة المقترحة:**

| البند | القيمة |
|---|---|
| المسار | 40×22، radius 999px |
| الإبهام | 18×18 دائري أبيض، ظل `0 1px 2px rgba(15,23,42,.2)` |
| مطفأ | مسار `slate-300` |
| مشتعل | مسار `purple-700` |
| disabled | شفافية 0.5 + `cursor: not-allowed` |
| focus | ring حول المسار |
| الدلالة | `role="switch"` + `aria-checked` |
| مساحة اللمس | 40×40 |
| نمط الصف | `Toggle row` = عنوان + وصف + المفتاح في الطرف — يُرقّى إلى `<ap-toggle-row>` (مستخرج من `sg-toggle-row`) |

**⚠️ ملاحظة إمكانية وصول:** حالة المفتاح تُنقل حاليًا **باللون وحده**. المستهدف: `aria-checked` + موضع الإبهام (وهو تمييز شكلي كافٍ) — مع تجنّب الاعتماد على اللون فقط.

---

## 7. Date / Time Pickers — 🟢 الأنضج

عائلة كاملة في `standalone/`: `date-picker`, `date-range-picker`, `date-time-picker`, `time-picker`, `schedule-picker`, `date-pickers-demo` — ومعها `DATE_PICKERS_README.md` و `CHANGELOG.md` و `IMPLEMENTATION_SUMMARY.md`.

تستخدم مجموعة tokens خاصة `--dp-*` (`--dp-border`, `--dp-text`, `--dp-radius`, `--dp-accent`, `--dp-accent-hover`, `--dp-surface`, `--dp-input-bg`, `--dp-dropdown-radius`, `--dp-text-muted`).

**الحكم:** بنية جيدة، لكن مجموعة `--dp-*` معزولة — تُعاد صياغتها كـ component tokens تشير إلى الطبقة الدلالية.

**التوصية:** تُوحَّد أبعاد الزناد (trigger) مع `<ap-input>`.

---

## 8. File Upload — 🟡 ثلاثة مسارات

| المسار | الاستخدام |
|---|---|
| Uppy (`@uppy/dashboard`, `@uppy/tus`, `@uppy/drag-drop`) | رفع الملفات الكبيرة (فيديو) |
| `ngx-dropzone` | مناطق السحب والإفلات |
| `<input type="file">` خام | 5 |
| `<app-uploading-container>` / `<app-uploading-spinner-dialog>` | عرض التقدّم |
| `file-bank-picker` (funnel) + `filebank` (main) | **منتقيان مختلفان لنفس المهمّة** |

ثيمة Uppy خارجية تمامًا ولا تتبع أي token في المشروع.

---

## 9. Validation — المواصفة

### 9.1 الحالة اليوم

| النمط | استخدامات | اللون | التباين | الموضع |
|---|---|---|---|---|
| `.form-errors` | **133** | `#f00a` → `#ff5555` | **3.14:1** ❌ | **قبل** الـ label |
| `.invalid-feedback` | **95** | `#ff4c41` | **3.30:1** ❌ | بعد الحقل |
| `.field-error` | 20 | محلي | — | بعد الحقل |
| `.form-error` | 8 | محلي | — | — |
| `.text-danger` | 23 | Bootstrap | — | متغيّر |
| `.modal__error` / `.mqd-field-error` / `.reminder-dialog__error` | ~12 | محلي | — | — |

**سبعة أنماط، بموضعين متعاكسين، ولا واحد منها يمرّ معيار التباين.**

### 9.2 المواصفة المقترحة

**البنية:**

```html
<div class="ap-field" [class.ap-field--error]="hasError">
  <label class="ap-field__label" [for]="id">
    الاسم <span class="ap-field__required" aria-hidden="true">*</span>
  </label>
  <p class="ap-field__hint" [id]="id + '-hint'">نص مساعد اختياري</p>

  <input [id]="id" class="ap-input"
         [attr.aria-invalid]="hasError || null"
         [attr.aria-required]="required || null"
         [attr.aria-describedby]="describedBy" />

  <p class="ap-field__error" [id]="id + '-error'" role="alert" *ngIf="hasError">
    <i class="fa fa-circle-exclamation" aria-hidden="true"></i>
    يرجى تعبئة الحقل
  </p>
</div>
```

**القواعد الإلزامية:**

| القاعدة | القيمة |
|---|---|
| موضع الخطأ | **دائمًا بعد الحقل** |
| لون نص الخطأ | `red-700` = `#b61317` — **6.79:1** ✅ |
| حدّ الحقل عند الخطأ | `red-600` = `#dc2626` — 4.83:1 ✅ |
| أيقونة الخطأ | إلزامية (لا يُنقل الخطأ باللون وحده — WCAG 1.4.1) |
| حجم نص الخطأ | 12px (لا 80 % من `font-size` كما في Bootstrap) |
| المسافة حقل ← خطأ | 4px |
| الدلالة | `role="alert"` + `aria-invalid="true"` + `aria-describedby` |
| علامة الإلزام | `*` مرئية + `aria-required="true"` (لا `*` وحدها) |
| النجاح | `teal-700` + أيقونة ✓ — **يُستخدم فقط** حيث يوجد تحقّق غير متزامن (مثل توفّر كود الخصم) |
| التوقيت | التحقّق عند `blur` لا عند كل ضغطة مفتاح؛ إعادة التحقّق فورية بعد ظهور الخطأ |

**ملاحظة عن `.invalid-feedback`:** التعريف في Bootstrap هو `display: none` ويُظهَر بـ `.was-validated` أو شقيق `.is-invalid`. المشروع يتحايل عليه بـ `[ngClass]="{'d-block': …}"` في 9 حالات فقط من 95 → **86 رسالة خطأ قد لا تظهر إطلاقًا** أو تظهر بلا تمييز على الحقل. يجب التحقّق من كل موضع أثناء الترحيل.

---

## 10. جدول الاتساق — الوضع الحالي مقابل المستهدف

| السؤال | اليوم | المستهدف |
|---|---|---|
| هل كل الحقول بنفس الارتفاع؟ | ❌ 55px / 41px / 36px / Material | ✅ 40px موحّد (3 أحجام اختيارية) |
| هل الـ Select مطابق للـ Input؟ | ❌ 36px مقابل 55px، لوحة زرقاء | ✅ متطابق تمامًا |
| هل حقل البحث مطابق؟ | ❌ ثلاثة أشكال | ✅ `<ap-input type="search">` + أيقونة |
| هل الـ Textarea متناسق؟ | ❌ يرث 55px، `resize:none` عالمي | ✅ min 3 أسطر، `resize: vertical` |
| هل Checkbox و Radio بنفس حجم التحكّم؟ | ❌ 18/16/متغيّر | ✅ 18×18 كلاهما |
| هل الـ Toggle واضح ومميّز؟ | ⚠️ 4 تنفيذات، حالة باللون فقط | ✅ واحد + `role="switch"` |
| هل التركيز مرئي؟ | ❌ **مُلغى عالميًا** | ✅ ring 3px إلزامي |
| هل الأخطاء مربوطة دلاليًا؟ | ❌ 10 من 1280 | ✅ 100 % |
| هل الـ labels مربوطة؟ | ❌ 166 من 1329 | ✅ 100 % |
| هل ألوان الأخطاء تمرّ AA؟ | ❌ 3.14:1 و 3.30:1 | ✅ 6.79:1 |
| هل الخطأ منقول بغير اللون؟ | ❌ لون فقط | ✅ أيقونة + نص + `aria-invalid` |
| هل موضع الخطأ ثابت؟ | ❌ قبل الـ label في 133 موضعًا | ✅ بعد الحقل دائمًا |

---

## 11. أولوية الترحيل داخل النماذج

| # | المهمّة | العدد المتأثّر | خطر بصري | مكسب |
|---|---|---|---|---|
| 1 | إعادة تفعيل focus ring | كل الحقول | منخفض (إضافة فقط) | **حرج a11y** |
| 2 | توحيد ألوان الأخطاء + إضافة أيقونة | 256 رسالة | منخفض | **حرج a11y** |
| 3 | ربط `label/for` + `id` + `aria-*` | 1280 حقل | **صفر بصري** | **حرج a11y** |
| 4 | نقل `.form-errors` إلى بعد الحقل | 133 | متوسط | عالٍ |
| 5 | توحيد ارتفاع الحقول على 40px | 698 + 192 | **عالٍ** | عالٍ |
| 6 | إعادة تلوين `native-select` بالبنفسجي | 192 | متوسط | عالٍ |
| 7 | استبدال Material checkbox/radio/toggle | ~190 | متوسط | متوسط |
| 8 | إلغاء `textarea { resize:none }` العالمي | كل الـ textarea | منخفض | متوسط |

المهامّ 1–3 **بلا أثر بصري تقريبًا** وتحلّ أخطر مشاكل إمكانية الوصول — وهي أول ما يُنفَّذ.
