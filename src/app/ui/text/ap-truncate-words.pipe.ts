import { Pipe, PipeTransform } from '@angular/core';

import { truncateWords } from './truncate-words';

/* ============================================================================
   Acadimiat UI — أنبوب الاقتطاع بالكلمات
   ----------------------------------------------------------------------------
   القاعدة نفسها في `truncate-words.ts` — هذا غلافها للقوالب.

   ─── متى يُستعمل هذا بدل `<ap-media-cell [maxWords]>` ──────────────────────
   خليّة الوسائط هي الأصل في عمود «الاسم»، وهي تقصّ وتُبقي النصّ الكامل في
   الـ DOM لقارئ الشاشة. لكن عنوانها `<span>` لا `<a>` — فحين يكون الاسم
   **قابلًا للنقر** لا تصلح، وهذا الأنبوب هو البديل.

   ⚠️ ومعه يبقى على المستهلك ما تفعله خليّة الوسائط تلقائيًا: `title` للفأرة
      و`aria-label` (أو نصّ مخفي) لقارئ الشاشة، بالنصّ **الكامل**. الأنبوب
      يقصّ المعروض ولا يعرف شيئًا عن العنصر الذي يعرضه.

   ⚠️ وهو `pure` (الافتراضي): دالّة على قيمة، بلا حالة ولا لمس للـ DOM —
      فيُعاد حسابه عند تغيّر البيانات. والموجّه القديم `appSliceInnerText`
      كان يكتب فوق `innerText` في `ngAfterViewInit` مرّةً واحدة: يمحو النصّ
      الأصلي من الـ DOM، ولا يرى صفحةً ثانية من الترقيم.
   ============================================================================ */

@Pipe({
  name: 'apTruncateWords',
  standalone: true,
})
export class ApTruncateWordsPipe implements PipeTransform {
  transform(value: string | null | undefined, maxWords: number): string {
    return truncateWords(value, maxWords);
  }
}
