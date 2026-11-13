// =========================================================
// date.js — วันที่แบบ 'YYYY-MM-DD' ตาม "เวลาเครื่อง" (ไม่ใช้ UTC)
// ถ้าใช้ UTC วันจะเปลี่ยนตอน 7 โมงเช้าเวลาไทย → streak / รอบทบทวนจะเพี้ยน
// =========================================================

const pad = (n) => String(n).padStart(2, '0')

// Date → 'YYYY-MM-DD' (เวลาเครื่อง)
export function toDateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// วันนี้
export const todayKey = () => toDateKey(new Date())

// 'YYYY-MM-DD' + n วัน → 'YYYY-MM-DD'
export function addDays(dateKey, days) {
  const [y, m, d] = dateKey.split('-').map(Number)
  return toDateKey(new Date(y, m - 1, d + days))
}

// จำนวนวันระหว่าง 2 วัน (b − a)
export function daysBetween(a, b) {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  return Math.round((new Date(by, bm - 1, bd) - new Date(ay, am - 1, ad)) / 86_400_000)
}

// วันจันทร์ของสัปดาห์ที่มีวันนั้น ('YYYY-MM-DD') — ใช้เป็นรหัสสัปดาห์ (Streak Freeze ได้ใหม่ทุกวันจันทร์)
export function weekStartKey(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number)
  const offset = (new Date(y, m - 1, d).getDay() + 6) % 7 // จันทร์ = 0 … อาทิตย์ = 6
  return addDays(dateKey, -offset)
}

// แสดงวันที่ให้คนอ่าน เช่น "วันจันทร์ที่ 16 พฤศจิกายน" / "Monday, November 16"
export function formatDateKey(dateKey, language = 'th') {
  const [y, m, d] = dateKey.split('-').map(Number)
  const locale = language === 'th' ? 'th-TH' : 'en-US'
  return new Date(y, m - 1, d).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })
}
