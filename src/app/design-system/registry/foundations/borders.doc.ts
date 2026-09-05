import { DocEntry } from '../../core/doc.model';

/* ============================================================================
   الأسس ← الحدود
   المصدر: _primitives.css § BORDER WIDTH + _semantic.css § BORDERS
   ============================================================================ */

export const BORDERS_DOC: DocEntry = {
  slug: 'borders',
  category: 'foundations',
  title: 'الحدود',
  titleEn: 'Borders',
  summary: 'ثلاثة عروض وخمسة ألوان دلالية، تفصل الأسطح بأقلّ ضجيج بصري ممكن.',
  status: 'stable',
  keywords: ['border', 'outline', 'حد', 'حدود', 'فاصل'],
  sections: [
    {
      kind: 'prose',
      body: [
        'الحدّ أضعف أدوات الفصل البصري وأكثرها تكلفة: كل خطّ يضيف ضجيجًا. القاعدة ' +
          'في هذا النظام أن الفصل يتمّ بالمسافة أولًا، وبالخلفية ثانيًا، وبالحدّ ' +
          'أخيرًا — ولا يُستخدم الحدّ إلا حين يحمل معنى لا تنقله المسافة.',
      ],
    },
    {
      kind: 'tokens',
      title: 'العروض والألوان',
      tokens: [
        '--ap-border-width-thin',
        '--ap-border-width-medium',
        '--ap-border-width-thick',
        '--ap-color-border-subtle',
        '--ap-color-border-default',
        '--ap-color-border-strong',
        '--ap-color-border-brand',
        '--ap-color-border-inverse',
      ],
    },
    {
      kind: 'table',
      title: 'اختيار العرض',
      headers: ['الـ Token', 'القيمة', 'متى'],
      rows: [
        ['--ap-border-width-thin', '1px', 'الافتراضي — البطاقة، الجدول، الحقل'],
        ['--ap-border-width-medium', '1.5px', 'مربّع الاختيار وزرّ الراديو، ليُقرآ في الحجم الصغير'],
        ['--ap-border-width-thick', '2px', 'مؤشّر التبويب النشط، الخيط الجانبي'],
      ],
    },
    {
      kind: 'table',
      title: 'اختيار اللون',
      headers: ['الـ Token', 'الدرجة', 'متى'],
      rows: [
        ['--ap-color-border-subtle', 'slate-200', 'الفصل الهيكلي — حافّة البطاقة، صفوف الجدول'],
        ['--ap-color-border-default', 'slate-300', 'حدّ الحقل في حالته الساكنة'],
        ['--ap-color-border-strong', 'slate-400', 'حدّ الحقل عند المرور، مربّع الاختيار'],
        ['--ap-color-border-brand', 'purple-700', 'الحقل المركَّز، العنصر المحدَّد'],
        ['--ap-color-border-inverse', 'slate-700', 'حدّ فوق سطح داكن'],
      ],
    },
    {
      kind: 'callout',
      tone: 'danger',
      title: 'حدّ عنصر التحكّم يخضع لمعيار تباين',
      body: [
        'حدّ الحقل ومربّع الاختيار عنصر واجهة لا زخرفة، فيلزمه 3:1 على الأقلّ مقابل ' +
          'ما حوله (WCAG 1.4.11). الحدّ ‎#ccc‎ الذي كان مستخدمًا يعطي 1.61:1 — أي أن ' +
          'حدود الحقول كانت غير مرئية عمليًا لضعاف البصر.',
        'ولذلك يميّز النظام الحقل بالتعبئة والحدّ معًا لا بالحدّ وحده: التعبئة ' +
          '‎bg-subtle‎ تحمل نصف عبء التمييز، فلا يحتاج الحدّ أن يكون ثقيلًا بصريًا.',
      ],
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'الحدّ منطقي لا فيزيائي',
      body: [
        'استخدم ‎border-inline-start‎ و‎border-block-end‎ لا ‎border-left‎ و‎border-bottom‎. ' +
          'الحدّ الفيزيائي ينقلب في الاتجاه الخاطئ عند تبديل اللغة، وهو من أكثر ' +
          'أعطال RTL شيوعًا لأنه لا يظهر في الاختبار بالعربية وحدها.',
      ],
    },
    {
      kind: 'do-dont',
      do: [
        'افصل بالمسافة أولًا. استخدم الحدّ حين يحمل معنى.',
        'استخدم ‎--ap-color-border-subtle‎ للحدود الهيكلية — أخفّ ما يُقرأ.',
        'استخدم الخصائص المنطقية دائمًا.',
      ],
      dont: [
        'لا تستخدم ‎<hr>‎ داخل المحتوى. البياض يؤدّي الوظيفة بلا ضجيج.',
        'لا تجمع حدًّا وظلًّا وخلفية مختلفة على العنصر نفسه — واحدة تكفي.',
        'لا تستخدم ‎--ap-color-border-subtle‎ لحدّ حقل: تباينه لا يبلغ 3:1.',
      ],
    },
  ],
};
