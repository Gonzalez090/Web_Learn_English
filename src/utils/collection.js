// =========================================================
// collection.js — Collection การ์ดวลี (ส่วนที่ 8.1, ขั้นที่ 20) ฟังก์ชันล้วน (ทดสอบได้)
// - พูดวลีในคลังวลีผ่านครั้งแรก → ได้การ์ดวลีนั้น (et-progress.collection = [phraseId] เรียงตามลำดับที่ได้)
// - สำนวน / สแลง (game.json collection.special { idiom[], slang[] } — เก็บเป็นข้อความวลี) = การ์ดระดับพิเศษ
// =========================================================
import gameData from '../data/game.json'

const SPECIAL = new Map([
  ...(gameData.collection?.special?.idiom ?? []).map((text) => [text, 'idiom']),
  ...(gameData.collection?.special?.slang ?? []).map((text) => [text, 'slang']),
])

export const SPECIAL_TOTAL = SPECIAL.size

// ระดับการ์ด: 'idiom' | 'slang' | null (การ์ดธรรมดา)
export const cardRarity = (phrase) => SPECIAL.get(phrase?.text) ?? null

/**
 * เพิ่มการ์ด (ได้ครั้งเดียวต่อวลี)
 * @returns { collection: รายการใหม่ (ไม่ได้ของใหม่ = อันเดิม), added: true ถ้าเพิ่งได้ }
 */
export function addCard(collection = [], phraseId) {
  if (!phraseId || collection.includes(phraseId)) return { collection, added: false }
  return { collection: [...collection, phraseId], added: true }
}

/**
 * สรุปของสถานการณ์หนึ่ง
 * @param phrases วลีเต็มของสถานการณ์นั้น
 * @param owned Set ของ phraseId ที่สะสมแล้ว
 * @returns { total, owned, special, specialOwned }
 */
export function situationSummary(phrases, owned) {
  let ownedCount = 0
  let special = 0
  let specialOwned = 0
  for (const phrase of phrases) {
    const has = owned.has(phrase.id)
    if (has) ownedCount += 1
    if (cardRarity(phrase)) {
      special += 1
      if (has) specialOwned += 1
    }
  }
  return { total: phrases.length, owned: ownedCount, special, specialOwned }
}

/**
 * การ์ดที่จะแสดง (ใหม่สุดก่อน)
 * @param phrases วลีเต็ม (ของสถานการณ์ที่เลือก หรือทั้งหมด)
 * @param collection รายการ phraseId ตามลำดับที่ได้
 * @param filter 'all' | 'special'
 * @returns { owned: [{ phrase, rarity }], lockedSpecial: [{ phrase, rarity }] }
 *   lockedSpecial = การ์ดพิเศษที่ยังไม่ได้ (โชว์แบบปิดไว้ ชวนไปสะสม) — แสดงเฉพาะตอนดูการ์ดพิเศษ
 */
export function cardsToShow(phrases, collection = [], filter = 'all') {
  const order = new Map(collection.map((id, index) => [id, index]))
  const owned = phrases
    .filter((phrase) => order.has(phrase.id))
    .sort((a, b) => order.get(b.id) - order.get(a.id))
    .map((phrase) => ({ phrase, rarity: cardRarity(phrase) }))
    .filter((card) => filter === 'all' || card.rarity)
  const lockedSpecial =
    filter === 'special'
      ? phrases.filter((phrase) => !order.has(phrase.id) && cardRarity(phrase)).map((phrase) => ({ phrase, rarity: cardRarity(phrase) }))
      : []
  return { owned, lockedSpecial }
}
