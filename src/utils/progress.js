// =========================================================
// ฟังก์ชันคำนวณสถานะความคืบหน้า (ไม่มี side effect → ทดสอบง่าย)
// =========================================================

/**
 * สถานะของ Stage
 * @returns {'locked' | 'unlocked' | 'completed'}
 *   locked    = ยังไม่ปลดล็อก
 *   unlocked  = ปลดล็อกแล้ว แต่ยังเรียนไม่ครบทุกบท
 *   completed = ปลดล็อกแล้ว และผ่านทุกบทใน Stage (ต้องมีบทเรียนอย่างน้อย 1 บท)
 */
export function getStageStatus(stageId, stageLessons, unlockedStages, lessonProgress) {
  if (!unlockedStages.includes(stageId)) return 'locked'
  const allDone =
    stageLessons.length > 0 && stageLessons.every((lesson) => lessonProgress[lesson.id]?.completed)
  return allDone ? 'completed' : 'unlocked'
}
