import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';

import { ContrastResult, TokenValueService } from '../core/token-value.service';
import {
  ColorRole,
  TOKEN_TYPE_ORDER,
  TokenType,
  inferColorRole,
  inferTokenType,
} from '../core/token-type';

/* ============================================================================
   Acadimiat Design System Docs — مُصيّر الـ Tokens
   ----------------------------------------------------------------------------
   القاعدة الذهبية هنا: **كل معاينة تستهلك الـ token عبر `var()` مباشرةً.**

   صندوق نصف القطر يكتب `border-radius: var(--ap-radius-lg)`، لا `12px`.
   شريط المسافة يكتب `width: var(--ap-space-6)`. رقاقة اللون تكتب
   `background: var(--ap-color-action-primary)`.

   النتيجة: المعاينة والحقيقة شيء واحد بالتعريف — لا نسخة عنها. لو تغيّرت
   قيمة في `_primitives.css` تغيّرت المعاينة معها في اللحظة نفسها، بلا أي
   تعديل في التوثيق.

   والقيمة النصّية المعروضة بجانبها تُقرأ من `getComputedStyle` وقت العرض
   لا من ملف بيانات — فلا موضع في هذه الصفحة يمكن أن يتقادم.
   ============================================================================ */

interface TokenRow {
  name: string;
  type: TokenType;
  /** القيمة المحسوبة. فارغة قبل الترطيب أو إن كان الـ token غير معرَّف. */
  value: string;
  /** للألوان فقط. اتجاه القياس يتبع دور اللون. */
  contrast: ContrastResult | null;
  role: ColorRole | null;
  /** للخلفيات: أي نصّ يقرأ عليها — 'dark' أو 'light'. */
  onColor: 'dark' | 'light' | null;
  /** للمسافات والأبعاد: النسبة إلى أكبر قيمة في المجموعة، لمقياس بصري مشترك. */
  scale: number;
}

interface TokenGroup {
  type: TokenType;
  label: string;
  rows: TokenRow[];
}

