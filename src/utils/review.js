// =========================================================
// review.js — เพิ่มข้อที่พลาดเข้า "รายการทบทวน" (ฟังก์ชันล้วน → ทดสอบง่าย)
// รอบทบทวน 1 → 3 → 7 → 14 วัน (การเลื่อนรอบเมื่อทบทวน ทำในขั้นที่ 16)
// =========================================================
import { addDays } from './date'

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
