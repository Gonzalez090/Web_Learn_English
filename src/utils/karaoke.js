// =========================================================
// karaoke.js — จังหวะของเกม Shadow Karaoke (ส่วนที่ 8.2): ประโยควิ่งแบบคาราโอเกะ พูดให้ทัน
// - แบ่งเวลาของประโยคให้แต่ละคำ ตามจำนวนพยางค์ (คำยาวใช้เวลานานกว่า) + หยุดสั้น ๆ หลังเครื่องหมาย
// - รอบของผู้เรียนให้เวลามากกว่าเสียงต้นแบบ (ผู้เริ่มต้นพูดช้ากว่าเจ้าของภาษา)
// (ฟังก์ชันล้วน → ทดสอบได้)
// =========================================================
import { tokenize } from './compareWords'

export const KARAOKE = {
  countdown: 3, // นับถอยหลัง 3-2-1 ก่อนเริ่มพูด (ไมค์เริ่มฟังตั้งแต่นับ → ทันตั้งแต่คำแรก)
  beatMs: 650, // เวลาต่อการนับ 1 ครั้ง
  graceMs: 1100, // แถบวิ่งจบแล้ว รอเสียงพูดคำสุดท้ายอีกนิดก่อนหยุดฟัง
  resultMs: 2600, // โชว์ผลแต่ละรอบ ก่อนไปรอบถัดไป
  leadInRatio: 0.06, // ไฟล์เสียงมีช่วงเงียบสั้น ๆ ก่อนเริ่มพูด
}

// คำในประโยคตามที่แสดง (ตรงกับคำที่ compareSpeech ให้คะแนน → ระบายสีผลรายคำได้ตรงตำแหน่ง)
export const karaokeWords = (text) => tokenize(text).map((unit) => unit.display)

// ประมาณจำนวนพยางค์ของคำอังกฤษ (นับกลุ่มสระ, e ท้ายคำไม่ออกเสียง) — อย่างน้อย 1
export function syllableCount(word) {
  const letters = String(word ?? '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')
  if (!letters) return 1
  const trimmed = letters.length > 2 ? letters.replace(/e$/, '') : letters
  return Math.max(1, trimmed.match(/[aeiouy]+/g)?.length ?? 1)
}

/**
 * แบ่งเวลาให้แต่ละคำ
 * @param text     ประโยค
 * @param totalMs  เวลาทั้งประโยค (ms)
 * @returns [{ text, start, end }] เวลาเป็น ms นับจากเริ่มประโยค (เรียงต่อกัน ไม่ทับกัน)
 */
export function karaokeTimings(text, totalMs, { leadInRatio = KARAOKE.leadInRatio } = {}) {
  const words = karaokeWords(text)
  if (words.length === 0 || !(totalMs > 0)) return []
  const weights = words.map(
    (word, index) => syllableCount(word) + (index < words.length - 1 && /[,.!?;:…]$/.test(word) ? 0.6 : 0),
  )
  const sum = weights.reduce((total, weight) => total + weight, 0)
  const lead = totalMs * leadInRatio
  const usable = totalMs - lead
  let cursor = lead
  return words.map((word, index) => {
    const start = cursor
    cursor += (usable * weights[index]) / sum
    return { text: word, start: Math.round(start), end: Math.round(cursor) }
  })
}

// เวลาของรอบผู้เรียน: ช้ากว่าเสียงต้นแบบครึ่งเท่า + เผื่อเริ่มช้า (อย่างน้อย 2 วินาที)
export const singDurationMs = (modelMs) => Math.max(2000, Math.round((modelMs || 0) * 1.5 + 500))

// ฟังนานสุดเท่าไร (กันไมค์ค้าง) = นับถอยหลัง + แถบวิ่ง + เวลารอคำสุดท้าย + เผื่อ
export const maxListenMsFor = (singMs) => KARAOKE.countdown * KARAOKE.beatMs + singMs + KARAOKE.graceMs + 2000

// ณ เวลา elapsed (ms) แถบวิ่งถึงคำที่เท่าไร (-1 = ยังไม่เริ่ม, timings.length = จบแล้ว)
export function activeWordAt(timings, elapsed) {
  if (!timings.length || elapsed < timings[0].start) return -1
  const index = timings.findIndex((timing) => elapsed < timing.end)
  return index === -1 ? timings.length : index
}
