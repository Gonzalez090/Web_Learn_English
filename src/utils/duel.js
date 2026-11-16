// =========================================================
// duel.js — จัดรอบของเกม Minimal Pair Duel (ส่วนที่ 8.2 + 10.1)
//   ฟังคำ 1 คำ แล้วเลือกว่าได้ยินคำไหน จาก 2 คำที่หน้าตา/เสียงคล้ายกัน (sit / sat, think / sink)
// - 1 ข้อ = 1 รอบ: คำของข้อ (word) คู่กับ pairWith — ไม่มี pairWith → ใช้คำของข้ออื่นใน pool แทน
// - คำที่ได้ยินสุ่มเป็นคำไหนก็ได้ในคู่ → เดาจาก "คำที่เพิ่งเรียน" ไม่ได้ ต้องฟังจริง
// (ฟังก์ชันล้วน → ทดสอบได้)
// =========================================================
import { createRandom, shuffle } from './random.js'

// คำของข้อ (บท phonics / sight words / คู่คำฝึกเสียง = word)
export const duelWordOf = (item) => item.word ?? item.target

/**
 * @param items [{ id, word, pairWith?, meaningTh?, pairMeaningTh? }] — 1 ข้อ = 1 รอบ
 * @param pool  ข้อที่ใช้หาคำคู่แทนได้ (ข้อที่ไม่มี pairWith)
 * @param seed  กำหนดได้เพื่อให้ test ได้ผลเดิม
 * @returns [{ item, answer: { text, meaningTh }, options: [{ text, meaningTh }, …] }]
 */
export function buildDuelRounds(items, { pool = items, seed } = {}) {
  const random = createRandom(seed)
  return shuffle(items, random).map((item) => {
    const word = { text: duelWordOf(item), meaningTh: item.meaningTh }
    const partner = item.pairWith
      ? { text: item.pairWith, meaningTh: item.pairMeaningTh }
      : partnerFromPool(item, pool, random)
    const options = partner ? shuffle([word, partner], random) : [word]
    const answer = partner && random() < 0.5 ? partner : word
    return { item, answer, options }
  })
}

// ข้อที่ไม่มีคำคู่ → ใช้คำของข้ออื่น (ไม่ซ้ำคำเดิม)
function partnerFromPool(item, pool, random) {
  const own = duelWordOf(item).toLowerCase()
  const others = pool.filter((other) => other.id !== item.id && duelWordOf(other).toLowerCase() !== own)
  if (!others.length) return null
  const other = others[Math.floor(random() * others.length)]
  return { text: duelWordOf(other), meaningTh: other.meaningTh }
}

/**
 * ชุดฝึกเสียง (game.json soundPractice) → ข้อของเกม: 1 คู่คำ = 1 ข้อ
 * @returns [{ id, word, meaningTh, pairWith, pairMeaningTh }]
 */
export const soundPairItems = (set) =>
  (set?.pairs ?? []).map((pair) => ({
    id: `${set.id}:${pair.a}-${pair.b}`,
    word: pair.a,
    meaningTh: pair.aTh,
    pairWith: pair.b,
    pairMeaningTh: pair.bTh,
  }))
