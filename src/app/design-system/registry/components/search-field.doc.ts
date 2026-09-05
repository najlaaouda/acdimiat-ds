import { DocEntry } from '../../core/doc.model';
import { SEARCH_FIELD_ANATOMY_SOURCE } from '../../demos/search-field/search-field-anatomy.demo';

/* ============================================================================
   المكوّنات ← عناصر النماذج ← حقل البحث
   ----------------------------------------------------------------------------
   الـ tokens من src/styles/tokens/_components.css § SEARCH FIELD
   ============================================================================ */

export const SEARCH_FIELD_DOC: DocEntry = {
  slug: 'search-field',
  category: 'components',
  group: 'form-controls',
  title: 'حقل البحث',
  titleEn: 'Search Field',
  summary: 'نتائج من أوّل حرف بلا زرّ — combobox بلوحة اقتراحات، بصندوق الحقل النصّي نفسه.',
  status: 'stable',
  keywords: ['search', 'autocomplete', 'combobox', 'بحث', 'إكمال تلقائي', 'تصفية'],
  sections: [
    {
      kind: 'prose',
      title: 'لماذا بلا زرّ «بحث»',
      body: [
        'الزرّ في النمط القائم ليس تفصيلة شكل: هو **نقرة إضافية في كل بحث**، ويجعل ' +
          'الحقل يبدو نموذجًا يُرسَل لا أداة تصفية. والنتائج هنا تظهر من أوّل حرف، ' +
          'فالمستخدم يرى أثر ما يكتبه وهو يكتبه.',
        'واللوحة **تُفتح فورًا** بحالة «جارٍ البحث»، والتأخير (debounce) يؤخّر ' +
          'النتائج وحدها. لو انتظر الفتحُ التأخيرَ لبدا الحقل صامتًا بعد أوّل حرف — ' +
          'وهو ما يدفع المستخدم إلى النقر بحثًا عن زرّ لا وجود له.',
      ],
    },

    {
      kind: 'callout',
      tone: 'info',
      title: 'لماذا مكوّن مستقلّ لا حقل نصّي بـ type="search"',
      body: [
        '**زرّ المسح.** `apFieldSuffix` القائم نصّ ساكن `aria-hidden` — للعملة ' +
          'و«https://». ووضع زرّ قابل للتركيز داخله نقيضه الدلالي.',
        '**لوحة الاقتراحات.** تحتاج `popover` وتموضعًا محسوبًا وربطًا بـ ARIA.',
        '**دلالة combobox.** `aria-expanded` و`aria-controls` و`aria-activedescendant` ' +
          'على الحقل نفسه — وهي ما يجعل قارئ الشاشة يعلن ظهور النتائج أصلًا.',
        'وما عدا ذلك **هو الحقل النصّي حرفيًا**: كل توكن لوني أو قياسي هنا اسم ' +
          'مستعار لـ `--ap-input-*`، فتغيير حدّ الحقل النصّي يصل إلى البحث بلا سطر ثانٍ.',
      ],
    },

    {
      kind: 'demo',
      title: 'المعاينة',
      description:
        'اكتب حرفًا واحدًا. وجرّبها بلوحة المفاتيح: سهم الأسفل ينقل التمييز والكتابة تستمرّ في مكانها، وEnter يختار، وEsc يغلق ثم يمسح في ضغطة ثانية.',
      demo: {
        id: 'search-field-anatomy',
        load: () => import('../../demos/search-field/search-field-anatomy.demo'),
        source: SEARCH_FIELD_ANATOMY_SOURCE,
      },
    },

    {
      kind: 'table',
      title: 'لوحة المفاتيح',
      headers: ['المفتاح', 'ما يفعل'],
      rows: [
        ['سهم أسفل', 'يفتح اللوحة إن كانت مغلقة، وإلّا نقل التمييز إلى التالي (يلتفّ)'],
        ['سهم أعلى', 'التمييز إلى السابق (يلتفّ)'],
        ['Home / End', 'أوّل اقتراح / آخره'],
        ['Enter', 'يختار المميَّز — ويمنع إرسال النموذج المحيط'],
        ['Esc', 'يغلق اللوحة. وفي ضغطة ثانية يمسح النصّ'],
        ['Tab', 'يغادر الحقل كلّه — لا يدخل الاقتراحات'],
      ],
      caption:
        'التركيز الفيزيائي لا يغادر الحقل أبدًا؛ التمييز داخل اللوحة بـ aria-activedescendant. ولذلك الاقتراح ‎<div role="option">‎ لا ‎<button>‎.',
    },

    {
      kind: 'anatomy',
      title: 'التشريح',
      parts: [
        {
          name: '<ap-field>',
          description:
            'الحاوي. هو ما يولّد الـ id ويربط الـ label — أخفِ الـ label في شريط الأدوات، ولا تحذفه.',
          required: true,
        },
        {
          name: 'الصندوق',
          description:
            'يحمل الحدّ والتعبئة وحلقة التركيز، لا <input> نفسه: داخله ثلاثة عناصر يجب أن تُقرأ صندوقًا واحدًا. والحلقة تنتقل إليه بـ :focus-within.',
          required: true,
        },
        {
          name: 'أيقونة العدسة',
          description: 'زينة فوق النصّ — المعنى في الـ label وفي placeholder. aria-hidden.',
          required: true,
        },
        {
          name: 'زرّ المسح',
          description:
            'يظهر مع وجود نصّ. زرّ حقيقي في ترتيب التنقّل باسم «مسح البحث»، ويعيد التركيز إلى الحقل بعد المسح.',
          required: true,
        },
        {
          name: 'المنطقة الحيّة',
          description:
            'تُعلن عدد النتائج. aria-expanded تقول «مفتوح» ولا تقول كم — وهي المعلومة التي يبني عليها المستخدم قراره.',
          required: true,
        },
      ],
    },

    {
      kind: 'do-dont',
      title: 'الاستخدام',
      do: [
        'اجعل الاقتراحات وصولًا سريعًا لا نتيجة بحث كاملة — ثمانية تكفي، والباقي في الجدول تحتها.',
        'ضع في hint ما يميّز المتشابهين: البريد تحت الاسم.',
        'صفِّ الجدول مع كل تغيّر في النصّ، فيبقى ما تحت اللوحة متّسقًا مع ما فيها.',
        'أخفِ الـ label في شريط الأدوات ولا تحذفه.',
      ],
      dont: [
        'لا تضع زرّ «بحث» بجانبه — وجوده يناقض سبب وجود المكوّن.',
        'لا تشترط حدًّا أدنى من الأحرف قبل الاقتراح؛ الاسم الواحد قد يكون حرفين.',
        'لا تجعل الاقتراح <button> — يُدخل عناصر في ترتيب التنقّل لا يجب أن تكون فيه.',
        'لا تعتمد aria-expanded وحدها لإعلان النتائج؛ العدد يحتاج منطقة حيّة.',
      ],
    },

    {
      kind: 'prose',
      title: 'النصّ',
      body: [
        'نصّ الحقل قاعدة مستقلّة عن المكوّن، وموضعها ' +
          '**دليل المحتوى ← نصوص البحث** (`/design-system/content/search-copy`): ' +
          'التسمية «البحث في [الكيان]» تقول في ماذا، وplaceholder «البحث بـ[الحقول] [الكيان]» ' +
          'يقول بأيّ حقل.',
        'والقاعدة الحاكمة هناك تخصّ هذا المكوّن مباشرةً: **placeholder عقدٌ مع ' +
          'الترشيح**، فالحقول المذكورة فيه هي التي تطابقها دالّة البحث فعلًا — ' +
          'ونفسها التي تُرشَّح بها الاقتراحات، فلا تفترق القائمة عن الجدول تحتها.',
      ],
    },

    {
      kind: 'tokens',
      title: 'الـ tokens',
      tokens: [
        '--ap-search-height',
        '--ap-search-bg',
        '--ap-search-bg-hover',
        '--ap-search-bg-focus',
        '--ap-search-border',
        '--ap-search-border-hover',
        '--ap-search-border-focus',
        '--ap-search-border-width',
        '--ap-search-radius',
        '--ap-search-fg',
        '--ap-search-placeholder',
        '--ap-search-font-size',
        '--ap-search-padding-x',
        '--ap-search-gap',
        '--ap-search-focus-ring',
        '--ap-search-icon-size',
        '--ap-search-icon-fg',
        '--ap-search-clear-size',
        '--ap-search-clear-radius',
        '--ap-search-clear-fg',
        '--ap-search-clear-fg-hover',
        '--ap-search-clear-bg-hover',
        '--ap-search-hint-fg',
        '--ap-search-hint-size',
      ],
    },
  ],
};
