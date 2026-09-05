import { ApplicationConfig } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { APP_ROUTES } from './app.routes';

export const APP_CONFIG: ApplicationConfig = {
  providers: [
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
