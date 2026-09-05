import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * جذر التطبيق المستقلّ: منفذ توجيه واحد لا غير.
 *
 * لا شريط علوي هنا ولا شريط جانبي — يملكهما `DocsShellComponent` داخل
 * `/design-system`، فبقاء الجذر فارغًا يُبقي الغلاف قابلًا للتركيب في اللوحة
 * الأصلية كما هو، بلا فرق بين النسختين.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class AppComponent {}
