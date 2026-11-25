// =========================================================
// studyTime.js — เวลาเรียนต่อวัน + คำแนะนำ "วันนี้พอหรือยัง" + ชวนพัก (ฟังก์ชันล้วน → ทดสอบได้)
// - นับเฉพาะตอนเรียนจริง ไม่ใช่แค่เปิดหน้า (hooks/useStudyTimer.js):
//     กดเข้าเรียนแล้ว (ตัวเล่น/เกมทำงานอยู่ — utils/studyActivity.js) → นับเมื่อแตะ/พิมพ์ภายใน IDLE_MS
//     หน้าที่ฝึกได้เลยโดยไม่มีปุ่มเริ่ม (isPracticePath) → นับหลังกดฟัง/พูด ไม่เกิน PRACTICE_IDLE_MS ต่อครั้ง
//     หน้าหลัก/หน้ารายการ/หน้าเริ่ม/หน้าสรุป ไม่นับ
// - เก็บใน et-progress.studyMinutes { 'YYYY-MM-DD': นาที (ทศนิยม) } 60 วัน (เพิ่มด้วย addSpeaking ของ speaking.js)
// - เป็นคำแนะนำเท่านั้น ไม่ล็อก ไม่บังคับหยุด
// =========================================================

export const TICK_MS = 15_000 // นับทีละ 15 วินาที
export const IDLE_MS = 120_000 // ไม่แตะจอ/พิมพ์นานกว่านี้ = ไม่ได้เรียนอยู่ (เผื่อช่วงฟังบทยาว / คาราโอเกะที่ไม่ต้องแตะ)
export const PRACTICE_IDLE_MS = 60_000 // หน้าฝึกที่ไม่มีปุ่มเริ่ม: ไม่กดฟัง/พูดนานกว่านี้ = ไม่ได้ฝึกอยู่
export const BREAK_AFTER_MS = 20 * 60_000 // เรียนต่อเนื่องครบนี้ → ชวนพัก
export const BREAK_GAP_MS = 5 * 60_000 // หยุดเกินนี้ = พักแล้ว เริ่มนับรอบใหม่
export const PLENTY_MINUTES = 40 // เรียนวันละเท่านี้ถือว่าเยอะแล้ว

// หน้าที่ฝึกได้เลยโดยไม่มีปุ่มเริ่ม: คลังวลี, คน/วลีในสถานที่, ฟังคู่เสียง (หน้ารายการไม่นับ)
const PRACTICE_PATHS = [/^\/phrases\/[^/]+$/, /^\/place\/[^/]+$/, /^\/sounds\/[^/]+$/]
export const isPracticePath = (pathname) => PRACTICE_PATHS.some((pattern) => pattern.test(pathname.replace(/\/$/, '')))

/**
 * เวลาเรียนที่นับได้ของช่วงหนึ่ง (ms): หน้าเว็บต้องเปิดอยู่ และแตะ/พิมพ์ (หรือกดฟัง/พูด) ล่าสุดไม่เกิน idleMs
 * ช่วงยาวผิดปกติ (เครื่องหลับ / ตัวจับเวลาถูกพัก) นับไม่เกิน 2 รอบ
 */
export function countedMs({ from, now, lastInput, visible, idleMs = IDLE_MS }) {
  if (!visible || now - lastInput > idleMs) return 0
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
 * @returns 'start' ยังไม่เริ่ม | 'going' กำลังเรียน | 'timeUp' ครบเวลาแต่แผนยังเหลือ (ทำต่อหรือพักก็ได้) | 'enough' ครบแผน พักได้ | 'plenty' เยอะแล้ว พักก่อน
 */
export function studyAdvice({ minutes, goal, planDone }) {
  if (minutes >= PLENTY_MINUTES) return 'plenty'
  if (planDone) return 'enough'
  if (minutes >= goal) return 'timeUp'
  return minutes < 1 ? 'start' : 'going'
}
