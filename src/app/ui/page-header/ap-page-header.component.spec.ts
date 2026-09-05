import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ApPageHeaderComponent } from './ap-page-header.component';

/* ============================================================================
   `<ap-page-header>` — الإسقاط في منفذ الأفعال
   ----------------------------------------------------------------------------
   الاختبار الوحيد المهمّ هنا ليس أن الرأس يُنشأ، بل **أين تهبط الأزرار**.

   منفذ الأفعال محدّده `[apPageHeaderActions]`. وحين يكون الزرّ داخل كتلة
   `@if` فالمُطابَق هو مرساة الكتلة لا الزرّ، فيسقط في المنفذ الافتراضي — أي
   **داخل جملة الوصف** — بلا أي خطأ في التصريف ولا في وقت التشغيل. والعلاج
   `ngProjectAs` على حاوٍ يلفّ الكتلة، وهو ما تفعله `users.component.html`.

   الحالتان معًا هنا كي يبقى الفرق موثّقًا بسلوك لا بتعليق.
   ============================================================================ */

@Component({
  standalone: true,
  imports: [ApPageHeaderComponent],
  template: `
    <ap-page-header heading="المستخدمون" description="إدارة العملاء.">
      <ng-container ngProjectAs="[apPageHeaderActions]">
        @if (showAdd) {
          <button type="button" id="add">إضافة مستخدم</button>
        }
        <button type="button" id="email">إرسال بريد</button>
      </ng-container>
    </ap-page-header>
  `,
})
class ProjectedHost {
  showAdd = true;
}

describe('ApPageHeaderComponent — منفذ الأفعال', () => {
  it('يُسقط الأزرار في غلاف الأفعال، ولو كان أوّلها داخل @if', async () => {
    await TestBed.configureTestingModule({ imports: [ProjectedHost] }).compileComponents();

    const fixture = TestBed.createComponent(ProjectedHost);
    fixture.detectChanges();

    const actions: HTMLElement = fixture.nativeElement.querySelector('.ap-page-header__actions');
    expect(actions).withContext('غلاف الأفعال موجود').toBeTruthy();

    expect(actions.querySelector('#add')).withContext('زرّ الإضافة داخل غلاف الأفعال').toBeTruthy();
    expect(actions.querySelector('#email')).withContext('زرّ البريد داخل غلاف الأفعال').toBeTruthy();

    /* ولا يتسرّب أيّهما إلى جملة الوصف — وهو ما يقع بلا `ngProjectAs`. */
    const description: HTMLElement = fixture.nativeElement.querySelector(
      '.ap-page-header__description',
    );
    expect(description.querySelector('button')).withContext('لا زرّ داخل الوصف').toBeNull();
  });

  it('يخفي زرّ الإضافة وحده حين يسقط شرطه، ويُبقي البقيّة في مكانها', async () => {
    await TestBed.configureTestingModule({ imports: [ProjectedHost] }).compileComponents();

    const fixture = TestBed.createComponent(ProjectedHost);
    fixture.componentInstance.showAdd = false;
    fixture.detectChanges();

    const actions: HTMLElement = fixture.nativeElement.querySelector('.ap-page-header__actions');
    expect(actions.querySelector('#add')).toBeNull();
    expect(actions.querySelector('#email')).toBeTruthy();
  });
});
