/* =============================================================================
   محمّل فاحص النظام — الجسر الوحيد بين Angular وشجرة React الخاصّة بالأداة.
   -----------------------------------------------------------------------------
   الاستيراد ديناميكي بالكامل عن قصد: React و`react-dom` وشيفرة الأداة تسقط
   جميعًا في حزمة كسولة لا يطلبها إلا هذا الملفّ، ولا يستدعيه إلا وضع التطوير —
   فلا يدفع الإنتاج بايتًا واحدًا مقابل أداة لا تصله.

   ⛔ لا تحوّل هذه الاستيرادات إلى استيراد ساكن في الأعلى «للوضوح». الوضوح هنا
      يساوي 130 كيلوبايت من React داخل الحزمة الأولى.
   ============================================================================ */

/** يُعيد دالّة تفكيك تُزيل الجذر والعقدة معًا. */
export async function mountSystemInspector(host: HTMLElement): Promise<() => void> {
  const [react, client, mod] = await Promise.all([
    import('react'),
    import('react-dom/client'),
    import('./vendor/ColorSystemInspector'),
  ]);

  const root = client.createRoot(host);
  root.render(react.createElement(mod.ColorSystemInspector));

  return () => {
    /*
      التفكيك مؤجَّل بـ`queueMicrotask`: استدعاء `unmount()` أثناء دورة كشف
      تغيّر Angular يقع داخل عرض React جارٍ، فيرمي React تحذير
      «synchronously unmounting while rendering». التأجيل يُخرجه من الدورة.
    */
    queueMicrotask(() => root.unmount());
  };
}
