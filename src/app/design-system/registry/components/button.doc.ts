import { DocEntry } from '../../core/doc.model';
import { BUTTON_ICONS_SOURCE } from '../../demos/button/button-icons.demo';
import { BUTTON_LOADING_SOURCE } from '../../demos/button/button-loading.demo';
import { BUTTON_SIZES_SOURCE } from '../../demos/button/button-sizes.demo';
import { BUTTON_VARIANTS_SOURCE } from '../../demos/button/button-variants.demo';

/* ============================================================================
   المكوّنات ← الأفعال ← الزرّ
   ----------------------------------------------------------------------------
   ⚠️ الحالة: `not-standardized`.
   لا يوجد `<ap-button>` في المشروع اليوم. توجد خمسة أنظمة أزرار متوازية.
   هذه الصفحة توثّق الواقع المرصود + المواصفة المعتمدة في تقرير القرارات،
   وتصرّح بالفارق بينهما. لا تخترع مواصفة غير معتمدة.

   الأرقام من docs/design-system/COMPONENT-INVENTORY.md § 2.1
   الـ tokens من src/styles/tokens/_components.css § BUTTON
   ============================================================================ */

export const BUTTON_DOC: DocEntry = {
  slug: 'button',
  category: 'components',
  group: 'actions',
  title: 'الزرّ',
  titleEn: 'Button',
  summary:
    'الفعل الأساسي في الواجهة. خمسة أنظمة متوازية اليوم، ومواصفة واحدة معتمدة للتوحيد.',
  status: 'stable',
  keywords: ['button', 'زر', 'أزرار', 'action', 'btn'],
  sections: [
    {
      kind: 'callout',
      tone: 'info',
      title: 'مبنيّ ومتاح — والترحيل لم يبدأ',
      body: [
        'المكوّن موجود في ‎src/app/ui/button‎ ويُستهلك في المعاينات أدناه. ' +
          'استخدمه في كل شاشة جديدة.',
        'لكن أنظمة الأزرار الخمسة القديمة ما تزال في مكانها (‎.btn‎ بـ 970 استخدامًا ' +
          'و‎.p-btn-*‎ بـ 309 و~40 كلاسًا محليًا). ترحيلها دَين مفتوح، لا شرط لاستخدام ' +
          'المكوّن الجديد.',
      ],
    },
    {
      kind: 'demo',
      title: 'الأنواع',
      description: 'خمسة أنواع. النوع الأساسي واحد فقط في كل منطقة بصرية.',
      demo: {
        id: 'button-variants',
        load: () => import('../../demos/button/button-variants.demo'),
        source: BUTTON_VARIANTS_SOURCE,
      },
    },
    {
      kind: 'demo',
      title: 'الأحجام',
      demo: {
        id: 'button-sizes',
        load: () => import('../../demos/button/button-sizes.demo'),
        source: BUTTON_SIZES_SOURCE,
      },
    },
    {
      kind: 'demo',
      title: 'الأيقونات',
      description:
        'أيقونة في البداية، أو في النهاية، أو بلا أيقونة، أو أيقونة وحدها. الأيقونات محدَّدة (outline) وترث لون النصّ.',
      demo: {
        id: 'button-icons',
        load: () => import('../../demos/button/button-icons.demo'),
        source: BUTTON_ICONS_SOURCE,
      },
    },
    {
      kind: 'demo',
      title: 'التحميل والتعطيل',
      description:
        'المؤشّر يحلّ محلّ الأيقونة ولا يُزال النصّ، فيبقى عرض الزرّ ثابتًا ولا يقفز ما حوله.',
      demo: {
        id: 'button-loading',
        load: () => import('../../demos/button/button-loading.demo'),
        source: BUTTON_LOADING_SOURCE,
      },
    },

    /* ── Overview ─────────────────────────────────────────────────────── */
    {
      kind: 'prose',
      title: 'نظرة عامة',
      body: [
        'الزرّ يُنفّذ فعلًا في الصفحة الحالية. إن كان يَنقل المستخدم إلى مكان آخر فهو ' +
          'رابط لا زرّ — والفرق ليس تجميليًا: قارئ الشاشة يعلن الدور، ولوحة المفاتيح ' +
          'تتعامل مع Enter و Space بشكل مختلف بين العنصرين.',
      ],
    },

    /* ── Usage ────────────────────────────────────────────────────────── */
    {
      kind: 'list',
      title: 'متى يُستخدم',
      items: [
        'تنفيذ فعل: حفظ، حذف، إرسال، تفعيل.',
        'فتح طبقة عائمة: نافذة، درج، قائمة.',
        'تبديل حالة فورية لا تُغيّر المسار.',
      ],
    },
    {
      kind: 'list',
      title: 'متى لا يُستخدم',
      items: [
        'الانتقال إلى صفحة أخرى — استخدم رابطًا ‎<a>‎.',
        'اختيار من مجموعة خيارات — استخدم Radio أو Select.',
        'تبديل إعداد ثنائي يُحفظ فورًا — استخدم Switch.',
        'أكثر من فعل أساسي واحد في المنطقة الواحدة — الثاني يصبح ثانويًا.',
      ],
    },

    /* ── Anatomy ──────────────────────────────────────────────────────── */
    {
      kind: 'anatomy',
      title: 'التشريح',
      parts: [
        {
          name: 'الحاوية',
          description: 'عنصر <button> بارتفاع ثابت من --ap-button-height-*. لا <div> ولا <a>.',
          required: true,
        },
        {
          name: 'أيقونة البداية — apIconStart',
          description: 'منفذ مسمّى. محدَّدة (outline) وترث لون النصّ. الفجوة عنها --ap-button-gap لا هوامش يدوية. تحمل aria-hidden دائمًا.',
          required: false,
        },
        {
          name: 'النصّ',
          description: 'فعل واضح بصيغة الأمر. إلزامي إلا في زرّ الأيقونة الوحيدة، وعندها يحلّ aria-label محلّه.',
          required: true,
        },
        {
          name: 'أيقونة النهاية — apIconEnd',
          description: 'منفذ مسمّى. للقوائم المنسدلة أو الانتقال. تُعلَّم بـ apIconFlip إن كانت اتّجاهية فتنعكس في RTL.',
          required: false,
        },
        {
          name: 'مؤشّر التحميل',
          description: 'يحلّ محلّ الأيقونة الأمامية ولا يغيّر عرض الزرّ، فلا يقفز ما حوله.',
          required: false,
        },
      ],
    },
    {
      kind: 'callout',
      tone: 'danger',
      title: 'لا يوجد اليوم منفذ (slot) لمؤشّر التحميل',
      body: [
        'الأزرار التي تُظهر تحميلًا تفعله بـ ‎*ngIf‎ يبدّل المحتوى كله، فيقفز عرض الزرّ ' +
          'ويتحرّك ما حوله. المواصفة تثبّت العرض أثناء التحميل.',
      ],
    },

    /* ── Variants ─────────────────────────────────────────────────────── */
    {
      kind: 'table',
      title: 'الأنواع المعتمدة',
      headers: ['النوع', 'الاستخدام', 'الـ Token الأساسي'],
      rows: [
        ['Primary', 'الفعل الأساسي الوحيد في المنطقة', '--ap-button-primary-bg'],
        ['Secondary', 'فعل موازٍ أقلّ أهمية', '--ap-button-secondary-bg'],
        ['Tertiary / Ghost', 'فعل خفيف داخل جدول أو بطاقة', '--ap-button-tertiary-bg'],
        ['Danger', 'فعل مدمِّر — حذف، إلغاء اشتراك', '--ap-button-danger-bg'],
        ['Link', 'فعل يشبه الرابط بصريًا — بلون العلامة لا بالأزرق', '--ap-button-link-fg'],
      ],
      caption:
        'خمسة أنواع مستخرجة من الاستخدام الفعلي. يُحذف عند التوحيد: btn-dark · btn-light · btn-info · btn-warning · ‎.light.btn-*‎ · btn-embossed · btn-darkgrey.',
    },

    {
      kind: 'callout',
      tone: 'info',
      title: 'زرّ الرابط بلون العلامة لا بالأزرق',
      body: [
        'الأزرق في النظام لون **الروابط**: ما ينقلك إلى مكان آخر. وزرّ الرابط ' +
          'فعلٌ يقع في مكانه — شكله وحده يشبه الرابط. أن يحمل لون الروابط يجعله ' +
          'يَعِد بانتقال لا يحدث.',
        'وكان أيضًا اللون الوحيد في نظام الأزرار الخارج عن هوية العلامة، فيظهر ' +
          'غريبًا في صفّ يجمعه بزرّ أساسي بنفسجي.',
        'ولذلك لم يتغيّر ‎--ap-color-text-link‎ نفسه: الروابط الحقيقية تبقى ' +
          'زرقاء، وهو ما يُبقي للأزرق معنًى واحدًا لا لبس فيه.',
      ],
    },
    {
      kind: 'table',
      title: 'الواقع المرصود اليوم',
      headers: ['النظام', 'الاستخدامات في لوحة الإدارة', 'المصدر'],
      rows: [
        ['Bootstrap ‎.btn‎', '970', 'قالب مشترى'],
        ['‎.p-btn-*‎', '309', 'داخلي'],
        ['Angular Material', '11 (‎mat-icon-button‎ فقط)', 'مكتبة'],
        ['‎<app-button>‎', '3 (كلّها خارج لوحة الإدارة)', 'داخلي'],
        ['كلاسات محلية', '~40 عائلة', 'مرتجل'],
      ],
      caption:
        'إضافةً إلى 1283 عنصر ‎<button>‎ خام. النموذج نفسه (زرّ أيقونة مربّع) أُعيدت كتابته 12 مرة بأسماء مختلفة.',
    },

    {
      kind: 'table',
      title: 'قواعد الأيقونة',
      headers: ['القاعدة', 'التفصيل'],
      rows: [
        ['الأسلوب', 'محدَّدة (outline) لا مصمتة — fill: none + stroke: currentColor'],
        ['اللون', 'يُورَث من النصّ. لا قاعدة لون لكل نوع وحالة'],
        ['الحجم', 'من --ap-icon-* ويتبع حجم الزرّ: 14px في sm و16px في md و20px في lg'],
        ['السماكة', '--ap-border-width-medium — ثابتة بصريًا مع تغيّر الحجم'],
        ['التأليف', 'بالاتجاه اللاتيني دائمًا، كما في كل مكتبات الأيقونات'],
        ['الانعكاس', 'apIconFlip على الاتّجاهية وحدها فتنعكس في RTL'],
        ['إمكانية الوصول', 'aria-hidden دائمًا — المعنى في النصّ لا في الأيقونة'],
      ],
      caption:
        'الأيقونة المصمتة تُثقل الزرّ بصريًا وتنافس النصّ على الانتباه. المحدَّدة تتّسق مع وزن الخط 500 المستخدم في الأزرار.',
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'زرّ الأيقونة الوحيدة يحتاج نصًّا رغم غيابه',
      body: [
        'المدخل iconOnly يُخفي النصّ بصريًا ولا يحذفه من الشجرة، فيقرؤه قارئ الشاشة ' +
          'ويجده بحث الصفحة. ومع ذلك يبقى aria-label إلزاميًا على العنصر.',
        'رُصد في المشروع اثنا عشر تنفيذًا لزرّ الأيقونة المربّع بأسماء مختلفة، ' +
          'وأغلبها بلا اسم يُعلن — فقارئ الشاشة يقول «زر» بلا أي دلالة على فعله.',
      ],
    },
    /* ── Sizes ────────────────────────────────────────────────────────── */
    {
      kind: 'table',
      title: 'الأحجام',
      headers: ['الحجم', 'الارتفاع', 'الحشوة الأفقية', 'نصف القطر', 'الاستخدام'],
      rows: [
        ['sm', '32px', '--ap-space-3 (12px)', '8px', 'داخل صفوف الجداول والأشرطة المزدحمة'],
        ['md', '40px', '--ap-space-4 (16px)', '8px', 'الافتراضي في كل مكان'],
        ['lg', '48px', '--ap-space-5 (20px)', '12px', 'الفعل الأساسي في نموذج مستقلّ'],
      ],
      caption:
        '40px هو الارتفاع الموحّد لكل عناصر التحكّم: يطابق ‎.btn‎ الحالي ويزيل التنافر مع الحقل (55/41px) والقائمة المنسدلة (36px).',
    },
    {
      kind: 'callout',
      tone: 'danger',
      title: 'أحجام ساقطة معياريًا',
      body: [
        '‎btn-xs‎ (222 استخدامًا) ينتج ~32px، و‎.sharp.btn-xs‎ ينتج 26×26 — كلاهما دون ' +
          'الحدّ الأدنى 24×24 CSS px في WCAG 2.5.8 عند احتساب التباعد، وأبعد بكثير عن 44×44 الموصى به. ' +
          'لا تُنشئ أزرارًا جديدة بهذه الأحجام.',
      ],
    },

    /* ── States ───────────────────────────────────────────────────────── */
    {
      kind: 'table',
      title: 'الحالات',
      headers: ['الحالة', 'السلوك المعتمد', 'الوضع اليوم'],
      rows: [
        ['Default', 'الخلفية من ‎--ap-button-<variant>-bg‎', 'موجود'],
        ['Hover', 'الخلفية إلى ‎-bg-hover‎', 'موجود عدا ‎.btn-primary‎ — نفس اللون فلا استجابة'],
        ['Pressed / Active', 'الخلفية إلى ‎-bg-active‎', 'بلا فرق في ‎.btn-primary‎'],
        ['Focus visible', 'حلقة ‎--ap-button-focus-ring‎ — غير قابلة للإلغاء', 'أُصلح في المرحلة 1 من خارطة الطريق'],
        ['Disabled', 'شفافية ‎--ap-opacity-disabled‎ (0.5) + منع المؤشّر', '10 قيم شفافية مختلفة (0.35 → 0.9)'],
        ['Loading', 'مؤشّر مكان الأيقونة + ‎aria-busy‎ + عرض ثابت', 'غير موجود كنمط'],
      ],
    },
    {
      kind: 'callout',
      tone: 'success',
      title: 'التركيز أُصلح بالفعل',
      body: [
        'كان ‎outline: 0 !important‎ في ‎panel-style.css‎ يلغي مؤشّر التركيز على 970 زرًا، ' +
          'وكان ‎:focus‎ في ‎.p-btn-*‎ مطابقًا حرفيًا لـ ‎:hover‎. أُزيل الأول وفُصل الثاني ' +
          'ضمن نظام التركيز في ‎src/styles/foundations/_focus.css‎.',
      ],
    },

    {
      kind: 'matrix',
      title: 'مصفوفة الحالات',
      description:
        'كل نوع في كل حالة. الحالات التفاعلية مفروضة عبر data-state — وهي القاعدة نفسها التي تحكم التفاعل الحقيقي، فلا فرق بين ما تراه هنا وما يحدث عند المرور.',
      demo: {
        id: 'button-matrix',
        load: () => import('../../demos/button/button-matrix.demo'),
      },
      variants: [
        { id: 'primary', label: 'Primary', inputs: { variant: 'primary' } },
        { id: 'secondary', label: 'Secondary', inputs: { variant: 'secondary' } },
        { id: 'tertiary', label: 'Tertiary', inputs: { variant: 'tertiary' } },
        { id: 'danger', label: 'Danger', inputs: { variant: 'danger' } },
      ],
      states: [
        { id: 'default', label: 'Default', inputs: {} },
        { id: 'hover', label: 'Hover', inputs: { state: 'hover' } },
        { id: 'active', label: 'Pressed', inputs: { state: 'active' } },
        { id: 'focus', label: 'Focus', inputs: { state: 'focus' } },
        { id: 'disabled', label: 'Disabled', inputs: { disabled: true } },
        { id: 'loading', label: 'Loading', inputs: { loading: true } },
      ],
    },
    /* ── Do / Don't ───────────────────────────────────────────────────── */
    {
      kind: 'do-dont',
      title: 'إرشادات الاستخدام',
      do: [
        'فعل أساسي واحد فقط في كل منطقة بصرية.',
        'اكتب النصّ فعلًا واضحًا: «حفظ التغييرات» لا «موافق».',
        'اجعل زرّ الأيقونة الوحيدة يحمل ‎aria-label‎ يصف الفعل.',
        'ثبّت عرض الزرّ أثناء التحميل حتى لا يقفز ما حوله.',
      ],
      dont: [
        'لا تستخدم ‎Danger‎ لفعل غير مدمِّر لمجرّد لفت الانتباه.',
        'لا تعطّل زرّ الإرسال قبل محاولة الإرسال — أظهر الخطأ بعدها.',
        'لا تكتب «اضغط هنا» ولا نصًّا لا يذكر الفعل.',
        'لا تُنشئ عائلة كلاسات جديدة لزرّ — استخدم النوع والحجم القائمين.',
      ],
    },

    /* ── Accessibility ────────────────────────────────────────────────── */
    {
      kind: 'list',
      title: 'إمكانية الوصول',
      items: [
        'عنصر ‎<button type="button">‎ دائمًا — النوع صريح حتى لا يُرسل نموذجًا بالخطأ.',
        'زرّ الأيقونة الوحيدة يحتاج ‎aria-label‎؛ الأيقونة نفسها ‎aria-hidden="true"‎.',
        'أثناء التحميل: ‎aria-busy="true"‎، ويبقى الزرّ في ترتيب التنقّل.',
        'التعطيل عبر ‎disabled‎ يُخرج الزرّ من ترتيب التنقّل — استخدم ‎aria-disabled‎ إن كان يجب أن يبقى قابلًا للتركيز ليشرح سبب التعطيل.',
        'مؤشّر التركيز إلزامي وغير قابل للإلغاء بأي قاعدة محلية.',
        'هدف اللمس 44×44 على الأقل، أو 24×24 مع تباعد كافٍ.',
      ],
    },

    /* ── RTL ──────────────────────────────────────────────────────────── */
    {
      kind: 'prose',
      title: 'السلوك في RTL',
      body: [
        'الأيقونة الأمامية تنقلب إلى يمين النصّ تلقائيًا عند استخدام ‎flex‎ مع ' +
          '‎gap‎ — لا هوامش يدوية. أيقونات الاتجاه (سهم رجوع، سهم تالٍ) تنعكس أفقيًا؛ ' +
          'أيقونات المعنى (حفظ، حذف، بحث) لا تنعكس.',
        'تحذير قائم: 201 كلاس ‎ms-*‎/‎me-*‎/‎ps-*‎/‎pe-*‎ ميّت في المشروع — الفجوات ' +
          'المبنية عليها لا تعمل أصلًا. استخدم ‎--ap-button-gap‎.',
      ],
    },

    /* ── Tokens ───────────────────────────────────────────────────────── */
    {
      kind: 'tokens',
      title: 'الـ Tokens المرتبطة',
      tokens: [
        '--ap-button-height-sm',
        '--ap-button-height-md',
        '--ap-button-height-lg',
        '--ap-button-padding-x-sm',
        '--ap-button-padding-x-md',
        '--ap-button-padding-x-lg',
        '--ap-button-gap',
        '--ap-button-radius-sm',
        '--ap-button-radius-md',
        '--ap-button-radius-lg',
        '--ap-button-font-size',
        '--ap-button-font-weight',
        '--ap-button-disabled-opacity',
        '--ap-button-primary-bg',
        '--ap-button-primary-bg-hover',
        '--ap-button-primary-bg-active',
        '--ap-button-primary-fg',
        '--ap-button-secondary-bg',
        '--ap-button-secondary-bg-hover',
        '--ap-button-secondary-fg',
        '--ap-button-secondary-border',
        '--ap-button-tertiary-bg-hover',
        '--ap-button-tertiary-fg',
        '--ap-button-danger-bg',
        '--ap-button-danger-bg-hover',
        '--ap-button-danger-fg',
        '--ap-button-link-fg',
        '--ap-button-focus-ring-color',
      ],
    },
  ],
};
