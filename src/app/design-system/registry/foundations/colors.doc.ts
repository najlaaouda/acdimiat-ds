import { DocEntry } from '../../core/doc.model';

/* ============================================================================
   الأسس ← الألوان
   ----------------------------------------------------------------------------
   كل رقم في هذه الصفحة منقول حرفيًا من `src/styles/tokens/_primitives.css`
   و `_semantic.css`. لا قيمة مذكورة هنا غير موجودة في الكود.

   رقائق اللون وأرقام التباين في أقسام `tokens` أدناه محسوبة في المتصفّح
   وقت العرض، لا منسوخة هنا. الجداول النصّية تشرح القرار، والأقسام البصرية
   تعرض الحقيقة.
   ============================================================================ */

export const COLORS_DOC: DocEntry = {
  slug: 'colors',
  category: 'foundations',
  title: 'الألوان',
  titleEn: 'Colors',
  summary:
    'ستّة سلالم لونية بتباعد إدراكي متساوٍ، مربوطة بأدوار دلالية مقيسة التباين.',
  status: 'stable',
  keywords: ['color', 'palette', 'contrast', 'تباين', 'لون', 'ألوان'],
  sections: [
    {
      kind: 'prose',
      body: [
        'نظام اللون في Acadimiat مبنيّ على ثلاث طبقات لا تُختصر: سلالم خام (Primitives) ' +
          'لا معنى لها، وأدوار دلالية (Semantic) تحمل المعنى، وقيم مربوطة بمكوّن (Component). ' +
          'المكوّن لا يرى السلّم الخام أبدًا — يرى الدور فقط.',
        'الفائدة العملية من هذا الفصل: إعادة تلوين النظام كاملًا لاحقًا (ثيم داكن، هوية ' +
          'أكاديمية مخصّصة) تعني إعادة تعريف الطبقة الدلالية وحدها، بلا لمس أي مكوّن.',
      ],
    },
    {
      kind: 'callout',
      tone: 'info',
      title: 'من أين جاءت هذه السلالم',
      body: [
        'لم تُخترع. كل سلّم مُولَّد بتباعد إدراكي متساوٍ في فضاء OKLab، ومثبَّت على لون ' +
          'موجود فعلًا في المشروع — الدرجة المثبَّتة معلَّمة بـ ANCHOR في ملف الـ primitives. ' +
          'بنفسجي العلامة ‎--ap-purple-700 = #702ea4‎ هو اللون الأصلي ‎--p-primary-color‎ نفسه.',
      ],
    },
    {
      kind: 'table',
      title: 'السلالم الستّة',
      headers: ['السلّم', 'المرساة', 'القيمة', 'الدور', 'ملاحظة'],
      rows: [
        ['Purple', '--ap-purple-700', '#702ea4', 'العلامة والأفعال الأساسية', 'تباين 8.03:1 على أبيض'],
        ['Slate', '--ap-slate-900', '#0f172a', 'النص والأسطح والحدود', 'سلّم Tailwind slate — ~700 استخدام مطابق'],
        ['Red', '--ap-red-600', '#dc2626', 'الخطأ والأفعال المدمِّرة', '4.83:1 — يقبل نصًا أبيض'],
        ['Teal', '--ap-teal-600', '#0d9488', 'النجاح', 'التعبئة بنص أبيض تستخدم الدرجة 700 لا 600'],
        ['Amber', '--ap-amber-500', '#f59e0b', 'التحذير', 'لا يقبل نصًا أبيض إطلاقًا'],
        ['Blue', '--ap-blue-600', '#0d6efd', 'المعلومة والروابط', 'نص الروابط يستخدم الدرجة 700 (6.34:1)'],
      ],
      caption: 'كل سلّم 11 درجة (50 → 950). أرقام التباين مقيسة على خلفية بيضاء بصيغة WCAG 2.1.',
    },
    {
      kind: 'prose',
      title: 'الأدوار الدلالية',
      body: [
        'الطبقة الدلالية معرَّفة تحت النطاق ‎.ap-admin, .ap-docs‎ لا في ‎:root‎. ' +
          'هذا متعمّد: الموقع العام لكل أكاديمية له هوية خضراء قابلة للتخصيص، وحصر ' +
          'الطبقة الدلالية داخل نطاق يمنع تسرّب هوية لوحة الإدارة البنفسجية إليه.',
      ],
    },
    {
      kind: 'list',
      title: 'مجموعات الأدوار',
      items: [
        'الأسطح — ‎bg-page‎ · ‎bg-surface‎ · ‎bg-subtle‎ · ‎bg-muted‎ · ‎bg-hover‎ · ‎bg-selected‎ · ‎bg-inverse‎ · ‎bg-overlay‎',
        'النص — ‎text-primary‎ · ‎text-secondary‎ · ‎text-tertiary‎ · ‎text-disabled‎ · ‎text-inverse‎ · ‎text-link‎ · ‎text-brand‎ · ‎text-placeholder‎',
        'الحدود — ‎border-subtle‎ · ‎border-default‎ · ‎border-strong‎ · ‎border-brand‎ · ‎border-inverse‎',
        'الأفعال — ‎action-primary‎ · ‎action-secondary‎ · ‎action-tertiary‎ · ‎action-danger‎ · ‎action-neutral‎، ولكلٍّ ‎-hover‎ و‎-active‎ ولون النص فوقه',
        'الحالات — ‎success‎ · ‎error‎ · ‎warning‎ · ‎info‎، ولكلٍّ أربعة: التعبئة والنص والخلفية الفاتحة والحدّ',
        'التركيز — ‎focus-ring‎ · ‎focus-ring-danger‎ · ‎focus-ring-inverse‎ مع العرض والإزاحة',
        'الرسوم البيانية — ‎chart-1‎ حتى ‎chart-6‎ + ‎chart-positive/negative/neutral‎ + الشبكة والمحور',
      ],
    },
    {
      kind: 'callout',
      tone: 'warning',
      title: 'الأزواج المقيسة لا تُخلَط',
      body: [
        'كل زوج (خلفية + نص) في مجموعة الحالات مقيس ويمرّ AA كوحدة واحدة. ' +
          'استخدام ‎--ap-color-warning‎ كخلفية مع نص أبيض يسقط التباين — لا يوجد كهرماني ' +
          'في النظام يقبل نصًا أبيض. التحذير إمّا بادج فاتح (‎warning-bg‎ + ‎warning-text‎ = 9.09:1) ' +
          'أو تعبئة ‎warning‎ بنص داكن.',
      ],
    },
    {
      kind: 'do-dont',
      title: 'قواعد الاستخدام',
      do: [
        'استهلك الدور الدلالي: ‎var(--ap-color-text-secondary)‎.',
        'استخدم ‎--ap-color-text-tertiary‎ للنص الثانوي بحجم 14px فأكبر (4.76:1).',
        'ميّز سلاسل الرسوم البيانية بالدرجة اللونية عبر ‎--ap-chart-1..6‎.',
        'اقرن اللون دائمًا بإشارة ثانية (أيقونة، نصّ، سهم) عند نقل معنى.',
      ],
      dont: [
        'لا تستهلك سلّمًا خامًا مباشرة في مكوّن: ‎var(--ap-purple-700)‎.',
        'لا تستخدم ‎--ap-color-text-disabled‎ (2.56:1) لأي نص غير معطَّل.',
        'لا تميّز سلاسل الرسوم البيانية بدرجات شفافية من لون واحد — الفرق بين 80% و60% ≈ 1.3:1.',
        'لا تكتب قيمة hex خام في أي ملف مكوّن. المقياس آليّ عبر ‎npm run audit:tokens‎.',
      ],
    },
    {
      kind: 'tokens',
      title: 'السلالم الخام (Primitives)',
      tokens: [
        '--ap-purple-50',
        '--ap-purple-100',
        '--ap-purple-200',
        '--ap-purple-300',
        '--ap-purple-400',
        '--ap-purple-500',
        '--ap-purple-600',
        '--ap-purple-700',
        '--ap-purple-800',
        '--ap-purple-900',
        '--ap-purple-950',
        '--ap-slate-75',
        '--ap-slate-50',
        '--ap-slate-100',
        '--ap-slate-200',
        '--ap-slate-300',
        '--ap-slate-400',
        '--ap-slate-500',
        '--ap-slate-600',
        '--ap-slate-700',
        '--ap-slate-800',
        '--ap-slate-900',
        '--ap-slate-950',
        '--ap-red-50',
        '--ap-red-100',
        '--ap-red-200',
        '--ap-red-300',
        '--ap-red-400',
        '--ap-red-500',
        '--ap-red-600',
        '--ap-red-700',
        '--ap-red-800',
        '--ap-red-900',
        '--ap-red-950',
        '--ap-teal-50',
        '--ap-teal-100',
        '--ap-teal-200',
        '--ap-teal-300',
        '--ap-teal-400',
        '--ap-teal-500',
        '--ap-teal-600',
        '--ap-teal-700',
        '--ap-teal-800',
        '--ap-teal-900',
        '--ap-teal-950',
        '--ap-amber-50',
        '--ap-amber-100',
        '--ap-amber-200',
        '--ap-amber-300',
        '--ap-amber-400',
        '--ap-amber-500',
        '--ap-amber-600',
        '--ap-amber-700',
        '--ap-amber-800',
        '--ap-amber-900',
        '--ap-amber-950',
        '--ap-blue-50',
        '--ap-blue-100',
        '--ap-blue-200',
        '--ap-blue-300',
        '--ap-blue-400',
        '--ap-blue-500',
        '--ap-blue-600',
        '--ap-blue-700',
        '--ap-blue-800',
        '--ap-blue-900',
        '--ap-blue-950',
      ],
    },
    {
      kind: 'tokens',
      title: 'الأدوار الدلالية (Semantic)',
      tokens: [
        '--ap-color-bg-page',
        '--ap-color-bg-surface',
        '--ap-color-bg-subtle',
        '--ap-color-bg-muted',
        '--ap-color-bg-hover',
        '--ap-color-bg-selected',
        '--ap-color-bg-inverse',
        '--ap-color-text-primary',
        '--ap-color-text-secondary',
        '--ap-color-text-tertiary',
        '--ap-color-text-disabled',
        '--ap-color-text-link',
        '--ap-color-text-brand',
        '--ap-color-text-placeholder',
        '--ap-color-border-subtle',
        '--ap-color-border-default',
        '--ap-color-border-strong',
        '--ap-color-border-brand',
        '--ap-color-action-primary',
        '--ap-color-action-primary-hover',
        '--ap-color-action-primary-active',
        '--ap-color-action-primary-subtle',
        '--ap-color-action-secondary',
        '--ap-color-action-secondary-border',
        '--ap-color-action-danger',
        '--ap-color-action-danger-hover',
        '--ap-color-action-neutral',
        '--ap-color-success',
        '--ap-color-success-text',
        '--ap-color-success-bg',
        '--ap-color-success-border',
        '--ap-color-error',
        '--ap-color-error-text',
        '--ap-color-error-bg',
        '--ap-color-error-border',
        '--ap-color-warning',
        '--ap-color-warning-text',
        '--ap-color-warning-bg',
        '--ap-color-warning-border',
        '--ap-color-info',
        '--ap-color-info-text',
        '--ap-color-info-bg',
        '--ap-color-info-border',
      ],
    },
    {
      kind: 'tokens',
      title: 'ألوان الرسوم البيانية',
      tokens: [
        '--ap-chart-1',
        '--ap-chart-2',
        '--ap-chart-3',
        '--ap-chart-4',
        '--ap-chart-5',
        '--ap-chart-6',
        '--ap-chart-positive',
        '--ap-chart-negative',
        '--ap-chart-neutral',
      ],
    },
    {
      kind: 'prose',
      title: 'الوضع الداكن',
      body: [
        'غير مبنيّ. الإعلان ‎darkMode: "class"‎ موجود في ‎tailwind.config.js‎ بصفر تنفيذ. ' +
          'بنية الطبقات الثلاث تجعله ممكنًا لاحقًا بإعادة تعريف الطبقة الدلالية وحدها، ' +
          'لكنه ليس جزءًا من النظام اليوم ولا يُوثَّق كأنه كذلك.',
      ],
    },
  ],
};
