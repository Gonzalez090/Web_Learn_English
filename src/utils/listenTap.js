// =========================================================
// listenTap.js — จัดรอบของเกม Listen & Tap (ฟังแล้วแตะภาพให้ถูก)
// - ทุกข้อในบทเป็นคำตอบ 1 รอบ (ลำดับสุ่ม)
// - แต่ละรอบมีตัวเลือก (ภาพ) ไม่ซ้ำกัน = คำตอบ + ตัวหลอกจากข้ออื่นในบทเดียวกัน
// =========================================================
import { createRandom, shuffle } from './random'

/**
 * @param items          ข้อที่เป็นคำตอบ [{ id, ... }] (1 ข้อ = 1 รอบ)
 * @param optionsPerRound จำนวนภาพให้เลือกต่อรอบ (ไม่เกินจำนวนภาพที่มี)
 * @param pool           ข้อที่ใช้เป็นตัวหลอกได้ (ค่าเริ่มต้น = items) — ฝึกซ้ำเฉพาะข้อที่พลาด ใช้ตัวหลอกจากทั้งบท
 * @param seed           กำหนดได้เพื่อให้ test ได้ผลเดิม
 * @returns [{ answer: item, options: [item, ...] }]
 */
export function buildListenTapRounds(items, { optionsPerRound = 3, pool = items, seed } = {}) {
  const random = createRandom(seed)
  const candidates = [...new Map([...items, ...pool].map((item) => [item.id, item])).values()]
  const count = Math.max(1, Math.min(optionsPerRound, candidates.length))
  return shuffle(items, random).map((answer) => {
    const distractors = shuffle(
      candidates.filter((item) => item.id !== answer.id),
      random,
    ).slice(0, count - 1)
    return { answer, options: shuffle([answer, ...distractors], random) }
  })
}

// ข้อความที่ใช้ "ถาม" ในเกม = คำ/คำคู่ภาษาอังกฤษของข้อนั้น
export const listenTapPrompt = (item) => item.target ?? item.word
