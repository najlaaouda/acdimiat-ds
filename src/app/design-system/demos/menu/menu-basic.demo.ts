import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, signal } from '@angular/core';

import {
  ApButtonComponent,
  ApMenuComponent,
  ApMenuGroupLabelDirective,
  ApMenuOptionDirective,
} from 'src/app/ui';

/* ============================================================================
   معاينة حيّة — اللوحة المنسدلة بمحتوًى مختلف
   ----------------------------------------------------------------------------
   الثابت هو القالب نفسه — انظر التعليق في `button-variants.demo.ts`.

   ثلاث لوحات بالشكل نفسه حرفيًّا وبمحتويات مختلفة تمامًا: الأولى قائمة اختيار
   (`listbox` وخيارات لها حالة مختارة)، والثانية قائمة أوامر (`menu` وأزرار
   بلا حالة)، والثالثة قائمة أوامر **مقسَّمة** بعنواني مجموعة. ولا سطر أنماط
   في هذه المعاينة — الشكل كلّه من `<ap-menu>`.

   ⚠️ ولاحظ `{ read: ElementRef }` على `@ViewChild`: الزنّاد `<button apButton>`
      يستضيف مكوّنًا، والمتغيّر المرجعي على وسم يستضيف مكوّنًا يُحلّ إلى **نسخة
      المكوّن** لا إلى عنصره. وبدونها تصل `undefined` إلى الحساب فتُرسم اللوحة
      في ركن الشاشة — وهو عطلٌ صامت: التصريح بالنوع يمرّ في الترجمة.
   ============================================================================ */

export const MENU_BASIC_SOURCE = `
<div class="row">
  <div>
    <button
      #pick
      apButton
      variant="secondary"
      aria-haspopup="listbox"
      [attr.aria-expanded]="pickOpen()"
      (pointerdown)="onPickPointerDown()"
      (click)="onPickClick()"
    >
      {{ chosen() }}
    </button>

    <ap-menu [trigger]="pickEl()" [open]="pickOpen()" (openChange)="pickOpen.set($event)">
      <div role="listbox" aria-label="الحالة">
        @for (option of statuses; track option) {
          <div
            apMenuOption
            role="option"
            [attr.aria-selected]="option === chosen()"
            (click)="choose(option)"
          >{{ option }}</div>
        }
      </div>
    </ap-menu>
  </div>

  <div>
    <button
      #more
      apButton
      variant="tertiary"
      aria-haspopup="menu"
      [attr.aria-expanded]="moreOpen()"
      (pointerdown)="onMorePointerDown()"
      (click)="onMoreClick()"
    >
      إجراءات
    </button>

    <ap-menu
      [trigger]="moreEl()"
      [open]="moreOpen()"
      [matchTriggerWidth]="false"
      (openChange)="moreOpen.set($event)"
    >
      <div role="menu" aria-label="إجراءات الصفّ">
        <button apMenuOption type="button" role="menuitem" (click)="run('تعديل')">تعديل</button>
        <button apMenuOption type="button" role="menuitem" (click)="run('تكرار')">تكرار</button>
        <button apMenuOption type="button" role="menuitem" aria-disabled="true">تصدير</button>
        <button apMenuOption type="button" role="menuitem" (click)="run('حذف')">حذف</button>
      </div>
    </ap-menu>
  </div>

  <div>
    <button
      #grouped
      apButton
      variant="primary"
      aria-haspopup="menu"
      [attr.aria-expanded]="groupedOpen()"
      (pointerdown)="onGroupedPointerDown()"
      (click)="onGroupedClick()"
    >
      إضافة سريعة
    </button>

    <ap-menu
      [trigger]="groupedEl()"
      [open]="groupedOpen()"
      [matchTriggerWidth]="false"
      (openChange)="groupedOpen.set($event)"
    >
      <div role="menu" aria-label="إضافة سريعة">
        @for (group of groups; track group.label) {
          <div role="group" [attr.aria-label]="group.label">
            <p apMenuGroupLabel aria-hidden="true">{{ group.label }}</p>

            @for (item of group.items; track item) {
              <button apMenuOption type="button" role="menuitem" (click)="run(item)">
                {{ item }}
              </button>
            }
          </div>
        }
      </div>
    </ap-menu>
  </div>
</div>

@if (last()) {
  <p class="note">آخر إجراء: {{ last() }}</p>
}
`;

