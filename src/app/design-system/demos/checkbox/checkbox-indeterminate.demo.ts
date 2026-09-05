import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { ApCheckboxDirective, ApChoiceComponent, ApChoiceGroupComponent } from 'src/app/ui';

/* ============================================================================
   معاينة حيّة — الحالة الوسطى
   ----------------------------------------------------------------------------
   الثابت هو القالب نفسه — انظر التعليق في `button-variants.demo.ts`.

   المعاينة تفاعلية عمدًا: الحالة الوسطى لا تُفهم من صورة ساكنة. بدّل خيارًا
   واحدًا أدناه وراقب مربّع «تحديد الكلّ» — يتحوّل إلى شرطة، لا إلى مربّع
   فارغ ولا إلى محدَّد.
   ============================================================================ */

export const CHECKBOX_INDETERMINATE_SOURCE = `
<ap-choice label="تحديد كل الأقسام">
  <input
    apCheckbox
    [checked]="allChecked()"
    [indeterminate]="someChecked()"
    (change)="toggleAll($any($event.target).checked)"
  />
</ap-choice>

<ap-choice-group label="أقسام الدورة" [labelHidden]="true">
  @for (section of sections(); track section.id) {
    <ap-choice [label]="section.title">
      <input apCheckbox [checked]="section.selected" (change)="toggle(section.id)" />
    </ap-choice>
  }
</ap-choice-group>
`;

interface DemoSection {
  id: number;
  title: string;
  selected: boolean;
}

@Component({
  selector: 'demo-checkbox-indeterminate',
  standalone: true,
  imports: [ApChoiceComponent, ApChoiceGroupComponent, ApCheckboxDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    ':host { display: flex; flex-direction: column; gap: var(--ap-space-2); width: 100%; }',
    /* إزاحة الأبناء تُظهر التبعية بصريًا — منطقية فتنقلب مع الاتجاه. */
    ':host ap-choice-group { padding-inline-start: var(--ap-space-6); }',
  ],
  template: CHECKBOX_INDETERMINATE_SOURCE,
})
export class CheckboxIndeterminateDemo {
  protected readonly sections = signal<DemoSection[]>([
    { id: 1, title: 'مقدّمة الدورة', selected: true },
    { id: 2, title: 'أساسيات التسويق', selected: false },
    { id: 3, title: 'التطبيق العملي', selected: false },
  ]);

  protected readonly allChecked = () => this.sections().every(section => section.selected);

  /*
    الوسطى = بعضٌ لا كلّ. الشرط الثاني ضروري: بدونه يبقى المربّع في الحالة
    الوسطى حتى بعد تحديد الكلّ، لأن `indeterminate` تُغطّي `checked` بصريًا.
  */
  protected readonly someChecked = () =>
    this.sections().some(section => section.selected) && !this.allChecked();

  protected toggle(id: number): void {
    this.sections.update(sections =>
      sections.map(section =>
        section.id === id ? { ...section, selected: !section.selected } : section,
      ),
    );
  }

  protected toggleAll(selected: boolean): void {
    this.sections.update(sections => sections.map(section => ({ ...section, selected })));
  }
}
