// =========================================================
// display.js — ตัดสินว่าการ์ด/บทเรียนจะแสดงอะไร ตาม Stage + การตั้งค่าของผู้ใช้
// (ฟังก์ชันล้วน → ทดสอบง่าย)
// =========================================================

/**
 * ข้อความภาษาอังกฤษบนการ์ด ตาม stage.showText
 * @returns {'hidden' | 'toggle' | 'shown'}
 *   hidden = Stage 1–3 ห้ามแสดงตัวอักษร
 *   toggle = Stage 4 ซ่อนไว้ กดดูได้
 *   shown  = Stage 5 ขึ้นไป แสดงเลย
 */
export function englishTextMode(showText) {
  if (showText === 'never') return 'hidden'
  if (showText === 'toggle') return 'toggle'
  return 'shown'
}

/**
 * แสดงคำอ่านไทยหรือไม่
 * - Stage ที่ห้ามแสดงตัวอักษร (1–3) → ไม่แสดงเสมอ เพราะคำอ่านไทยก็บอกคำตอบได้
 * - ตั้งค่า 'on' / 'off' → ตามที่ผู้ใช้เลือก
 * - ตั้งค่า 'auto' (ค่าเริ่มต้น) → ซ่อนใน Stage 1–5, แสดงใน Stage 6–7
 */
export function showThaiReading(setting, stage) {
  if (stage.showText === 'never') return false
  if (setting === 'on') return true
  if (setting === 'off') return false
  return stage.id >= 6
}

// คำแปลไทยเปิดไว้ตั้งแต่แรกหรือไม่ ('hidden' = ซ่อนไว้ กดดูได้, 'shown' = แสดงเลย)
export const meaningStartsVisible = (setting) => setting === 'shown'

// คำที่ใช้เทียบ: ตัวเล็ก ตัดเครื่องหมายหัว-ท้าย (เก็บ ' ไว้)
const bareWord = (word) =>
  String(word ?? '')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, '')

/**
 * แยกประโยคเป็นคำ แล้วบอกว่าคำไหนลงเสียงหนัก (ส่วนที่ 2.3: stress)
 * @param text        "No, I don't like it."
 * @param stressWords ["No", "don't", "like"] (ไม่สนตัวพิมพ์/เครื่องหมาย)
 * @returns [{ text: 'No,', stressed: true }, { text: 'I', stressed: false }, ...]
 */
export function markStress(text, stressWords = []) {
  const stressed = new Set((stressWords ?? []).map(bareWord))
  return String(text ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => ({ text: word, stressed: stressed.has(bareWord(word)) }))
}
