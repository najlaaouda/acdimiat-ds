import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ApIllustrationComponent } from 'src/app/ui';

/* ============================================================================
   معاينة حيّة — رسومات النظام
   ----------------------------------------------------------------------------
   الثابت هو القالب نفسه — انظر التعليق في `button-variants.demo.ts`.

   المجموعة كاملة هنا عمدًا: هي **مغلقة**، ورؤيتها كلّها دفعةً واحدة هي ما
   يجعل الاختيار اختيارًا بين موجودٍ لا بحثًا عن اسم. والاسم تحت كل رسمة هو
   ما يُكتب في `name` حرفيًّا.

   ⚠️ ولا تُكتب هنا رسمة بلا اسم تحتها: الصفحة نفسها هي مرجع الأسماء، ورسمةٌ
      مجهولة الاسم تُقرأ زينةً لا خيارًا.
   ============================================================================ */

export const ILLUSTRATION_GALLERY_SOURCE = `
<figure><ap-illustration name="no-data" /><figcaption>no-data</figcaption></figure>
<figure><ap-illustration name="no-results" /><figcaption>no-results</figcaption></figure>
<figure><ap-illustration name="no-content" /><figcaption>no-content</figcaption></figure>
<figure><ap-illustration name="no-files" /><figcaption>no-files</figcaption></figure>
<figure><ap-illustration name="no-messages" /><figcaption>no-messages</figcaption></figure>
<figure><ap-illustration name="no-notifications" /><figcaption>no-notifications</figcaption></figure>
<figure><ap-illustration name="no-analytics" /><figcaption>no-analytics</figcaption></figure>
<figure><ap-illustration name="no-versions" /><figcaption>no-versions</figcaption></figure>
<figure><ap-illustration name="no-templates" /><figcaption>no-templates</figcaption></figure>
<figure><ap-illustration name="nothing-selected" /><figcaption>nothing-selected</figcaption></figure>
<figure><ap-illustration name="not-found" /><figcaption>not-found</figcaption></figure>
<figure><ap-illustration name="plan-locked" /><figcaption>plan-locked</figcaption></figure>
`;

@Component({
  selector: 'docs-illustration-gallery-demo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ApIllustrationComponent],
  template: ILLUSTRATION_GALLERY_SOURCE,
  styles: [
    `
      :host {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: var(--ap-space-6);
        justify-items: center;
      }

      figure {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--ap-space-2);
        margin: 0;
      }

      /* الاسم لاتينيّ داخل صفحة عربية — يحتاج اتجاهه أو يُقرأ معكوسًا. */
      figcaption {
        direction: ltr;
        color: var(--ap-color-text-tertiary);
        font-size: var(--ap-font-size-xs);
      }
    `,
  ],
})
export class IllustrationGalleryDemoComponent {}
