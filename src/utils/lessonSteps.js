// =========================================================
// lessonSteps.js — ลำดับขั้นของบทเรียน ตามประเภทบท (ส่วนที่ 4 ของสเปก)
// - 'item' steps ทำทีละข้อ: lookListen (ดูภาพ + ฟัง ปกติ/ช้า), speak (พูดตาม)
// - 'lesson' steps ทำครั้งเดียวทั้งบท: game (มินิเกมแทรกในบท)
// Stage 1–3 ใช้แค่ขั้น 1 (ดู+ฟัง), 3 (ฟังช้า/ปกติ), 4 (พูดตาม) + เกม Listen & Tap — ไม่แสดงข้อความ
// เพิ่มประเภทบทใหม่ = เพิ่มค่าตรงนี้ ไม่ต้องเขียนตัวเล่นใหม่
// =========================================================

export const LESSON_FLOWS = {
  // Stage 1 ช่วงฟัง: ฟังอย่างเดียว ไม่บังคับพูด
  listen: { itemSteps: ['lookListen'], game: 'listen-tap' },
  // Stage 2 คำเดี่ยว / Stage 3 สองคำ: ฟัง → พูดตาม
  word: { itemSteps: ['lookListen', 'speak'], game: 'listen-tap' },
  twoWord: { itemSteps: ['lookListen', 'speak'], game: 'listen-tap' },
}

// ประเภทบทที่ตัวเล่นรองรับแล้ว (ที่เหลือจะมาในขั้นถัด ๆ ไป)
export const isPlayable = (lesson) => Boolean(LESSON_FLOWS[lesson?.type])

// XP ตามสเปก 8.1: ฟัง 5, พูดตาม 15, พูดเองไม่ดูข้อความ 25 — เกมแตะถูก 1 รอบ = ฟัง 5
export const XP = { listen: 5, speak: 15, speakOwn: 25, gameCorrect: 5 }

// ลองพูดได้ไม่จำกัด แต่ครบกี่ครั้งแล้วให้กด "ไปต่อ" ได้ (ข้อนั้นเข้ารายการทบทวน)
export const MAX_ATTEMPTS_BEFORE_SKIP = 3
