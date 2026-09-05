import { DocEntry } from '../../core/doc.model';
import { CHECKBOX_ANATOMY_SOURCE } from '../../demos/checkbox/checkbox-anatomy.demo';
import { CHECKBOX_INDETERMINATE_SOURCE } from '../../demos/checkbox/checkbox-indeterminate.demo';

/* ============================================================================
   المكوّنات ← عناصر النماذج ← مربّع الاختيار
   ----------------------------------------------------------------------------
   الأرقام من docs/design-system/FORM-COMPONENTS-SPEC.md §5
   الـ tokens من src/styles/tokens/_components.css § CHECKBOX / RADIO / SWITCH
   ============================================================================ */

export const CHECKBOX_DOC: DocEntry = {
  slug: 'checkbox',
  category: 'components',
  group: 'form-controls',
  title: 'مربّع الاختيار',
  titleEn: 'Checkbox',
  summary: 'خيار مستقلّ يُرفع ويُنزل، بحالة وسطى لما تحته، وهدف لمس 40×40.',
  status: 'stable',
  keywords: ['checkbox', 'مربع', 'اختيار', 'موافقة', 'indeterminate', 'نموذج'],
  sections: [
    {
      kind: 'callout',
      tone: 'warning',
      title: 'ثلاثة أنظمة لمربّع واحد',
      body: [
        'في المشروع اليوم ثلاثة تنفيذات متعايشة: Material (62 مربّعًا) بلون ' +
          'indigo موروث من ثيمة ميتة لا علاقة له بالعلامة، وBootstrap ‎.form-check‎ ' +
          '(128 استخدامًا مشتركًا مع الراديو) ومعه 17 ‎.custom-control‎، ' +
          'و23 عنصرًا خامًا بلا تنسيق إطلاقًا.',
        'والنتيجة ثلاثة مقاسات (18px و16px وحسب المتصفّح)، ولونا تحديد مختلفان، ' +
          'وحالة وسطى تعمل في Material وحده — في الشاشة الواحدة أحيانًا.',
      ],
    },

    {
      kind: 'demo',
      title: 'البنية',
      description:
        'افحص أي مربّع في أدوات المطوّر: معرّف مولَّد على العنصر، وfor مطابق على الـ label، ووصف مربوط بـ aria-describedby — بلا سطر واحد من ذلك في القالب.',
      demo: {
        id: 'checkbox-anatomy',
        load: () => import('../../demos/checkbox/checkbox-anatomy.demo'),
        source: CHECKBOX_ANATOMY_SOURCE,
      },
    },

    {
      kind: 'anatomy',
      title: 'التشريح',
      parts: [
        {
          name: 'هدف اللمس',
          description:
            'مربّع شفّاف 40×40 حول الشكل المرئي 18×18. العنصر الأصلي مبسوط عليه كاملًا، فكل نقرة داخله تصيب.',
          required: true,
        },
        {
          name: 'الشكل المرسوم',
          description:
            'شقيق مباشر للعنصر الأصلي. يحمل الحدّ والتعبئة والعلامة، ولا يستقبل أي حدث.',
          required: true,
        },
        {
          name: 'العلامة',
          description:
            'صحّ للمحدَّد، وشرطة للحالة الوسطى. الاثنتان في الشكل نفسه وتتبادلان الظهور، فلا يومض الشكل عند التبديل.',
          required: true,
        },
        {
          name: 'الـ Label',
          description: 'إلزامي دائمًا. يُخفى بصريًا بـ labelHidden عند الحاجة، ولا يُحذف أبدًا.',
          required: true,
        },
        {
          name: 'الوصف',
          description:
            'سطر تحت الـ label يشرح أثر الخيار. مربوط بـ aria-describedby لا مضموم إلى الاسم.',
          required: false,
        },
        {
          name: 'الرسالة',
          description: 'خطأ يحمل role="alert". على الخيار المفرد، أو على المجموعة كلّها.',
          required: false,
        },
      ],
    },

    {
      kind: 'demo',
      title: 'الحالة الوسطى',
      description:
        'بدّل خيارًا واحدًا وراقب مربّع «تحديد الكلّ». الحالة الوسطى مدعومة اليوم في Material وحده من بين الأنظمة الثلاثة (C-03).',
      demo: {
        id: 'checkbox-indeterminate',
        load: () => import('../../demos/checkbox/checkbox-indeterminate.demo'),
        source: CHECKBOX_INDETERMINATE_SOURCE,
      },
    },

    {
      kind: 'callout',
      tone: 'info',
      title: 'الحالة الوسطى لا تُرسل قيمة',
      body: [
        '‎indeterminate‎ خاصية DOM لا سمة HTML، ولا تُلغي ‎checked‎ بل تُغطّيها ' +
          'بصريًا: العنصر يبقى في بيانات النموذج على حاله. لذلك تُستخدم على ' +
          'مربّع «تحديد الكلّ» وحده — وهو مربّع تحكّم لا حقل بيانات.',
        'وهي تُغطّي المحدَّد أيضًا، فيلزم رفعها متى صار الكلّ محدَّدًا. الشرط ' +
          '«بعضٌ ولا كلّ» هو ما يمنع بقاء الشرطة بعد تحديد الجميع.',
      ],
    },

    {
      kind: 'matrix',
      title: 'مصفوفة الحالات',
      description:
        'الحالات التفاعلية مفروضة عبر data-state. أمّا التحديد والحالة الوسطى والتعطيل فحقيقية — تزييفها كان سيخفي فرقًا في السلوك لا في المظهر.',
      demo: {
        id: 'checkbox-matrix',
        load: () => import('../../demos/checkbox/checkbox-matrix.demo'),
      },
      columnMin: '6rem',
      variants: [
        { id: 'unchecked', label: 'غير محدَّد', inputs: {} },
        { id: 'checked', label: 'محدَّد', inputs: { checked: true } },
        { id: 'indeterminate', label: 'وسطى', inputs: { indeterminate: true } },
      ],
      states: [
        { id: 'default', label: 'Default', inputs: {} },
        { id: 'hover', label: 'Hover', inputs: { state: 'hover' } },
        { id: 'focus', label: 'Focus', inputs: { state: 'focus' } },
        { id: 'disabled', label: 'Disabled', inputs: { disabled: true } },
      ],
    },

    {
      kind: 'table',
      title: 'المواصفة',
      headers: ['البند', 'القيمة', 'لماذا'],
      rows: [
        ['حجم الشكل', '18×18', 'يطابق ارتفاع سطر النصّ المجاور فيستقيم الصفّ'],
        ['هدف اللمس', '40×40', 'WCAG 2.5.8 يفرض 24 حدًّا أدنى، و40 يطابق الحقل والزرّ'],
        ['نصف القطر', '4px', 'مربّع بزوايا لطيفة — يبقى مربّعًا يميّزه عن الراديو'],
        ['الحدّ غير المحدَّد', '1.5px · slate-400', 'الوسيلة الوحيدة لرؤيته وهو فارغ'],
        ['المحدَّد', 'تعبئة purple-700 + علامة بيضاء 12px', 'العلامة ترث لون الشكل عبر currentColor'],
        ['الوسطى', 'تعبئة purple-700 + شرطة بيضاء', 'شكل ثالث مميّز، لا حالة بينية باهتة'],
        ['الفجوة إلى الـ label', '8px', 'قريب بما يكفي ليُقرآ وحدة واحدة'],
        ['التركيز', 'حلقة 3px purple-700/35%', 'على الشكل لا على العنصر الشفّاف'],
      ],
      caption:
        'المقاس 18px هو مقاس Material الحالي عمدًا: لا يتبدّل الإدراك البصري عند الترحيل — يتبدّل اللون وحده، فينحصر خطر الانحدار في اللون.',
    },

    {
      kind: 'callout',
      tone: 'info',
      title: 'لماذا العنصر الأصلي شفّاف والشكل مرسوم بجواره',
      body: [
        'العنصر الأصلي شفّاف تمامًا ومبسوط على هدف اللمس كلّه، والشكل المرئي ' +
          'شقيقه المرسوم تحته. كل حالة تُقرأ من الأول وتُطبَّق على الثاني بمحدّد ' +
          'الشقيق المباشر.',
        'والبديلان الشائعان أسوأ: محتوى مولَّد على العنصر نفسه (‎::before‎) لا ' +
          'يضمنه أي معيار للعناصر المستبدَلة — يعمل اليوم وينكسر بلا إنذار. ' +
          'وصورة خلفية بعلامة SVG تدفن لون العلامة داخلها، فلا يشتقّ من token ' +
          'ولا يتبع الحالة المعطَّلة.',
        'والشفافية لا الإخفاء: ‎display: none‎ كان سيُخرج العنصر من ترتيب التنقّل ' +
          'ومن شجرة إمكانية الوصول معًا، فيصير الشكل صورة لا تُنقر ولا تُعلَن.',
      ],
    },

    {
      kind: 'do-dont',
      title: 'إرشادات الاستخدام',
      do: [
        'استخدم مربّع الاختيار للنيّة التي تُحفظ لاحقًا مع النموذج: «أوافق على الشروط».',
        'اكتب الـ label بصيغة مثبتة: «إرسال إشعار» لا «عدم إرسال إشعار» — النفي المزدوج مع مربّع غير محدَّد لا يُقرأ.',
        'ضع الحالة الوسطى على مربّع «تحديد الكلّ» فقط.',
        'اجمع المربّعات المترابطة في ‎<ap-choice-group>‎ ليكون لها عنوان مُعلَن.',
      ],
      dont: [
        'لا تستخدم مربّع اختيار لتنفيذ فوري بلا زرّ حفظ — ذلك مفتاح.',
        'لا تضع مربّعًا واحدًا داخل مجموعة بعنوان يكرّر نصّه.',
        'لا تعتمد على اللون وحده للتحديد — العلامة نفسها هي التمييز الشكلي.',
        'لا تحذف الـ label لأن السياق «واضح» — قارئ الشاشة لا يرى السياق.',
      ],
    },

    {
      kind: 'list',
      title: 'إمكانية الوصول',
      items: [
        'الـ label مربوط بـ ‎for‎/‎id‎ — يولّدهما ‎<ap-choice>‎ تلقائيًا. الربط اليدوي غائب في أغلب المشروع (C-05).',
        'هدف اللمس 40×40 — تنفيذ Bootstrap القائم دون 24×24 التي يفرضها WCAG 2.5.8 (C-04).',
        'المسافة تبدّل الحالة، وTab ينقل بين المربّعات — سلوك أصلي لم يُعَد بناؤه.',
        'حلقة التركيز مرسومة على الشكل المرئي، لا على العنصر الشفّاف ولا ملغاة كما في تنفيذ Bootstrap (C-06).',
        'في وضع التباين القسري يتنحّى الشكل المرسوم ويظهر العنصر الأصلي بألوان النظام — وضوح مضمون بدل شكل مخصّص غير مرئي.',
        'رسالة الخطأ تحمل ‎role="alert"‎ ومربوطة بـ ‎aria-describedby‎.',
      ],
    },

    {
      kind: 'prose',
      title: 'السلوك في RTL',
      body: [
        'الشكل في بداية الصفّ والنصّ بعده، والاثنان بخصائص منطقية — فينقلب ' +
          'الترتيب مع الصفحة بلا قاعدة ثانية.',
        'وصفّ الإعداد (‎layout="between"‎) يستخدم ‎row-reverse‎ لا ‎order‎: الأخير ' +
          'كان يغيّر الترتيب البصري ويترك ترتيب DOM كما هو، فينفصل التنقّل ' +
          'بلوحة المفاتيح عمّا تراه العين.',
      ],
    },

    {
      kind: 'tokens',
      title: 'الـ Tokens المرتبطة',
      tokens: [
        '--ap-control-size',
        '--ap-control-touch-size',
        '--ap-control-gap',
        '--ap-control-bg',
        '--ap-control-bg-hover',
        '--ap-control-bg-checked',
        '--ap-control-bg-checked-hover',
        '--ap-control-bg-disabled',
        '--ap-control-bg-checked-disabled',
        '--ap-control-fg-checked',
        '--ap-control-border',
        '--ap-control-border-hover',
        '--ap-control-border-checked',
        '--ap-control-border-disabled',
        '--ap-control-border-width',
        '--ap-control-label-size',
        '--ap-control-label-color',
        '--ap-control-desc-size',
        '--ap-control-desc-color',
        '--ap-control-group-gap',
        '--ap-checkbox-radius',
        '--ap-checkbox-mark-size',
      ],
    },
  ],
};
