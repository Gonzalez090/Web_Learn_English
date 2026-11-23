// =========================================================
// studyTime.js — เวลาเรียนต่อวัน + คำแนะนำ "วันนี้พอหรือยัง" + ชวนพัก (ฟังก์ชันล้วน → ทดสอบได้)
// - นับเฉพาะหน้าที่เรียนจริง (isStudyPath) ตอนหน้าเว็บเปิดอยู่และยังมีการแตะ/พิมพ์ (hooks/useStudyTimer.js)
// - เก็บใน et-progress.studyMinutes { 'YYYY-MM-DD': นาที (ทศนิยม) } 60 วัน (เพิ่มด้วย addSpeaking ของ speaking.js)
// - เป็นคำแนะนำเท่านั้น ไม่ล็อก ไม่บังคับหยุด
// =========================================================

export const TICK_MS = 15_000 // นับทีละ 15 วินาที
export const IDLE_MS = 120_000 // ไม่แตะจอ/พิมพ์นานกว่านี้ = ไม่ได้เรียนอยู่ (เผื่อช่วงฟังบทยาว / คาราโอเกะที่ไม่ต้องแตะ)
export const BREAK_AFTER_MS = 20 * 60_000 // เรียนต่อเนื่องครบนี้ → ชวนพัก
export const BREAK_GAP_MS = 5 * 60_000 // หยุดเกินนี้ = พักแล้ว เริ่มนับรอบใหม่
export const PLENTY_MINUTES = 40 // เรียนวันละเท่านี้ถือว่าเยอะแล้ว

// หน้าที่นับเป็นเวลาเรียน (หน้ารายการ/หน้าสรุป/ตั้งค่า ไม่นับ)
const STUDY_PATHS = [
  /^\/lesson\/[^/]+$/,
  /^\/review$/,
  /^\/talk\/[^/]+$/,
  /^\/games\/[^/]+$/,
  /^\/sounds\/[^/]+$/,
  /^\/phrases\/[^/]+$/,
  /^\/place\/[^/]+$/,
  /^\/profile\/speaking-check$/,
]
export const isStudyPath = (pathname) => STUDY_PATHS.some((pattern) => pattern.test(pathname.replace(/\/$/, '')))

/**
 * เวลาเรียนที่นับได้ของช่วงหนึ่ง (ms): หน้าเว็บต้องเปิดอยู่ และแตะ/พิมพ์ล่าสุดไม่เกิน IDLE_MS
 * ช่วงยาวผิดปกติ (เครื่องหลับ / ตัวจับเวลาถูกพัก) นับไม่เกิน 2 รอบ
 */
export function countedMs({ from, now, lastInput, visible }) {
  if (!visible || now - lastInput > IDLE_MS) return 0
  return Math.max(0, Math.min(now - from, TICK_MS * 2))
}

// ---------- ชวนพักเมื่อเรียนต่อเนื่องนาน ----------
export const EMPTY_SESSION = { ms: 0, lastAt: null }

// เพิ่มเวลาเรียนในรอบนี้ (หยุดไปนานกว่า BREAK_GAP_MS = พักแล้ว → เริ่มนับใหม่)
export function addToSession(session, ms, now) {
  if (!(ms > 0)) return session
  const rested = session.lastAt !== null && now - session.lastAt > BREAK_GAP_MS + ms
  return { ms: (rested ? 0 : session.ms) + ms, lastAt: now }
}

// ถึงเวลาชวนพักหรือยัง (พักไปแล้ว = ไม่ต้องชวน)
export const needsBreak = (session, now) =>
  session.ms >= BREAK_AFTER_MS && session.lastAt !== null && now - session.lastAt <= BREAK_GAP_MS

// ---------- คำแนะนำของวัน ----------

// เป้าที่แนะนำ: เพิ่งเริ่ม (ยังไม่เปิด Stage 4) = 10 นาที / พูดเป็นประโยคแล้ว = 15 นาที
export const recommendedGoal = (unlockedStages) => (unlockedStages.includes(4) ? 15 : 10)

/**
 * คำแนะนำของวันนี้
 * @returns 'start' ยังไม่เริ่ม | 'going' กำลังเรียน | 'enough' ครบเป้า/ครบแผน พักได้ | 'plenty' เยอะแล้ว พักก่อน
 */
export function studyAdvice({ minutes, goal, planDone }) {
  if (minutes >= PLENTY_MINUTES) return 'plenty'
  if (planDone || minutes >= goal) return 'enough'
  return minutes < 1 ? 'start' : 'going'
}
