import { Routes } from '@angular/router';

/**
 * مسارات التطبيق المستقلّ.
 *
 * الجذر يعيد التوجيه إلى `/design-system` ولا يخدم التوثيق مباشرة: كل روابط
 * الموقع الداخلية مبنيّة من `DOCS_ROOT` في `core/docs-nav.config.ts`، وتغيير
 * موضع التركيب هنا يكسرها جميعًا بلا خطأ ظاهر. تركيبها على المسار نفسه الذي
 * تستعمله اللوحة يجعل أي رابط منسوخ من هنا يعمل هناك، والعكس.
 */
export const APP_ROUTES: Routes = [
  {
    path: 'design-system',
    loadChildren: () =>
      import('./design-system/design-system.routes').then((m) => m.DESIGN_SYSTEM_ROUTES),
  },
  { path: '', pathMatch: 'full', redirectTo: 'design-system' },
  { path: '**', redirectTo: 'design-system' },
];