@Component({
  selector: 'demo-menu-basic',
  standalone: true,
  imports: [
    ApButtonComponent,
    ApMenuComponent,
    ApMenuGroupLabelDirective,
    ApMenuOptionDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    ':host { display: block; }',
    '.row { display: flex; align-items: center; gap: var(--ap-space-4); flex-wrap: wrap; }',
    '.note { margin: var(--ap-space-4) 0 0; color: var(--ap-color-text-tertiary);' +
      ' font-size: var(--ap-font-size-xs); }',
  ],
  template: MENU_BASIC_SOURCE,
})
export class MenuBasicDemo {
  protected readonly statuses = ['مفعّل', 'غير مفعّل', 'مسودّة'];

  /*
    مجموعتان لا واحدة: العنوان يظهر معناه حين يفصل — لوحةٌ بمجموعة واحدة
    معنونة تسأل «وما البقيّة؟» ولا جواب.
  */
  protected readonly groups = [
    { label: 'المنتجات', items: ['دورة جديدة', 'باقة جديدة'] },
    { label: 'المستخدمون', items: ['عميل جديد', 'مدرب جديد'] },
  ];

  protected readonly chosen = signal('مفعّل');
  protected readonly last = signal('');
  protected readonly pickOpen = signal(false);
  protected readonly moreOpen = signal(false);
  protected readonly groupedOpen = signal(false);

  /*
    ⚠️ `{ read: ElementRef }` شرطٌ لا تزيّد — انظر تعليق الرأس. والزنّادات الثلاثة
       هنا `<button apButton>` أي وسوم تستضيف مكوّنًا.
  */
  @ViewChild('pick', { read: ElementRef }) private pick?: ElementRef<HTMLElement>;
  @ViewChild('more', { read: ElementRef }) private more?: ElementRef<HTMLElement>;
  @ViewChild('grouped', { read: ElementRef }) private grouped?: ElementRef<HTMLElement>;

  /*
    ⚠️ إشارة تُكتب في معالج النقرة، لا getter يقرأ `@ViewChild` مباشرةً في
       القالب. الثاني يبدو أبسط ويرمي في وضع التطوير:
       `@ViewChild` يُحلّ **بعد** أوّل فحص للقالب، فتتغيّر قيمة الربط من
       `null` إلى العنصر داخل الدورة نفسها — وهو تعريف
       `ExpressionChangedAfterItHasBeenCheckedError`.

       والكتابة داخل معالج حدث تقع بين دورتين، فلا تعارض. وهو النمط الذي
       ينسخه المستهلك.
  */
  protected readonly pickEl = signal<HTMLElement | null>(null);
  protected readonly moreEl = signal<HTMLElement | null>(null);
  protected readonly groupedEl = signal<HTMLElement | null>(null);

  /*
    ⚠️ حالة الفتح تُلتقط عند `pointerdown` لا تُقلب عند `click`: لوحة
       `popover="auto"` تُغلق نفسها عند الضغط **خارجها**، والزنّاد خارجها.
       فقلبُ الحالة في `click` يقرأ حالةً قد تكون الضغطة صفّرتها للتوّ —
       فتُغلق اللوحة ثم تُفتح فورًا، وتبدو قائمةً لا تُغلق بالنقر على
       زنّادها. وهذا ما تفعله `<ap-column-toggle>` في اللوحة.
  */
  private wasPickOpen = false;
  private wasMoreOpen = false;
  private wasGroupedOpen = false;

  protected onPickPointerDown(): void {
    this.wasPickOpen = this.pickOpen();
  }

  protected onPickClick(): void {
    this.pickEl.set(this.pick?.nativeElement ?? null);
    if (this.wasPickOpen) {
      this.wasPickOpen = false;
      this.pickOpen.set(false);
      return;
    }
    this.pickOpen.set(true);
  }

  protected onMorePointerDown(): void {
    this.wasMoreOpen = this.moreOpen();
  }

  protected onMoreClick(): void {
    this.moreEl.set(this.more?.nativeElement ?? null);
    if (this.wasMoreOpen) {
      this.wasMoreOpen = false;
      this.moreOpen.set(false);
      return;
    }
    this.moreOpen.set(true);
  }

  protected onGroupedPointerDown(): void {
    this.wasGroupedOpen = this.groupedOpen();
  }

  protected onGroupedClick(): void {
    this.groupedEl.set(this.grouped?.nativeElement ?? null);
    if (this.wasGroupedOpen) {
      this.wasGroupedOpen = false;
      this.groupedOpen.set(false);
      return;
    }
    this.groupedOpen.set(true);
  }

  protected choose(option: string): void {
    this.chosen.set(option);
    this.pickOpen.set(false);
  }

  protected run(action: string): void {
    this.last.set(action);
    this.moreOpen.set(false);
    this.groupedOpen.set(false);
  }
}
