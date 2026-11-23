// =========================================================
// appUpdate.js — เปิดเว็บค้างไว้แล้วมีเวอร์ชันใหม่ขึ้น: ไฟล์หน้า/เนื้อหาของเวอร์ชันเก่าถูกลบ → โหลดไม่ได้ตลอด
//   โหลดไฟล์ไม่สำเร็จ → ขอ index.html ล่าสุดมาเทียบชื่อไฟล์หลัก (มี hash) → ต่างจากที่เปิดอยู่ = มีเวอร์ชันใหม่
//   → โหลดหน้าใหม่ให้เองครั้งเดียว / ไม่ต่าง (เน็ตสะดุด) หรือขอไม่ได้ (ออฟไลน์) → ไม่ทำอะไร ErrorBoundary แสดงข้อความ
//   (ไม่โหลดหน้าใหม่มั่ว ๆ ตอนเน็ตหลุด — จะกลายเป็นหน้าว่างของเบราว์เซอร์)
// =========================================================
const ENTRY = /<script\b[^>]*\bsrc="(\/assets\/[^"]+\.js)"/i
const RELOADED_KEY = 'et-reloaded'
const CHECK_TIMEOUT_MS = 5000 // ตอบช้ากว่านี้ = ไม่เช็กแล้ว
const RELOAD_GAP_MS = 60000 // โหลดใหม่เองได้ไม่เกิน 1 ครั้งต่อนาที (กันวน ถ้าได้ index.html เก่าจากที่จำ)

// ชื่อไฟล์หลักใน index.html (ไม่ใช่หน้าเว็บของเรา เช่น หน้าล็อกอิน Wi-Fi = null)
export const entryOf = (html) => String(html ?? '').match(ENTRY)?.[1] ?? null

// มีเวอร์ชันใหม่ไหม
export function isNewVersion(html, currentEntry) {
  const latest = entryOf(html)
  return Boolean(latest && currentEntry && latest !== currentEntry)
}

// ไฟล์หลักของหน้าที่เปิดอยู่ (ตอนพัฒนาไม่มี = null → ไม่ทำงาน)
function currentEntry() {
  const script = document.querySelector('script[type="module"][src^="/assets/"]')
  return script?.getAttribute('src') ?? null
}

// กันโหลดใหม่ซ้ำ ๆ — เบราว์เซอร์ไม่ให้ใช้ sessionStorage → ไม่โหลดใหม่เอง (ปลอดภัยไว้ก่อน)
function claimReload() {
  try {
    const last = Number(sessionStorage.getItem(RELOADED_KEY) ?? 0)
    if (Date.now() - last < RELOAD_GAP_MS) return false
    sessionStorage.setItem(RELOADED_KEY, String(Date.now()))
    return true
  } catch {
    return false
  }
}

/**
 * @param stillNeeded () => boolean  ยังค้างอยู่ที่หน้าข้อผิดพลาดเดิมไหม (ตรวจหลังได้คำตอบ — เน็ตช้า ผู้ใช้อาจกลับไปทำบท/อัดเสียงแล้ว
 *   ห้ามโหลดหน้าใหม่ทับงานที่ค้าง)
 * @returns true ถ้ากำลังโหลดหน้าใหม่
 */
export async function reloadIfUpdated(stillNeeded) {
  const entry = currentEntry()
  if (!entry) return false
  try {
    const response = await fetch('/index.html', { cache: 'no-store', signal: AbortSignal.timeout(CHECK_TIMEOUT_MS) })
    if (!response.ok || !isNewVersion(await response.text(), entry)) return false
  } catch {
    return false // ออฟไลน์ / ตอบช้าเกินไป
  }
  if (!stillNeeded() || !claimReload()) return false
  window.location.reload()
  return true
}
