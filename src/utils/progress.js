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

/**
 * คำนวณ Stage ที่ปลดล็อกแล้ว: Stage ไหนผ่านครบทุกบท → ปลดล็อก Stage ถัดไป (ไล่ตามลำดับ)
 * @returns { unlockedStages: number[], newlyUnlocked: number[] }
 */
export function computeUnlockedStages(stages, lessons, unlockedStages, lessonProgress) {
  const unlocked = new Set(unlockedStages)
  const newlyUnlocked = []
  const ordered = [...stages].sort((a, b) => a.id - b.id)
  for (let i = 0; i < ordered.length - 1; i += 1) {
    const stage = ordered[i]
    const stageLessons = lessons.filter((lesson) => lesson.stageId === stage.id)
    const status = getStageStatus(stage.id, stageLessons, [...unlocked], lessonProgress)
    const next = ordered[i + 1].id
    if (status === 'completed' && !unlocked.has(next)) {
      unlocked.add(next)
      newlyUnlocked.push(next)
    }
  }
  return { unlockedStages: [...unlocked].sort((a, b) => a - b), newlyUnlocked }
}

/**
 * บทถัดไปที่ควรเรียน (ปุ่ม "เรียนต่อ" ในหน้าแรก + ป้าย "บทต่อไป" ในหน้ารายการบท)
 * = บทแรกที่ยังไม่จบ ไล่ตาม Stage ที่ปลดล็อกแล้ว (น้อยไปมาก) แล้วตามลำดับบทในไฟล์ — ลำดับนี้คือ ฟัง → พูด → อ่าน → เขียน
 * @param stageId จำกัดเฉพาะ Stage นี้ (ไม่ใส่ = ทุก Stage ที่ปลดล็อก)
 * @returns บท หรือ null ถ้าเรียนจบทุกบทที่เปิดแล้ว
 */
export function nextLesson(lessons, unlockedStages, lessonProgress, { stageId } = {}) {
  const ordered = lessons
    .map((lesson, index) => ({ lesson, index }))
    .sort((a, b) => a.lesson.stageId - b.lesson.stageId || a.index - b.index)
    .map(({ lesson }) => lesson)
  return (
    ordered.find(
      (lesson) =>
        unlockedStages.includes(lesson.stageId) &&
        (stageId === undefined || lesson.stageId === Number(stageId)) &&
        !lessonProgress[lesson.id]?.completed,
    ) ?? null
  )
}

// บันทึกผลบทเรียน 1 ครั้ง (คืน object ใหม่ ไม่แก้ของเดิม)
export function recordLessonResult(lessonProgress, lessonId, score, today) {
  const previous = lessonProgress[lessonId] ?? { completed: false, bestScore: 0, attempts: 0 }
  return {
    ...lessonProgress,
    [lessonId]: {
      completed: true,
      bestScore: Math.max(previous.bestScore, score),
      attempts: previous.attempts + 1,
      completedAt: previous.completedAt ?? today,
      lastPlayedAt: today,
    },
  }
}
