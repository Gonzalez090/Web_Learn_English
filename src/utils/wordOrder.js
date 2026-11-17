// =========================================================
// wordOrder.js — แบบฝึก "เรียงคำเป็นประโยค" (Stage 7)
//   ประโยค → ป้ายคำ (คำตามที่เขียน มีเครื่องหมายติดมาด้วย เช่น "kite.") → สลับลำดับ → ผู้เรียนเรียง → ตรวจ
//   ป้ายคำมี id ของตัวเอง → คำซ้ำ ("Up, up, up!") ยังแยกกันได้
// (ฟังก์ชันล้วน → ทดสอบได้)
// =========================================================
import { cleanWord } from './spelling.js'
import { shuffle } from './random.js'

// ประโยค → [{ id, text }]
export function makeTiles(target) {
  return String(target ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .map((text, index) => ({ id: `t${index}`, text }))
}

const cleanSequence = (texts) => texts.map(cleanWord)
const sameSequence = (a, b) => a.length === b.length && a.every((word, index) => word === b[index])

/**
 * สลับลำดับป้ายคำ — ไม่ให้ออกมาเรียงถูกอยู่แล้ว (ถ้าทำได้)
 * @param random ตัวสุ่ม (ส่ง createRandom(seed) → ผลเดิมทุกครั้ง)
 */
export function shuffleTiles(tiles, random = Math.random) {
  const answer = cleanSequence(tiles.map((tile) => tile.text))
  let result = tiles
  for (let attempt = 0; attempt < 8; attempt += 1) {
    result = shuffle(tiles, random)
    if (!sameSequence(cleanSequence(result.map((tile) => tile.text)), answer)) return result
  }
  // คำเหมือนกันหมด / สุ่มไม่ออก → เลื่อนคำแรกไปท้าย
  return tiles.length > 1 ? [...tiles.slice(1), tiles[0]] : result
}

/**
 * ตรวจลำดับคำ (ไม่สนตัวพิมพ์ใหญ่/เล็กและเครื่องหมาย)
 * @param texts      คำที่ผู้เรียนเรียง
 * @param target     ประโยคที่ถูก
 * @param acceptAlso ลำดับอื่นที่ถูกเหมือนกัน
 * @returns { passed, positions: [true = คำนี้อยู่ถูกที่], answer: ประโยคที่ใช้เทียบ }
 */
export function checkOrder(texts, target, acceptAlso = []) {
  const placed = cleanSequence(texts)
  const candidates = [target, ...acceptAlso]
  const matched = candidates.find((candidate) => sameSequence(placed, cleanSequence(makeTiles(candidate).map((tile) => tile.text))))
  const answer = matched ?? target
  const wanted = cleanSequence(makeTiles(answer).map((tile) => tile.text))
  return {
    passed: Boolean(matched),
    positions: placed.map((word, index) => word === wanted[index]),
    answer,
  }
}

// ย้าย id ไปตำแหน่ง index (ถ้าไม่มีในรายการ = แทรกใหม่) — คืน array ใหม่
export function placeAt(list, id, index) {
  const without = list.filter((item) => item !== id)
  const at = Math.max(0, Math.min(index, without.length))
  return [...without.slice(0, at), id, ...without.slice(at)]
}
