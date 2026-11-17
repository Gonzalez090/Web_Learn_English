// =========================================================
// review.js — รายการทบทวนแบบเว้นระยะ (Spaced Repetition, ส่วนที่ 8.5) — ฟังก์ชันล้วน ทดสอบง่าย
// - ข้อที่พลาดในบทเรียน → เข้าคิว รอบแรก (box 0) ครบกำหนดพรุ่งนี้
// - ทบทวนแล้วทำได้ → เลื่อนรอบ 1 → 3 → 7 → 14 วัน / ครบรอบ 14 วันแล้วทำได้อีก → จำได้แล้ว ออกจากคิว
// - ทบทวนแล้วพลาด → กลับไปรอบแรก (อีก 1 วัน)
// =========================================================
import { addDays } from './date'
import { prepareLessonItems } from './lessonItems'

export const REVIEW_INTERVALS = [1, 3, 7, 14]

/**
 * เพิ่มข้อที่พลาดเข้าคิว — ถ้ามีอยู่แล้ว ให้กลับไปรอบแรก (ครบกำหนดพรุ่งนี้) ไม่เพิ่มซ้ำ
 * @returns คิวใหม่ (ไม่แก้ของเดิม)
 */
export function addMissedToQueue(queue, lessonId, itemIds, today) {
  const dueDate = addDays(today, REVIEW_INTERVALS[0])
  const next = [...queue]
  for (const itemId of itemIds) {
    const id = `${lessonId}:${itemId}`
    const index = next.findIndex((entry) => entry.id === id)
    const entry = { id, lessonId, itemId, box: 0, dueDate, addedAt: today }
    if (index >= 0) next[index] = { ...next[index], box: 0, dueDate }
    else next.push(entry)
  }
  return next
}

// รายการที่ถึงกำหนดทบทวนแล้ว (วันนี้หรือก่อนหน้า)
export const dueEntries = (queue, today) => queue.filter((entry) => entry.dueDate <= today)

// ทบทวนได้ครั้งละไม่เกินกี่ข้อ (ที่เหลือยังค้างอยู่ ทบทวนต่อรอบหน้าได้)
export const MAX_REVIEW_PER_SESSION = 10
// ทบทวนสั้น ๆ ตอนกลับมาหลังหายไปนาน (คำทัก "Long time no see!" — /review?short=1)
export const SHORT_REVIEW_COUNT = 5

/**
 * บันทึกผลทบทวน 1 ข้อ
 * @returns { queue: คิวใหม่, outcome: 'next' (เลื่อนรอบ) | 'reset' (กลับรอบแรก) | 'mastered' (ออกจากคิว) | null, days }
 */
export function gradeReview(queue, entryId, passed, today) {
  const entry = queue.find((item) => item.id === entryId)
  if (!entry) return { queue, outcome: null, days: 0 }

  if (!passed) {
    const days = REVIEW_INTERVALS[0]
    const updated = { ...entry, box: 0, dueDate: addDays(today, days), lastReviewedAt: today }
    return { queue: queue.map((item) => (item.id === entryId ? updated : item)), outcome: 'reset', days }
  }

  const box = entry.box + 1
  if (box >= REVIEW_INTERVALS.length) {
    return { queue: queue.filter((item) => item.id !== entryId), outcome: 'mastered', days: 0 }
  }
  const days = REVIEW_INTERVALS[box]
  const updated = { ...entry, box, dueDate: addDays(today, days), lastReviewedAt: today }
  return { queue: queue.map((item) => (item.id === entryId ? updated : item)), outcome: 'next', days }
}

/**
 * รายการที่จะทบทวนรอบนี้: ถึงกำหนดแล้ว + ยังมีข้อนั้นในบทเรียน เรียงจากค้างนานสุด ไม่เกิน limit ข้อ
 * ข้อเป็นแบบเตรียมแล้ว (บทสนทนา/คำคล้องจองมีบรรทัดก่อนหน้าเป็นตัวนำ — utils/lessonItems.js)
 * @returns [{ entry, item, lesson }]
 */
export function buildReviewItems(queue, lessons, today, limit = MAX_REVIEW_PER_SESSION) {
  return dueEntries(queue, today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id))
    .map((entry) => {
      const lesson = lessons.find((candidate) => candidate.id === entry.lessonId)
      const item = lesson ? prepareLessonItems(lesson).find((candidate) => candidate.id === entry.itemId) : null
      return item ? { entry, item, lesson } : null
    })
    .filter(Boolean)
    .slice(0, limit)
}

// วันที่ครบกำหนดถัดไป (หลังวันนี้) — ใช้บอกว่า "รอบหน้ามาทบทวนวันไหน"
export function nextDueDate(queue, today) {
  const upcoming = queue.map((entry) => entry.dueDate).filter((date) => date > today)
  return upcoming.length ? upcoming.sort()[0] : null
}