@Component({
  selector: 'app-doc-tokens',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './doc-tokens.component.html',
})
export class DocTokensComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly tokenValues = inject(TokenValueService);

  private readonly names$ = signal<readonly string[]>([]);
  private readonly resolved$ = signal<ReadonlyMap<string, string>>(new Map());
  private readonly contrast$ = signal<ReadonlyMap<string, ContrastResult>>(new Map());
  private readonly onColor$ = signal<ReadonlyMap<string, 'dark' | 'light'>>(new Map());

  @Input({ required: true })
  set tokens(value: readonly string[]) {
    this.names$.set(value ?? []);
    /* المكوّن لا يُعاد إنشاؤه بين صفحتين، فالقيم تُقرأ ثانيةً عند تبدّل المدخل. */
    this.queueRead();
  }

  constructor() {
    /*
      `afterNextRender` لا `ngOnInit`: القراءة تحتاج عنصرًا حيًّا في الشجرة
      داخل `.ap-docs` كي تُحلّ الـ tokens الدلالية، وهي لا تعمل على الخادم.
      قبل الترطيب يُصيَّر الصفّ باسمه وشرطة مكان القيمة.
    */
    afterNextRender(() => this.read());
  }

  protected readonly groups = computed<TokenGroup[]>(() => {
    const resolved = this.resolved$();
    const contrast = this.contrast$();
    const onColorMap = this.onColor$();

    const rows: TokenRow[] = this.names$().map(name => ({
      name,
      type: inferTokenType(name),
      value: resolved.get(name) ?? '',
      contrast: contrast.get(name) ?? null,
      role: inferTokenType(name) === 'color' ? inferColorRole(name) : null,
      onColor: onColorMap.get(name) ?? null,
      scale: 0,
    }));

    return TOKEN_TYPE_ORDER
      .map(({ type, label }) => ({
        type,
        label,
        rows: withSharedScale(rows.filter(row => row.type === type)),
      }))
      .filter(group => group.rows.length > 0);
  });

  /** يُعرض عند وجود أي token عجز التصنيف عنه — إشارة إلى خلل في التسمية. */
  protected readonly hasUnclassified = computed(() =>
    this.groups().some(group => group.type === 'unknown'),
  );

  protected copy(name: string): void {
    void navigator.clipboard?.writeText(`var(${name})`);
  }

  private queueRead(): void {
    if (typeof queueMicrotask === 'function' && this.host.nativeElement.isConnected) {
      queueMicrotask(() => this.read());
    }
  }

  private read(): void {
    const element = this.host.nativeElement;
    if (!element.isConnected) {
      return;
    }

    const names = this.names$();
    const resolved = this.tokenValues.resolve(element, names);
    this.resolved$.set(resolved);

    /*
      التباين يُقاس مقابل سطح البطاقة الفعلي المقروء من السياق نفسه — لا
      مقابل أبيض مفترض. لو أعيد ثيم النظام لاحقًا تتبع الأرقام السطح الجديد
      تلقائيًا.
    */
    const surface = this.tokenValues.resolveOne(element, '--ap-color-bg-surface');
    const bodyText = this.tokenValues.resolveOne(element, '--ap-color-text-primary');
    const inverseText = this.tokenValues.resolveOne(element, '--ap-color-text-inverse');
    const contrast = new Map<string, ContrastResult>();
    const onColor = new Map<string, 'dark' | 'light'>();

    for (const name of names) {
      if (inferTokenType(name) !== 'color') {
        continue;
      }

      const value = resolved.get(name) ?? '';

      if (inferColorRole(name) === 'foreground') {
        /* لون نصّ: كيف يُقرأ **هو** على سطح البطاقة. */
        const result = this.tokenValues.contrast(value, surface);
        if (result) {
          contrast.set(name, result);
        }
        continue;
      }

      /*
        لون خلفية: السؤال العملي ليس «هل يمرّ؟» بل **أيّ نصّ يُقرأ فوقه؟**

        قياسه مقابل نصّ داكن وحده يُنتج حكمًا خاطئًا على كل تعبئة داكنة:
        ‎--ap-button-primary-bg‎ (بنفسجي) يعطي 2.22:1 مع نصّ داكن فيبدو
        ساقطًا، بينما زوجه الحقيقي نصّ أبيض بتباين 8.03:1. نقيس الاتجاهين
        ونعرض الأصلح مع التصريح بأيّهما.
      */
      const onDark = this.tokenValues.contrast(bodyText, value);
      const onLight = this.tokenValues.contrast(inverseText, value);

      if (onDark && onLight) {
        const darkWins = onDark.ratio >= onLight.ratio;
        contrast.set(name, darkWins ? onDark : onLight);
        onColor.set(name, darkWins ? 'dark' : 'light');
      } else if (onDark) {
        contrast.set(name, onDark);
        onColor.set(name, 'dark');
      }
    }

    this.contrast$.set(contrast);
    this.onColor$.set(onColor);
  }
}

/**
 * مقياس بصري مشترك داخل المجموعة.
 *
 * القيمة الحقيقية لجدول المسافات ليست قراءة كل رقم منفردًا — بل **مقارنة
 * الأطوال ببعضها**. شريط بطول نسبيّ إلى أكبر قيمة في المجموعة ينقل السلّم
 * في نظرة واحدة، وهو ما لا يفعله عمود أرقام.
 */
function withSharedScale(rows: TokenRow[]): TokenRow[] {
  const numeric = rows
    .map(row => parseFloat(row.value))
    .filter(value => Number.isFinite(value) && value > 0);

  if (!numeric.length) {
    return rows;
  }

  const max = Math.max(...numeric);
  return rows.map(row => {
    const value = parseFloat(row.value);
    return {
      ...row,
      scale: Number.isFinite(value) && max > 0 ? Math.max(value / max, 0) : 0,
    };
  });
}
