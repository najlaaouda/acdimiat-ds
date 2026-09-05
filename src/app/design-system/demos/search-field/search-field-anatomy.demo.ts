import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { ApFieldComponent, ApSearchFieldComponent, ApSearchOption } from 'src/app/ui';

/* ============================================================================
   معاينة حيّة — البحث بالإكمال التلقائي
   ----------------------------------------------------------------------------
   الثابت هو القالب نفسه — انظر التعليق في `button-variants.demo.ts`.

   اكتب حرفًا واحدًا وسترى النتائج فورًا: لا زرّ بحث، ولا حدّ أدنى لعدد
   الأحرف. وجرّبها بلوحة المفاتيح — سهم الأسفل ينقل التمييز والكتابة تستمرّ
   في مكانها، وEnter يختار، وEsc يغلق اللوحة ثم يمسح النصّ في ضغطة ثانية.

   والحقل داخل `<ap-field>`: هو ما يولّد الـ id ويربط الـ label. الـ label
   مخفيّ بصريًا هنا لأن شريط الأدوات لا يتّسع له — ومخفيّ لا محذوف.

   ⚠️ والنصّان يتبعان قاعدة /design-system/content/search-copy حرفيًّا، لأن
      هذه المعاينة تُقرأ قالبًا يُنسَخ: التسمية «البحث في [الكيان]» جمعًا،
      وplaceholder «البحث بـ[الحقول] [الكيان]» مفردًا وبلا «…».
   ============================================================================ */

export const SEARCH_FIELD_ANATOMY_SOURCE = `
<ap-field label="البحث في المتدرّبين" [labelHidden]="true">
  <ap-search-field
    placeholder="البحث باسم أو بريد المتدرّب"
    [options]="results()"
    (queryChange)="search($event)"
    (optionSelected)="picked.set($event.label)"
  />
</ap-field>

@if (picked()) {
  <p class="demo-note">اختير: {{ picked() }}</p>
}
`;

interface Person {
  id: number;
  name: string;
  email: string;
}

const PEOPLE: Person[] = [
  { id: 1, name: 'نجلاء العتيبي', email: 'najlaa@example.com' },
  { id: 2, name: 'محمد الدوسري', email: 'mohammed@example.com' },
  { id: 3, name: 'سارة المطيري', email: 'sara@example.com' },
  { id: 4, name: 'عبدالله القحطاني', email: 'abdullah@example.com' },
  { id: 5, name: 'ريم الشمري', email: 'reem@example.com' },
  { id: 6, name: 'خالد الحربي', email: 'khaled@example.com' },
];

@Component({
  selector: 'demo-search-field-anatomy',
  standalone: true,
  imports: [ApFieldComponent, ApSearchFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    ':host { display: block; max-width: 420px; }',
    '.demo-note { margin-block-start: var(--ap-space-3); color: var(--ap-color-text-secondary); font-size: var(--ap-font-size-md); }',
  ],
  template: SEARCH_FIELD_ANATOMY_SOURCE,
})
export class SearchFieldAnatomyDemo {
  protected readonly results = signal<ApSearchOption[]>([]);
  protected readonly picked = signal('');

  protected search(query: string): void {
    const q = query.trim().toLowerCase();
    this.results.set(
      !q
        ? []
        : PEOPLE.filter(
            p => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q),
          ).map(p => ({ value: p.id, label: p.name, hint: p.email })),
    );
  }
}
