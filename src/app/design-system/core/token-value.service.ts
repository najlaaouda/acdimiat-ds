import { Injectable } from '@angular/core';

/* ============================================================================
   Acadimiat Design System Docs — قراءة القيم الفعلية
   ----------------------------------------------------------------------------
   ⛔ هذه الخدمة هي سبب وجود موقع التوثيق أصلًا.

   القيمة المعروضة تُقرأ من المتصفّح وقت العرض عبر `getComputedStyle`، لا
   تُنسخ يدويًا في ملف بيانات. النتيجة: **لا يمكن للتوثيق أن يكذب.** لو
   تغيّرت قيمة في `_primitives.css` ونُسي التوثيق، تغيّر المعروض معها.

   ⚠️ اقرأ من عنصر داخل `.ap-docs` لا من `documentElement`:
      الطبقتان الدلالية والمكوّنية معرَّفتان تحت `.ap-admin, .ap-docs`، فهي
      **غير موجودة** على `:root`. القراءة من `documentElement` تُرجع سلسلة
      فارغة لكل token دلالي — وهو فشل صامت يبدو كأن الـ tokens غير معرَّفة.

   ⚠️ متصفّح فقط. المتصل مسؤول عن استدعائها داخل `afterNextRender`.
   ============================================================================ */

/** نتيجة فحص تباين واحدة. */
export interface ContrastResult {
  ratio: number;
  /** يمرّ AA للنص العادي (4.5:1). */
  aa: boolean;
  /** يمرّ AA للنص الكبير وعناصر الواجهة (3:1). */
  aaLarge: boolean;
  /** يمرّ AAA للنص العادي (7:1). */
  aaa: boolean;
}

@Injectable({ providedIn: 'root' })
export class TokenValueService {
  /**
   * لوحة 1×1 تُعاد استخدامها لتطبيع أي صيغة لون.
   *
   * لماذا canvas بدل تحليل النصّ يدويًا: القيمة المحسوبة قد تعود بأي صيغة
   * يدعمها المتصفّح — `rgb()` أو `oklch()` أو `color-mix()` أو اسمًا مسمّى.
   * كتابة parser لكل ذلك عمل كثير يتقادم مع كل صيغة CSS جديدة. المتصفّح
   * يملك المحلّل الصحيح أصلًا؛ نطلب منه الرسم ونقرأ البكسل.
   */
  private canvas?: CanvasRenderingContext2D | null;

  /** يقرأ عدّة tokens دفعة واحدة من سياق العنصر المعطى. */
  resolve(host: Element, names: readonly string[]): Map<string, string> {
    const styles = getComputedStyle(host);
    const values = new Map<string, string>();

    for (const name of names) {
      values.set(name, styles.getPropertyValue(name).trim());
    }

    return values;
  }

  /** يقرأ token واحدًا. سلسلة فارغة تعني «غير معرَّف في هذا السياق». */
  resolveOne(host: Element, name: string): string {
    return getComputedStyle(host).getPropertyValue(name).trim();
  }

  /**
   * يحوّل أي قيمة لون CSS إلى قنوات RGBA.
   * يُرجع `null` لقيمة ليست لونًا — وهو ما يميّز `12px` عن `#fff`.
   */
  toRgba(value: string): [number, number, number, number] | null {
    const context = this.context();
    if (!context || !value) {
      return null;
    }

    /*
      الرسم فوق شفاف تمامًا بعد مسح اللوحة: لو كانت القيمة غير صالحة كلون،
      يرفض المتصفّح تعيين `fillStyle` ويبقى على قيمته السابقة — فنكتشف ذلك
      بمقارنة ما بعد التعيين بما قبله بدل قبول لون خاطئ بصمت.
    */
    const sentinel = '#000000';
    context.fillStyle = sentinel;
    context.fillStyle = value;
    const accepted = context.fillStyle;

    if (accepted === sentinel && !isBlackLiteral(value)) {
      return null;
    }

    context.clearRect(0, 0, 1, 1);
    context.fillRect(0, 0, 1, 1);

    const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
    return [r, g, b, a / 255];
  }

  /**
   * نسبة التباين بصيغة WCAG 2.1 بين لونين.
   * يُرجع `null` إن لم يكن أحدهما لونًا صالحًا.
   */
  contrast(foreground: string, background: string): ContrastResult | null {
    const fg = this.toRgba(foreground);
    const bg = this.toRgba(background);

    if (!fg || !bg) {
      return null;
    }

    /*
      اللون شبه الشفاف يُدمج فوق الخلفية أولًا. بدون هذا الدمج تُحسب حلقة
      التركيز (وهي `rgb(... / 0.35)`) كأنها معتمة، فيخرج رقم تباين لا علاقة
      له بما يراه المستخدم فعلًا.
    */
    const blended = blend(fg, bg);

    const l1 = relativeLuminance(blended);
    const l2 = relativeLuminance(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const rounded = Math.round(ratio * 100) / 100;

    return {
      ratio: rounded,
      aa: rounded >= 4.5,
      aaLarge: rounded >= 3,
      aaa: rounded >= 7,
    };
  }

  private context(): CanvasRenderingContext2D | null {
    if (this.canvas !== undefined) {
      return this.canvas;
    }

    if (typeof document === 'undefined') {
      this.canvas = null;
      return null;
    }

    const element = document.createElement('canvas');
    element.width = 1;
    element.height = 1;
    /* `willReadFrequently` يتجنّب ترحيل اللوحة إلى GPU ثم قراءتها ذهابًا
       وإيابًا — وهو النمط الذي نفعله بالضبط: رسم وقراءة لكل token. */
    this.canvas = element.getContext('2d', { willReadFrequently: true });
    return this.canvas;
  }
}

function isBlackLiteral(value: string): boolean {
  const v = value.trim().toLowerCase();
  return v === '#000' || v === '#000000' || v === 'black' || v === 'rgb(0, 0, 0)';
}

function blend(
  [r, g, b, a]: [number, number, number, number],
  [br, bg, bb]: [number, number, number, number],
): [number, number, number, number] {
  if (a >= 1) {
    return [r, g, b, 1];
  }
  return [
    Math.round(r * a + br * (1 - a)),
    Math.round(g * a + bg * (1 - a)),
    Math.round(b * a + bb * (1 - a)),
    1,
  ];
}

function relativeLuminance([r, g, b]: [number, number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map(channel => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}
