// =========================================================
// dailyPlan.js — แผนรายวัน (ส่วนที่ 8.4, ขั้นที่ 18)
// - เป้าหมาย 5 / 10 / 15 / 20 นาที (et-settings.dailyGoal) → จัดชุดอัตโนมัติตามลำดับ: ทบทวน → บทเรียนใหม่ → บทสนทนาสุ่ม → มินิเกม
//     5  นาที: ทบทวนสั้น (≤ 5) → บทใหม่ 1 บท
//     10 นาที: ทบทวน (≤ 10) → บทใหม่ 1 บท → มินิเกม
//     15 นาที: ทบทวน → บทใหม่ 1 บท → บทสนทนาสุ่ม → มินิเกม
//     20 นาที: ทบทวน → บทใหม่ 2 บท → บทสนทนาสุ่ม → มินิเกม
//   ไม่มีรายการถึงกำหนด (และวันนี้ยังไม่ได้ทบทวน) → ไม่มีขั้นทบทวน / ยังไม่ผ่าน Stage 4 → แทนบทสนทนาด้วยบทใหม่อีก 1 บท
// - แผน = { date, goal, counts, tasks: [{ kind, target, progress }] }
//   counts = จำนวนเหตุการณ์ของวันนี้ { review, lessonComplete, conversation, miniGame } — นับเสมอแม้ไม่มีขั้นชนิดนั้น
//   progress ของขั้น = min(target, counts[เหตุการณ์ของขั้น]) → เปลี่ยนเป้ากลางวันไม่เสียของที่ทำไปแล้ว
// - มินิเกมในแผน = เกมที่เล่นแยก (ฝึกเสียง, Real or Textbook?, Speed Order, หน้ามินิเกม) เหตุการณ์ 'miniGame'
//   (เกมที่แทรกในบทเรียน/ทบทวนนับเป็น 'gamePlay' ของภารกิจ ไม่ทำให้ขั้นมินิเกมของแผนเสร็จเอง)
// (ฟังก์ชันล้วน → ทดสอบได้)
// =========================================================
import { MAX_REVIEW_PER_SESSION, SHORT_REVIEW_COUNT } from './review'

export const PLAN_GOALS = [5, 10, 15, 20]
export const DEFAULT_GOAL = 10

// ชนิดขั้น → เหตุการณ์ที่ทำให้คืบหน้า
export const PLAN_TASK_EVENTS = {
  review: 'review',
  lesson: 'lessonComplete',
  talk: 'conversation',
  game: 'miniGame',
}
const PLAN_EVENTS = new Set(Object.values(PLAN_TASK_EVENTS))
const emptyCounts = () => Object.fromEntries([...PLAN_EVENTS].map((event) => [event, 0]))

// บทสนทนาสุ่มเหมาะเมื่อพูดเป็นประโยคได้แล้ว = ผ่าน Stage 4 (Stage 5 เปิดแล้ว)
export const TALK_FROM_STAGE = 5

const withProgress = (tasks, counts) =>
  tasks.map((task) => ({ ...task, progress: Math.min(task.target, counts[PLAN_TASK_EVENTS[task.kind]] ?? 0) }))

/**
 * สร้างแผนของวันนี้
 * @param goal        นาทีต่อวัน (5 / 10 / 15 / 20 — ค่าอื่นใช้ DEFAULT_GOAL)
 * @param reviewDue   จำนวนรายการทบทวนที่ "ยังค้าง" ถึงกำหนดวันนี้
 * @param talkReady   เล่นบทสนทนาสุ่มได้แล้วหรือยัง (TALK_FROM_STAGE)
 * @param counts      จำนวนเหตุการณ์ที่ทำไปแล้ววันนี้ (สร้างใหม่ตอนเปลี่ยนเป้า) — ไม่ใส่ = เริ่มวันใหม่
 */
export function buildDailyPlan({ goal, today, reviewDue = 0, talkReady = false, counts = null }) {
  const minutes = PLAN_GOALS.includes(goal) ? goal : DEFAULT_GOAL
  const done = { ...emptyCounts(), ...counts }
  const tasks = []
  // ทบทวน: เป้า = ที่ทำแล้ว + ที่ยังค้าง (ไม่เกินเพดานของเป้าหมาย) / ทบทวนไปบ้างแล้ว → ขั้นยังอยู่แม้ไม่เหลือค้าง
  const reviewTotal = done.review + reviewDue
  if (reviewTotal > 0) {
    const cap = minutes === 5 ? SHORT_REVIEW_COUNT : MAX_REVIEW_PER_SESSION
    tasks.push({ kind: 'review', target: Math.min(reviewTotal, cap) })
  }
  let lessons = minutes === 20 ? 2 : 1
  const withTalk = minutes >= 15
  if (withTalk && !talkReady) lessons += 1
  tasks.push({ kind: 'lesson', target: lessons })
  if (withTalk && talkReady) tasks.push({ kind: 'talk', target: 1 })
  if (minutes >= 10) tasks.push({ kind: 'game', target: 1 })
  return { date: today, goal: minutes, counts: done, tasks: withProgress(tasks, done) }
}

// แผนที่ใช้วันนี้: ของเดิมถ้ายังเป็นวันนี้และเป้าเดิม ไม่งั้นสร้างใหม่ (คืนตัวเดิมถ้าไม่เปลี่ยน — store เช็กได้ว่าต้อง set ไหม)
//   วันเดียวกัน → คง counts ไว้ / แผนรุ่นแรกที่ยังไม่มี counts → สร้างใหม่ (นับจาก progress เดิม)
export function ensureDailyPlan(plan, { goal, today, reviewDue, talkReady }) {
  const minutes = PLAN_GOALS.includes(goal) ? goal : DEFAULT_GOAL
  if (plan?.date === today && plan.goal === minutes && plan.counts) return plan
  let counts = null
  if (plan?.date === today) {
    counts =
      plan.counts ??
      Object.fromEntries(plan.tasks.map((task) => [PLAN_TASK_EVENTS[task.kind], task.progress ?? 0]))
  }
  return buildDailyPlan({ goal: minutes, today, reviewDue, talkReady, counts })
}

/**
 * เหตุการณ์หนึ่ง → นับเพิ่ม + ขั้นคืบหน้า (เฉพาะแผนของวันนี้ และเฉพาะเหตุการณ์ของแผน)
 * @returns { plan (ตัวเดิมถ้าไม่เปลี่ยน), completed: true ถ้าเหตุการณ์นี้ทำให้แผนครบทุกขั้นพอดี }
 */
export function applyPlanEvent(plan, event, amount, today) {
  if (!plan?.counts || plan.date !== today || !PLAN_EVENTS.has(event) || !(amount > 0)) return { plan, completed: false }
  const counts = { ...plan.counts, [event]: (plan.counts[event] ?? 0) + amount }
  const next = { ...plan, counts, tasks: withProgress(plan.tasks, counts) }
  return { plan: next, completed: isPlanDone(next) && !isPlanDone(plan) }
}

export const isTaskDone = (task) => task.progress >= task.target
export const isPlanDone = (plan) => Boolean(plan?.tasks.length) && plan.tasks.every(isTaskDone)

// ขั้นแรกที่ยังไม่เสร็จ (ทำตามลำดับ) — ไม่มี = เสร็จหมดแล้ว
export const nextPlanTask = (plan) => plan?.tasks.find((task) => !isTaskDone(task)) ?? null
