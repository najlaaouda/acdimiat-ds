import { DocEntry } from '../../core/doc.model';

/* ============================================================================
   الأسس ← الارتفاع والظلال
   المصدر: src/styles/tokens/_primitives.css § ELEVATION + _semantic.css
   ============================================================================ */

export const ELEVATION_DOC: DocEntry = {
  slug: 'elevation',
  category: 'foundations',
  title: 'الارتفاع والظلال',
  titleEn: 'Elevation',
  summary: 'ستّة مستويات بلون ظلّ واحد، ودلالة لكل مستوى تحدّد ما يعلو ما.',
  status: 'stable',
  keywords: ['elevation', 'shadow', 'ظل', 'ظلال', 'ارتفاع'],
  sections: [
    {
      kind: 'prose',
      body: [
        'الظلّ في هذا النظام ليس زخرفة بل إجابة عن سؤال واحد: ما الذي يعلو ما؟ ' +
          'العنصر الأعلى ظلًّا هو الأقرب إلى المستخدم والأولى بانتباهه، ولذلك ' +
          'ترتيب المستويات يطابق ترتيب الطبقات في ‎--ap-z-*‎.',
      ],
    },
    {
      kind: 'callout',
      tone: 'info',
      title: 'لون ظلّ واحد لا أربعة',
      body: [
        'كل الظلال مشتقّة من ‎slate-900‎ بشفافيات متدرّجة، بدل أربعة «أسود» مختلفة ' +
          'كانت في الكود. الظلّ بلون محايد يندمج مع الأسطح؛ والأسود الخالص يميل إلى ' +
          'رمادي قذر فوق الخلفيات الملوّنة.',
      ],
    },
    {
      kind: 'tokens',
      title: 'المستويات الخام',
      tokens: [
        '--ap-shadow-none',
        '--ap-shadow-xs',
        '--ap-shadow-sm',
        '--ap-shadow-md',
        '--ap-shadow-lg',
        '--ap-shadow-xl',
        '--ap-shadow-brand',
      ],
    },
    {
      kind: 'tokens',
      title: 'المستويات الدلالية',
      tokens: [
        '--ap-elevation-flat',
        '--ap-elevation-card',
        '--ap-elevation-raised',
        '--ap-elevation-dropdown',
        '--ap-elevation-drawer',
        '--ap-elevation-modal',
      ],
    },
    {
      kind: 'table',
      title: 'الدلالة',
      headers: ['المستوى', 'يشير إلى', 'أين يُستخدم', 'الطبقة المقابلة'],
      rows: [
        ['flat', 'shadow-none', 'عنصر ملاصق للسطح — صفّ جدول، قسم', '--ap-z-base'],
        ['card', 'shadow-xs', 'بطاقة داخل الصفحة', '--ap-z-base'],
        ['raised', 'shadow-sm', 'بطاقة عند المرور، عنصر مسحوب', '--ap-z-raised'],
        ['dropdown', 'shadow-md', 'قائمة منسدلة، select، popover', '--ap-z-popover'],
        ['drawer', 'shadow-lg', 'درج جانبي', '--ap-z-sidebar'],
        ['modal', 'shadow-xl', 'نافذة منبثقة فوق حجاب', '--ap-z-modal'],
      ],
    },
    {
      kind: 'tokens',
      title: 'سلّم الطبقات',
      tokens: [
        '--ap-z-base',
        '--ap-z-raised',
        '--ap-z-sticky',
        '--ap-z-header',
        '--ap-z-sidebar',
        '--ap-z-backdrop',
        '--ap-z-modal',
        '--ap-z-popover',
        '--ap-z-tooltip',
        '--ap-z-toast',
      ],
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'الظلّ لا يكفي وحده لفصل طبقة',
      body: [
        'العنصر العائم فوق محتوى يحتاج ثلاثة معًا: خلفية معتمة، وظلًّا، وترتيب طبقة ' +
          'صحيحًا. الظلّ بلا خلفية معتمة يُظهر ما تحته فتصعب القراءة، وبلا ‎z-index‎ ' +
          'صحيح قد يختفي خلف عنصر آخر رغم ظلّه.',
        'سلّم الطبقات يستبدل عشرين قيمة بلا نظام كانت في الكود — منها 1200 و1201 ' +
          'و1500 و1501 وقيمة ‎1000000‎ مكتوبة inline.',
      ],
    },
    {
      kind: 'do-dont',
      do: [
        'اختر المستوى بدلالته لا بشكله: ‎--ap-elevation-dropdown‎ لا ‎--ap-shadow-md‎.',
        'ارفع البطاقة مستوى واحدًا عند المرور — لا مستويين.',
        'استخدم ‎--ap-shadow-brand‎ للعنصر النشط الذي يحمل لون العلامة.',
      ],
      dont: [
        'لا تستخدم الظلّ لتمييز عنصر غير عائم — الحدّ أو الخلفية أنسب.',
        'لا تجمع ظلّين على عنصر واحد.',
        'لا تُنشئ قيمة ظلّ جديدة. رُصدت 284 قيمة ظلّ مميزة في المشروع، والهدف ستّة.',
        'لا تكتب ‎z-index‎ برقم خام.',
      ],
    },
  ],
};
