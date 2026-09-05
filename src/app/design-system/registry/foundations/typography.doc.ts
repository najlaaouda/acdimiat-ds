import { DocEntry } from '../../core/doc.model';

/* ============================================================================
   الأسس ← التايبوجرافي
   ----------------------------------------------------------------------------
   المصدر: `src/styles/tokens/_primitives.css` § TYPOGRAPHY [D-13]
   السلّم الدلالي (Display / Page Title / …) لم يُعتمد بعد — الأحجام الخام
   وحدها موجودة اليوم، وهي معروضة بقيمها المحسوبة في قسم `tokens`.
   ============================================================================ */

export const TYPOGRAPHY_DOC: DocEntry = {
  slug: 'typography',
  category: 'foundations',
  title: 'التايبوجرافي',
  titleEn: 'Typography',
  summary:
    'خط Readex Pro بأربعة أوزان، سلّم أحجام بالـ rem يتجاوب مع تكبير الخط، وارتفاعات أسطر مضبوطة للعربية.',
  status: 'in-progress',
  keywords: ['typography', 'font', 'خط', 'طباعة', 'readex'],
  sections: [
    {
      kind: 'prose',
      body: [
        'الخط الأساسي ‎Readex Pro‎ — خط عربي/لاتيني مزدوج، فلا يحتاج النظام إلى ' +
          'عائلتين منفصلتين ولا إلى تبديل عائلة عند تغيير اللغة.',
      ],
    },
    {
      kind: 'table',
      title: 'العائلات',
      headers: ['الـ Token', 'القيمة'],
      rows: [
        ['--ap-font-sans', "'Readex Pro', system-ui, -apple-system, 'Segoe UI', sans-serif"],
        ['--ap-font-mono', 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'],
      ],
    },
    {
      kind: 'callout',
      tone: 'danger',
      title: 'الأوزان المحمّلة أربعة فقط',
      body: [
        'الأوزان المتاحة: 400 · 500 · 600 · 700. الأوزان 750 و800 و850 و900 ' +
          'المستخدمة اليوم في 146 موضعًا من المشروع غير محمّلة، فيصطنعها المتصفّح ' +
          '(faux-bold) وينتج عنها تشويه واضح في الحروف العربية. أي وزن خارج الأربعة خطأ.',
      ],
    },
    {
      kind: 'table',
      title: 'سلّم الأحجام',
      headers: ['الـ Token', 'rem', 'px', 'الاستخدام'],
      rows: [
        ['--ap-font-size-2xs', '0.625', '10', 'شارات، عدّادات'],
        ['--ap-font-size-xs', '0.75', '12', 'نص مساعد، رأس جدول'],
        ['--ap-font-size-md', '0.875', '14', 'الأساس — body · button · input · خلايا · labels'],
        ['--ap-font-size-lg', '1', '16', 'نص بارز، عنوان صغير'],
        ['--ap-font-size-xl', '1.125', '18', 'H4'],
        ['--ap-font-size-2xl', '1.25', '20', 'H3'],
        ['--ap-font-size-3xl', '1.5', '24', 'H2'],
        ['--ap-font-size-4xl', '1.75', '28', 'H1'],
        ['--ap-font-size-5xl', '2', '32', 'Display'],
      ],
      caption:
        'الأحجام بالـ rem عمدًا: التطبيق يوفّر تكبير خط عبر ‎html[data-font-size]‎، فتتجاوب النصوص وحدها. المسافات بالـ px حتى لا يتضخّم التخطيط معها.',
    },
    {
      kind: 'table',
      title: 'ارتفاعات الأسطر',
      headers: ['الـ Token', 'القيمة', 'الاستخدام'],
      rows: [
        ['--ap-leading-none', '1', 'أرقام كبيرة، شارات بسطر واحد'],
        ['--ap-leading-tight', '1.3', 'العناوين'],
        ['--ap-leading-snug', '1.45', 'عناوين فرعية، عناصر قوائم'],
        ['--ap-leading-normal', '1.6', 'المتن'],
        ['--ap-leading-relaxed', '1.75', 'فقرات طويلة القراءة'],
      ],
      caption:
        'أعلى من المعتاد لاتينيًا عمدًا: النقاط والتشكيل في العربية تحتاج مساحة رأسية أكبر.',
    },
    {
      kind: 'table',
      title: 'letter-spacing',
      headers: ['الـ Token', 'القيمة', 'الاستخدام'],
      rows: [
        ['--ap-tracking-normal', '0', 'الافتراضي لكل نصّ — عربيًا ولاتينيًا'],
        ['--ap-tracking-tight', '-0.01em', 'العناوين اللاتينية الكبيرة حصرًا'],
      ],
      caption:
        'اسم الـ token يحمل المصطلح الطباعي (tracking)، والخاصية في CSS اسمها letter-spacing. الاثنان يشيران إلى الشيء نفسه.',
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'letter-spacing موجب يكسر العربية',
      body: [
        'القاعدة: القيمة صفر. الحروف العربية متّصلة، وأي letter-spacing موجب يفكّ ' +
          'وصلها فتتحوّل الكلمة إلى حروف متناثرة — وهو تشويه لا يقبله القارئ العربي ' +
          'ولا يشبه أي شيء في الطباعة العربية السليمة.',
        'القيمة السالبة الوحيدة في النظام مخصّصة للعناوين اللاتينية الكبيرة، حيث ' +
          'تبدو المسافات الافتراضية واسعة عند الأحجام الكبيرة. لا تُطبَّق على نصّ عربي.',
      ],
    },
    {
      kind: 'do-dont',
      do: [
        'استخدم ‎--ap-font-size-md‎ كأساس لكل نص تشغيلي.',
        'اربط ارتفاع السطر بحجم الخط دائمًا — لا تترك الافتراضي.',
        'اعتمد على وزن 600 للتمييز بدل تكبير الحجم في العناوين الفرعية.',
      ],
      dont: [
        'لا تستخدم وزنًا خارج 400/500/600/700.',
        'لا تضع letter-spacing موجبًا على نصّ عربي.',
        'لا تكتب ‎font-size‎ بالـ px في مكوّن — يكسر ميزة تكبير الخط.',
      ],
    },
    {
      kind: 'tokens',
      title: 'السلّم بصريًا',
      tokens: [
        '--ap-font-size-2xs',
        '--ap-font-size-xs',
        '--ap-font-size-md',
        '--ap-font-size-lg',
        '--ap-font-size-xl',
        '--ap-font-size-2xl',
        '--ap-font-size-3xl',
        '--ap-font-size-4xl',
        '--ap-font-size-5xl',
        '--ap-font-weight-regular',
        '--ap-font-weight-medium',
        '--ap-font-weight-semibold',
        '--ap-font-weight-bold',
        '--ap-leading-none',
        '--ap-leading-tight',
        '--ap-leading-snug',
        '--ap-leading-normal',
        '--ap-leading-relaxed',
      ],
    },
    {
      kind: 'prose',
      title: 'الأنماط الدلالية',
      body: [
        'الأسماء الدلالية (Display · Page Title · Section Title · Body · Label · Caption) ' +
          'مخطَّط لها في المرحلة 4 من خارطة الطريق ولم تُعتمد بعد. الموجود اليوم هو سلّم ' +
          'الأحجام الخام أعلاه. تُوثَّق الأنماط الدلالية هنا فور اعتمادها.',
      ],
    },
  ],
};
