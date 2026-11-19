/** A detail tab whose data source ships in a later milestone. */
export function MemberPlaceholderTab({ title, milestone }: { title: string; milestone: string }) {
  return (
    <section className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50/60 p-8 text-center">
      <h2 className="text-sm font-semibold text-neutral-800">{title}</h2>
      <p className="mt-2 text-sm text-neutral-600">
        ส่วนนี้จะเปิดใช้งานเมื่อพัฒนา {milestone} เสร็จ ข้อมูลจะถูกดึงจาก backend ตามปกติ
      </p>
    </section>
  );
}
