// =========================================================
// contentLoad.js — จำ promise ของเนื้อหาที่แยกไฟล์โหลด (บทเรียนราย Stage / วลี / บทสนทนา) ให้ React use() ใช้
// - ขอซ้ำ → ได้ promise ตัวเดิมเสมอ รวมถึงตัวที่ "ล้มเหลวแล้ว"
//   ⚠️ ห้ามลบตัวที่ล้มเหลวทันที: React จะวาดใหม่ → ขอใหม่ → ได้ promise ใหม่ → รอใหม่ วนไม่จบ
//      (เคยยิงขอไฟล์ ~350 ครั้ง/วินาทีและค้างที่ "กำลังโหลด…")
// - ErrorBoundary แสดงข้อความแล้ว → forgetFailedLoads() → เปลี่ยนหน้าแล้วกลับมา (หรือโหลดหน้าใหม่) จึงลองใหม่ได้
// =========================================================

// โหลดไฟล์เนื้อหาไม่ได้ (เน็ตหลุด / ไฟล์ของเวอร์ชันเก่าถูกลบหลังอัปเดตเว็บ) → ErrorBoundary บอกให้เช็กเน็ต
export class ContentLoadError extends Error {
  constructor(cause) {
    super('content-load-failed', { cause })
    this.name = 'ContentLoadError'
  }
}

const failed = new Set() // ฟังก์ชันลืมตัวที่ล้มเหลวแต่ละตัว

/**
 * @param cache Map ของชนิดนั้น
 * @param start () => Promise  เริ่มโหลด (เรียกเมื่อยังไม่มีในที่จำเท่านั้น)
 */
export function loadOnce(cache, key, start) {
  if (!cache.has(key)) {
    const promise = start().catch((error) => {
      throw error instanceof ContentLoadError ? error : new ContentLoadError(error)
    })
    cache.set(key, promise)
    promise.catch(() =>
      failed.add(() => {
        if (cache.get(key) === promise) cache.delete(key)
      }),
    )
  }
  return cache.get(key)
}

// ลืมทุกตัวที่ล้มเหลว → ขอครั้งหน้าโหลดใหม่
export function forgetFailedLoads() {
  for (const forget of failed) forget()
  failed.clear()
}
