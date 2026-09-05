import { DocCategoryId, DocNavSection } from './doc.model';

/* ============================================================================
   Acadimiat Design System Docs — تكوين التنقّل
   ----------------------------------------------------------------------------
   ⛔ هذا هو الموضع الوحيد الذي تُعرَّف فيه أقسام التنقّل وترتيبها.
      لا تكتب قائمة أقسام في أي مكوّن. الشريط الجانبي والصفحة الرئيسية
      وصفحات الفهرس تقرأ من هنا حصرًا.

   إضافة قسم جديد = عنصر واحد في المصفوفة أدناه. إضافة مجموعة فرعية = عنصر
   في `groups`. لا شيء آخر يُعدَّل.

   المجموعات الفرعية للتنقّل فقط ولا تظهر في الـ URL:
     /design-system/components/button      ✅
     /design-system/components/actions/button  ❌ (مسار هشّ — يتغيّر بتغيّر
     التصنيف الداخلي، ويكسر الروابط المحفوظة)
   ============================================================================ */

export const DOCS_NAV_SECTIONS: readonly DocNavSection[] = [
  {
    id: 'foundations',
    title: 'الأسس',
    description: 'القرارات البصرية الخام: اللون، الطباعة، المسافة، الحركة.',
    icon: '◑',
    groups: [],
  },
  {
    id: 'components',
    title: 'المكوّنات',
    description: 'وحدات الواجهة القابلة لإعادة الاستخدام، بحالاتها وأحجامها.',
    icon: '▣',
    groups: [
      { id: 'actions', title: 'الأفعال' },
      { id: 'form-controls', title: 'عناصر النماذج' },
      { id: 'navigation', title: 'التنقّل' },
      { id: 'data-display', title: 'عرض البيانات' },
      { id: 'feedback', title: 'التغذية الراجعة' },
      { id: 'overlays', title: 'الطبقات العائمة' },
      { id: 'layout', title: 'التخطيط' },
    ],
  },
  {
    id: 'patterns',
    title: 'الأنماط',
    description: 'تركيبات متكرّرة من عدّة مكوّنات تحلّ مهمّة كاملة.',
    icon: '⟐',
    groups: [],
  },
  {
    id: 'content',
    title: 'دليل المحتوى',
    description: 'قواعد كتابة نصوص الواجهة العربية: الأزرار، الأخطاء، التأكيدات.',
    icon: '✎',
    groups: [],
  },
  {
    id: 'accessibility',
    title: 'إمكانية الوصول',
    description: 'التباين، التركيز، لوحة المفاتيح، قارئات الشاشة، RTL.',
    icon: '◎',
    groups: [],
  },
  {
    id: 'changelog',
    title: 'سجلّ التغييرات',
    description: 'ما تغيّر في النظام ومتى ولماذا.',
    icon: '⏱',
    groups: [],
  },
];

/** جذر الموقع. مستخدم في بناء كل مسار — لا تكتبه حرفيًا في أي مكان آخر. */
export const DOCS_ROOT = 'design-system';

/** للتحقّق من صحّة `:category` في الراوتر قبل محاولة عرض أي شيء. */
export const DOCS_CATEGORY_IDS: readonly DocCategoryId[] =
  DOCS_NAV_SECTIONS.map(section => section.id);

export function isDocCategoryId(value: string | null): value is DocCategoryId {
  return !!value && DOCS_CATEGORY_IDS.includes(value as DocCategoryId);
}
