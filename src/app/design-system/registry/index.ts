import { DocEntry } from '../core/doc.model';

import { COLORS_DOC } from './foundations/colors.doc';
import { TYPOGRAPHY_DOC } from './foundations/typography.doc';
import { SPACING_DOC } from './foundations/spacing.doc';
import { RADIUS_DOC } from './foundations/radius.doc';
import { BORDERS_DOC } from './foundations/borders.doc';
import { ELEVATION_DOC } from './foundations/elevation.doc';
import { SIZING_DOC } from './foundations/sizing.doc';
import { MOTION_DOC } from './foundations/motion.doc';
import { FOCUS_DOC } from './foundations/focus.doc';
import { BUTTON_DOC } from './components/button.doc';
import { INPUT_DOC } from './components/input.doc';
import { SELECT_DOC } from './components/select.doc';
import { CHECKBOX_DOC } from './components/checkbox.doc';
import { RADIO_DOC } from './components/radio.doc';
import { SWITCH_DOC } from './components/switch.doc';
import { PHONE_DOC } from './components/phone.doc';
import { MENU_DOC } from './components/menu.doc';
import { MODAL_DOC } from './components/modal.doc';
import { CONFIRM_DOC } from './components/confirm.doc';
import { TABLE_DOC } from './components/table.doc';
import { BADGE_DOC } from './components/badge.doc';
import { COLUMN_TOGGLE_DOC } from './components/column-toggle.doc';
import { AVATAR_DOC } from './components/avatar.doc';
import { TAB_NAV_DOC } from './components/tab-nav.doc';
import { BREADCRUMBS_DOC } from './components/breadcrumbs.doc';
import { PAGINATION_DOC } from './components/pagination.doc';
import { SEARCH_FIELD_DOC } from './components/search-field.doc';
import { UPLOAD_DOC } from './components/upload.doc';
import { PAGE_HEADER_DOC } from './components/page-header.doc';
import { APP_HEADER_DOC } from './components/app-header.doc';
import { SIDEBAR_DOC } from './components/sidebar.doc';
import { ILLUSTRATION_DOC } from './components/illustration.doc';
import { EMPTY_STATE_DOC } from './components/empty-state.doc';
import { TABLE_FILTER_DOC } from './patterns/table-filter.doc';
import { SEARCH_COPY_DOC } from './content/search-copy.doc';
import { DIALOG_COPY_DOC } from './content/dialog-copy.doc';

/* ============================================================================
   Acadimiat Design System Docs — السجلّ
   ----------------------------------------------------------------------------
   ⛔ هذا الملف قائمة تسجيل فقط. لا يحتوي على محتوى.

   ─── إضافة صفحة توثيق جديدة ────────────────────────────────────────────────
   1. أنشئ `registry/<category>/<slug>.doc.ts` يصدّر ثابتًا من نوع `DocEntry`.
   2. استورده هنا وأضفه إلى المصفوفة في موضعه الصحيح.

   يترتّب على ذلك تلقائيًا، بلا أي تعديل آخر:
     • مسار عامل على /design-system/<category>/<slug>
     • رابط في الشريط الجانبي داخل تصنيفه ومجموعته
     • بطاقة في صفحة فهرس التصنيف
     • احتساب المدخل في إحصاءات الصفحة الرئيسية
     • فهرس محتويات الصفحة
     • روابط «السابق / التالي» في الصفحات المجاورة

   ─── الترتيب ────────────────────────────────────────────────────────────────
   ترتيب المصفوفة هنا هو ترتيب العرض داخل كل تصنيف/مجموعة. التصنيفات نفسها
   مرتّبة في `core/docs-nav.config.ts`، لا هنا.

   ─── الحالة ────────────────────────────────────────────────────────────────
   المدخل بحالة `planned` لا يظهر في التنقّل ولا يُحتسب في الإحصاءات، لكن
   مساره يعمل. استخدمها للتوثيق قيد الكتابة بدل تركه خارج السجلّ.
   ============================================================================ */

export const DOCS_REGISTRY: readonly DocEntry[] = [
  /* ── الأسس ─────────────────────────────────────────────────────────────
     الترتيب من الأكثر أثرًا بصريًا إلى الأقلّ، ثم التركيز في الآخر لأنه
     يخصّ السلوك لا المظهر. */
  COLORS_DOC,
  TYPOGRAPHY_DOC,
  SPACING_DOC,
  SIZING_DOC,
  RADIUS_DOC,
  BORDERS_DOC,
  ELEVATION_DOC,
  MOTION_DOC,
  FOCUS_DOC,

  /* ── المكوّنات ───────────────────────────────────────────────────────
     عناصر النماذج بترتيب البناء: الحقل النصّي أساس البنية التي ترثها
     القائمة، ثم عناصر الاختيار الثلاثة بحاويها المشترك. */
  BUTTON_DOC,
  INPUT_DOC,
  SELECT_DOC,
  CHECKBOX_DOC,
  RADIO_DOC,
  SWITCH_DOC,
  PHONE_DOC,
  SEARCH_FIELD_DOC,
  UPLOAD_DOC,

  /* ── التنقّل ─────────────────────────────────────────────────────────── */
  BREADCRUMBS_DOC,
  TAB_NAV_DOC,
  PAGINATION_DOC,

  /* ── الطبقات العائمة ─────────────────────────────────────────────────── */
  MENU_DOC,
  MODAL_DOC,
  /* التأكيد بعد النافذة مباشرةً: هو نافذة مخصَّصة لحالة واحدة، ومن يقرأ عن
     الأولى يحتاج أن يجد الثانية بعدها لا في تصنيف آخر. */
  CONFIRM_DOC,

  /* ── عرض البيانات ─────────────────────────────────────────────────────
     الجدول أوّلًا لأنه المركَّب: الشارة والأفاتار وخليّة الوسائط عناصره،
     ومن يقرأ عنه يحتاج أن يجدها بعده مباشرةً. */
  TABLE_DOC,
  BADGE_DOC,
  COLUMN_TOGGLE_DOC,
  AVATAR_DOC,

  /* ── التخطيط ───────────────────────────────────────────────────────
     من الخارج إلى الداخل: الشريط العلوي يحيط بكل شاشة ولا يعرف أيّها
     مفتوحة، ثم رأس الصفحة داخل البطاقة وهو ما يتبدّل معها، ثم الحالة
     الفارغة — وهي ما يحلّ محلّ محتواها حين لا يكون فيه شيء. */
  APP_HEADER_DOC,
  SIDEBAR_DOC,
  PAGE_HEADER_DOC,
  ILLUSTRATION_DOC,
  EMPTY_STATE_DOC,

  /* ── الأنماط ─────────────────────────────────────────────────────────
     تركيبات من عدّة مكوّنات تحلّ مهمّة كاملة. لا مكوّن جديد فيها — ما
     تُوثّقه هو **العلاقة** بين مكوّنات قائمة، وهي ما لا تملكه صفحةُ أيٍّ
     منها وحدها. */
  TABLE_FILTER_DOC,

  /* ── دليل المحتوى ─────────────────────────────────────────────────────
     قواعد نصّية لا مكوّنات: ما يُكتب **داخل** المكوّن. والمالك الكامل
     لنصوص اللوحة هو مهارة `acadimiat-ux-writing`؛ هذه الصفحات تنقل منها
     ما يتكرّر في عدّة شاشات وتربطه بمواضعه. */
  SEARCH_COPY_DOC,
  DIALOG_COPY_DOC,
];
