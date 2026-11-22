// =========================================================
// speaking.js — ตัวนับ "นาทีที่พูดภาษาอังกฤษ" (ส่วนที่ 8.4, ขั้นที่ 18)
// - นับจากช่วงที่ตรวจพบเสียงพูดจริงตอนใช้ไมค์ (recognition.js วัดเวลา speechstart → speechend)
//   ระบบไม่บอกช่วงพูด (เช่น ตัวจำลองไมค์) → ประมาณจากจำนวนคำที่ได้ยิน (ESTIMATE_MS_PER_WORD ต่อคำ)
// - เก็บใน et-progress.speakingMinutes { 'YYYY-MM-DD': นาที (ทศนิยม) } ย้อนหลังไม่เกิน KEEP_DAYS วัน
// (ฟังก์ชันล้วน → ทดสอบได้)
// =========================================================
import { addDays } from './date'

export const ESTIMATE_MS_PER_WORD = 400 // คนพูดราว 2.5 คำ/วินาที
export const MAX_SPEECH_MS = 30000 // 1 ครั้งที่กดไมค์นับได้ไม่เกินนี้ (กันค่าผิดปกติ)
export const KEEP_DAYS = 60

/**
 * เวลาพูดจริงของการฟัง 1 ครั้ง (ms)
 * @param speechStart / speechEnd  เวลาที่ระบบรับเสียงแจ้งว่าเริ่ม/หยุดพูด (ไม่มี = null)
 * @param transcript ข้อความที่ได้ยิน (ใช้ประมาณถ้าไม่มีเวลาจากระบบ)
 * @param now เวลาตอนจบการฟัง
 */
export function speechDurationMs({ speechStart = null, speechEnd = null, transcript = '', now = Date.now() }) {
  let ms = 0
  if (speechStart !== null) ms = (speechEnd ?? now) - speechStart
  if (!(ms > 0)) ms = String(transcript).trim().split(/\s+/).filter(Boolean).length * ESTIMATE_MS_PER_WORD
  return Math.max(0, Math.min(MAX_SPEECH_MS, Math.round(ms)))
}

/**
 * เพิ่มเวลาพูดของวันนี้
 * @returns { minutes: map ใหม่ (ตัดวันที่เก่ากว่า KEEP_DAYS), wholeMinutes: จำนวน "นาทีเต็ม" ที่เพิ่งครบ (ใช้กับภารกิจ) }
 */
export function addSpeaking(minutes = {}, today, ms) {
  if (!(ms > 0)) return { minutes, wholeMinutes: 0 }
  const before = minutes[today] ?? 0
  const after = Math.round((before + ms / 60000) * 1000) / 1000
  const oldest = addDays(today, -(KEEP_DAYS - 1))
  const next = Object.fromEntries(Object.entries(minutes).filter(([date]) => date >= oldest))
  next[today] = after
  return { minutes: next, wholeMinutes: Math.floor(after) - Math.floor(before) }
}

// นาที → ข้อความสั้น (ไม่ถึง 10 นาทีแสดงทศนิยม 1 ตำแหน่ง: 0.3, 2.5 / ตั้งแต่ 10 ปัดเป็นจำนวนเต็ม)
export const formatMinutes = (value) => (value >= 10 ? String(Math.round(value)) : String(Math.round(value * 10) / 10))

// นาทีที่พูดย้อนหลัง N วัน (เก่า → ใหม่) — ใช้วาดกราฟรายสัปดาห์
export function lastDays(minutes = {}, today, count = 7) {
  return Array.from({ length: count }, (_, index) => {
    const date = addDays(today, index - (count - 1))
    return { date, minutes: minutes[date] ?? 0 }
  })
}
