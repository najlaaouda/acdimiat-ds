import { ApplicationConfig } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { provideApPhoneSvgFlags } from './ui';

import { APP_ROUTES } from './app.routes';

export const APP_CONFIG: ApplicationConfig = {
  providers: [
    /*
      أعلام حقل رقم الجوال — مجموعة flag-icons المربّعة (1x1)، تُنسَخ إلى
      assets/flags من angular.json لا من src/assets، فتتحدّث مع التبعية.

      والمربّعة لا 4x3: الشارة صندوق دائري، وobject-fit: cover على ملفّ عريض
      يقتطع نحو ثلث العلم من طرفيه فيُقرأ علمَ دولة أخرى أحيانًا.

      ⚠️ ولا كاشف دولة هنا (AP_PHONE_COUNTRY_DETECTOR) عمدًا: لا خادم في هذا
         الموقع ولا HttpClient، فتبقى الحقول على السعودية. أمّا لوحة أكاديميات
         فتحقن تنفيذًا يقرأ IpApiService. وذلك هو الفرق كلّه بين المكانين:
         ثغرة حقن واحدة تُملأ هناك وتُترك هنا، لا فرع داخل المكوّن.
    */
    provideApPhoneSvgFlags(),
    provideRouter(
      APP_ROUTES,
      /*
        `anchorScrolling` هو ما يجعل روابط جدول المحتويات تصل فعلًا إلى قسمها:
        المرساة مشتقّة من موضع القسم لا من عنوانه (`core/doc-anchor.ts`)،
        وبدون هذا الخيار يتجاهل الراوتر الجزء بعد `#` كلّيًّا.
      */
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
    ),
  ],
};
