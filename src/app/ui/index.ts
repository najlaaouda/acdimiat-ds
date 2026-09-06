/* ============================================================================
   Acadimiat UI — مكتبة مكوّنات نظام التصميم
   ----------------------------------------------------------------------------
   مكوّنات standalone تستهلك طبقة `--ap-*` حصرًا.

   ⚠️ هذه ليست `shared/ui/`. تلك المكتبة القديمة (`<app-button>` وغيره) تخدم
      الموقع العام وتحمل ألوانه الخضراء المحلية. هذه المكتبة هي تجسيد نظام
      التصميم، ومستهلكها الأول موقع التوثيق.

   ─── قاعدة الحاوي ─────────────────────────────────────────────────────────
   عناصر النماذج لا تُستخدم عارية. لكل منها حاوٍ يملك الـ label والرسائل
   والربط الدلالي:

       <ap-field>        الحقل النصّي (`apInput`) والقائمتان (`apSelect` و`<ap-select>`)
                         ورافع الصور (`<ap-upload>`)
       <ap-choice>       مربّع الاختيار والراديو والمفتاح
       <ap-choice-group> عنوان واحد فوق عدّة خيارات (`<fieldset>`)

   وتقف `<ap-modal>` خارج هذه القاعدة: هي **بنية** لا عنصر تحكّم — رأس وجسم
   وذيل حول `<dialog>` أصلي. انظر تعليق ملفها.

   ويستضيف `<ap-field>` كذلك المكوّنات **المركّبة** — `<ap-phone-field>`:
   عنصرا تحكّم داخل حدّ واحد، يعلنان `affixed` فيأخذان معاملة الصفّ الملاصق.

   وهو ليس اصطلاحًا بل قيدًا تنفيذيًا: أنماط الموجّهات تعيش في أوراق
   حاوياتها، فلا يعمل أي منها خارج حاويه.

   التوثيق: /design-system/components
   ============================================================================ */

export { ApButtonComponent } from './button/ap-button.component';
export type { ApButtonSize, ApButtonVariant } from './button/ap-button.component';

export { ApFieldComponent } from './field/ap-field.component';
export { ApFieldControl } from './field/ap-field-control';
export { ApInputDirective } from './field/ap-input.directive';
export {
  ApFieldLabelIconDirective,
  ApFieldPrefixDirective,
  ApFieldSuffixDirective,
} from './field/ap-field-affix.directive';
export type { ApFieldKind } from './field/ap-field-kind';

export { ApSelectDirective } from './select/ap-select.directive';
export { ApSelectComponent } from './select/ap-select.component';
export type { ApSelectOption } from './select/ap-select.component';

export { ApPhoneFieldComponent } from './phone/ap-phone-field.component';
export {
  AP_PHONE_FLAG_SOURCE,
  emojiFlagSource,
  provideApPhoneSvgFlags,
  svgFlagSource,
} from './phone/ap-phone-flag';
export {
  AP_PHONE_COUNTRY_DETECTOR,
  ApPhoneCountryDetector,
} from './phone/ap-phone-country-detector';
export type { ApPhoneFlag, ApPhoneFlagSource } from './phone/ap-phone-flag';
export { getApPhoneCountries } from './phone/phone-country.data';
export type { ApPhoneCountry } from './phone/phone-country.data';

export { ApChoiceComponent } from './choice/ap-choice.component';
export type { ApChoiceLayout } from './choice/ap-choice.component';
export { ApChoiceGroupComponent } from './choice/ap-choice-group.component';
export { ApChoiceControl } from './choice/ap-choice-control';
export type { ApChoiceAppearance } from './choice/ap-choice-control';
export { ApCheckboxDirective } from './choice/ap-checkbox.directive';
export { ApRadioDirective } from './choice/ap-radio.directive';
export { ApSwitchDirective } from './choice/ap-switch.directive';

export { ApMenuComponent } from './menu/ap-menu.component';
export { ApMenuOptionDirective } from './menu/ap-menu-option.directive';
export { ApMenuGroupLabelDirective } from './menu/ap-menu-group-label.directive';

export { ApModalComponent } from './modal/ap-modal.component';
export type { ApModalCloseReason, ApModalSize } from './modal/ap-modal.component';

export { ApConfirmComponent } from './confirm/ap-confirm.component';
export type { ApConfirmRefusal, ApConfirmTone } from './confirm/ap-confirm.component';

export { ApTableComponent } from './table/ap-table.component';
export type { ApTableDensity } from './table/ap-table.component';
export { ApTableSortComponent } from './table/ap-table-sort.component';
export { ApColumnToggleComponent } from './table/ap-column-toggle.component';
export type { ApColumnDef } from './table/ap-column-toggle.component';
export { ApTruncateWordsPipe } from './text/ap-truncate-words.pipe';
export { truncateWords } from './text/truncate-words';
export type { ApSortChange, ApSortDirection } from './table/ap-table-sort.component';

export { ApBadgeComponent } from './badge/ap-badge.component';
export type { ApBadgeSize, ApBadgeVariant } from './badge/ap-badge.component';

export { ApAvatarComponent } from './avatar/ap-avatar.component';
export type { ApAvatarShape, ApAvatarSize } from './avatar/ap-avatar.component';
export { ApMediaCellComponent } from './avatar/ap-media-cell.component';

export { ApTabNavComponent } from './tab-nav/ap-tab-nav.component';
export type { ApTabNavAppearance, ApTabNavOrientation } from './tab-nav/ap-tab-nav.component';
export { ApTabNavLinkDirective } from './tab-nav/ap-tab-nav-link.directive';

export { ApBreadcrumbsComponent } from './breadcrumbs/ap-breadcrumbs.component';
export type { ApBreadcrumbItem } from './breadcrumbs/ap-breadcrumbs.component';

export { ApPaginationComponent } from './pagination/ap-pagination.component';
export type { ApPaginateEvent } from './pagination/ap-pagination.component';

export { ApSearchFieldComponent } from './search-field/ap-search-field.component';
export type { ApSearchOption } from './search-field/ap-search-field.component';

export { ApPageHeaderComponent } from './page-header/ap-page-header.component';

export { ApAppHeaderComponent } from './app-header/ap-app-header.component';

export { ApIllustrationComponent } from './illustration/ap-illustration.component';
export type {
  ApIllustrationName,
  ApIllustrationSize,
} from './illustration/ap-illustration.component';

export { ApEmptyStateComponent } from './empty-state/ap-empty-state.component';
export type {
  ApEmptyStateAppearance,
  ApEmptyStateHeadingLevel,
  ApEmptyStateSize,
} from './empty-state/ap-empty-state.component';

export { ApUploadComponent } from './upload/ap-upload.component';
export type { ApUploadFile, ApUploadSize } from './upload/ap-upload.component';
export { formatFileSize } from './upload/file-size';
