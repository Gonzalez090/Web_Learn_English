// =========================================================
// gamePool.js — เนื้อหาของหน้ามินิเกมเล่นแยก (/games, ขั้นที่ 17) ฟังก์ชันล้วน (ทดสอบได้)
// - เกมที่ใช้บทเรียน: สุ่ม 1 บทจากบทที่ "เรียนจบแล้ว" (เล่นเฉพาะสิ่งที่เคยได้ยิน — ฟังก่อนพูด)
//   เล่นทีละบท ไม่ผสมหลายบท: ภาพในบทเดียวกันแยกกันชัดแน่นอน (Listen & Tap) และโหลดเนื้อหาแค่ Stage เดียว
// - Minimal Pair Duel (โหมดฝึกเสียง) / Real or Textbook? (คลังวลี) เล่นได้เลย
// - Speed Order: บทสนทนาที่ speedOrder และสถานที่ปลดล็อกแล้ว
// =========================================================

// เกม → ชนิดบทที่ใช้ได้ + Stage แรกที่มีบทชนิดนั้น (บอกผู้เรียนว่าต้องเรียนถึงไหนก่อน)
export const LESSON_GAMES = {
  'listen-tap': { types: ['listen', 'word', 'twoWord'], stage: 1 },
  'shadow-karaoke': { types: ['sentence', 'rhyme'], stage: 4 },
  'word-swap-race': { types: ['sentence', 'context'], stage: 4 },
}

// บทที่เรียนจบแล้วและใช้กับเกมนี้ได้ (บทแบบย่อจาก lessonList)
export function playableLessons(gameId, lessonList, lessonProgress) {
  const types = LESSON_GAMES[gameId]?.types ?? []
  return lessonList.filter((lesson) => types.includes(lesson.type) && lessonProgress[lesson.id]?.completed)
}

// สุ่ม 1 ตัว ไม่ซ้ำกับตัวล่าสุด (ถ้ามีให้เลือกมากกว่า 1)
export function pickOther(list, lastId = null, random = Math.random) {
  const choices = list.length > 1 ? list.filter((entry) => entry.id !== lastId) : list
  return choices[Math.floor(random() * choices.length)] ?? null
}

/**
 * เล่นเกมนี้ได้หรือยัง
 * @param speedScenarios บทสนทนา speedOrder ที่สถานที่ปลดล็อกแล้ว
 * @returns { ready, stage } stage = ต้องเรียนใน Stage ไหนก่อน (ready = true → null)
 */
export function gameAvailability(gameId, { lessonList, lessonProgress, speedScenarios }) {
  if (LESSON_GAMES[gameId]) {
    const ready = playableLessons(gameId, lessonList, lessonProgress).length > 0
    return { ready, stage: ready ? null : LESSON_GAMES[gameId].stage }
  }
  if (gameId === 'speed-order') {
    const ready = speedScenarios.length > 0
    return { ready, stage: ready ? null : 1 } // ร้านสะดวกซื้อเปิดเมื่อจบ Stage 1
  }
  return { ready: true, stage: null }
}
