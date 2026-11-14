// =========================================================
// lessonSteps.js — ลำดับขั้นของบทเรียน ตามประเภทบท (ส่วนที่ 4 ของสเปก)
// - itemSteps       ทำทีละข้อ: lookListen (ดูภาพ + ฟัง ปกติ/ช้า), speak (พูดตาม), listenSentence (ฟังประโยคถาม-ตอบ),
//                   listenContext (ฟังประโยคในบริบท), swap (สลับคำในบริบท)
// - game            มินิเกมแทรกในบท (ทำครั้งเดียวทั้งบท ด้วยคำ/ประโยคของบทนั้น)
// - afterGameSteps  ทำทีละข้ออีกรอบหลังเกม: speakOwn (ใช้เอง — ปิดข้อความ ดูภาพแล้วตอบเอง)
//                   ห่างจากตอนฝึกครั้งแรก → ได้ดึงความจำจริง ไม่ใช่พูดซ้ำทันที
// Stage 1–3 ใช้แค่ขั้น 1 (ดู+ฟัง), 3 (ฟังช้า/ปกติ), 4 (พูดตาม) + เกม Listen & Tap — ไม่แสดงข้อความ
// Stage 4: ฟัง (เดาจากภาพ → ดูข้อความ → ช้า/ปกติ) → พูดตาม + recast → สลับคำ → เกม Shadow Karaoke → ใช้เอง
// Stage 5 ประโยคในบริบท: ฟัง (ฉาก + เสียงพูดเชื่อม) → พูดตาม → สลับคำ → เกม Word Swap Race → ใช้เอง
// เพิ่มประเภทบทใหม่ = เพิ่มค่าตรงนี้ ไม่ต้องเขียนตัวเล่นใหม่
// =========================================================

export const LESSON_FLOWS = {
  // Stage 1 ช่วงฟัง: ฟังอย่างเดียว ไม่บังคับพูด
  listen: { itemSteps: ['lookListen'], game: 'listen-tap' },
  // Stage 2 คำเดี่ยว / Stage 3 สองคำ: ฟัง → พูดตาม
  word: { itemSteps: ['lookListen', 'speak'], game: 'listen-tap' },
  twoWord: { itemSteps: ['lookListen', 'speak'], game: 'listen-tap' },
  // Stage 4 ประโยคสั้น: ถาม-ตอบ + recast
  sentence: { itemSteps: ['listenSentence', 'speak', 'swap'], game: 'shadow-karaoke', afterGameSteps: ['speakOwn'] },
  // Stage 5+ ประโยคในบริบท (ส่วนที่ 2.2 + 2.3)
  context: { itemSteps: ['listenContext', 'speak', 'swap'], game: 'word-swap-race', afterGameSteps: ['speakOwn'] },
}

// ประเภทบทที่ตัวเล่นรองรับแล้ว (ที่เหลือจะมาในขั้นถัด ๆ ไป)
export const isPlayable = (lesson) => Boolean(LESSON_FLOWS[lesson?.type])

/**
 * สร้างรายการขั้นของบท
 * @returns [{ kind: 'lookListen' | 'speak' | 'listenSentence' | 'listenContext' | 'swap' | 'speakOwn', item } ..., { kind: 'game', game }, ...]
 */
export function buildLessonSteps(flow, items) {
  const perItem = (kinds = []) => items.flatMap((item) => kinds.map((kind) => ({ kind, item })))
  return [
    ...perItem(flow.itemSteps),
    ...(flow.game ? [{ kind: 'game', game: flow.game }] : []),
    // รอบใช้เอง: ทำครบทุกข้อก่อน แล้วค่อยวนกลับมาข้อแรก (เว้นระยะให้ได้ดึงความจำ)
    ...(flow.afterGameSteps ?? []).flatMap((kind) => items.map((item) => ({ kind, item }))),
  ]
}

// XP ตามสเปก 8.1: ฟัง 5, พูดตาม 15, พูดเองไม่ดูข้อความ 25
//   สลับคำ: ลองสลับ = ฟัง 5 (+ พูดประโยคใหม่ผ่าน = พูดตาม 15)
//   เกม: Listen & Tap แตะถูก 1 รอบ = ฟัง 5 / Shadow Karaoke พูดทัน 1 รอบ = พูดตาม 15
//        Word Swap Race สลับถูกตั้งแต่ครั้งแรก 1 คำ = 3 (60 วิ ได้ราว 15–25 คำ → ใกล้เคียงคาราโอเกะ)
export const XP = { listen: 5, speak: 15, speakOwn: 25, gameCorrect: 5, swap: 5, raceSwap: 3 }
export const GAME_ROUND_XP = { 'listen-tap': XP.gameCorrect, 'shadow-karaoke': XP.speak, 'word-swap-race': XP.raceSwap }

// ลองพูดได้ไม่จำกัด แต่ครบกี่ครั้งแล้วให้กด "ไปต่อ" ได้ (ข้อนั้นเข้ารายการทบทวน)
export const MAX_ATTEMPTS_BEFORE_SKIP = 3
