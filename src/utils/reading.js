// =========================================================
// reading.js — ช่วยขั้นอ่านของ Stage 6
// - graphemeUnits: คำ phonics → หน่วยเสียงทีละตัว (ตัวอักษร + เสียงไทยที่ใกล้เคียง) ใช้ทำป้ายไล่เสียง s-i-t → sit
// - readingUnits / readProgress: ประโยคที่อ่าน → คำทีละคำ + "อ่านถึงคำไหนแล้ว" จากสิ่งที่ระบบได้ยินระหว่างพูด
//   (ไฮไลต์คำที่อ่านแล้วตอนอ่านนิทานออกเสียง)
// (ฟังก์ชันล้วน → ทดสอบได้)
// =========================================================
import { normalizeWord, similarity, soundAlike } from './compareWords.js'

// คำที่ได้ยินใกล้พอจะนับว่า "อ่านคำนี้แล้ว" (ระหว่างพูดระบบยังเดาไม่ครบ → ผ่อนปรน)
const CLOSE_ENOUGH = 0.6
// ข้ามคำที่ได้ยินเกิน (เช่น um, เสียงรบกวน) ได้ไม่เกินกี่คำ ก่อนถือว่ายังไม่ถึงคำถัดไป
const LOOK_AHEAD = 3

// เสียงไทยแบบสั้นสำหรับป้ายตัวอักษร: "ร (อเมริกัน)" → "ร" / ตัวที่ไม่ออกเสียง → "–"
export const shortSoundTh = (sound) => (sound?.silent ? '–' : String(sound?.soundTh ?? '').split(' (')[0])

/**
 * หน่วยเสียงของคำ phonics
 * @param graphemes ['s', 'i', 't'] (id ใน phonics.json)
 * @param soundsById { [id]: { grapheme, soundTh, ipa, silent? } }
 * @returns [{ id, grapheme, soundTh, hint (เสียงไทยแบบสั้น), ipa, silent }]
 */
export const graphemeUnits = (graphemes, soundsById) =>
  (graphemes ?? []).map((id) => ({
    id,
    grapheme: soundsById[id]?.grapheme ?? id,
    soundTh: soundsById[id]?.soundTh ?? '',
    hint: shortSoundTh(soundsById[id]),
    ipa: soundsById[id]?.ipa ?? '',
    silent: Boolean(soundsById[id]?.silent),
  }))

// หน่วยเสียง → คำที่สะกดได้ (ใช้ตรวจข้อมูล)
export const spellUnits = (units) => units.map((unit) => unit.grapheme).join('')

/**
 * แยกคำตัวอย่างรอบตัวอักษรที่กำลังสอน (ระบายสีตัวอักษรนั้น) เช่น ('cat', 'a') → { before: 'c', match: 'a', after: 't' }
 * ไม่พบ → ทั้งคำอยู่ใน before
 */
export function markGrapheme(word, grapheme) {
  const text = String(word ?? '')
  const index = grapheme ? text.toLowerCase().indexOf(String(grapheme).toLowerCase()) : -1
  if (index < 0) return { before: text, match: '', after: '' }
  return { before: text.slice(0, index), match: text.slice(index, index + grapheme.length), after: text.slice(index + grapheme.length) }
}

/**
 * ประโยค → คำตามที่เขียน (รวมเครื่องหมาย) — countable = เป็นคำที่ต้องอ่านจริง (ไม่ใช่เครื่องหมายล้วน)
 * order = ลำดับของคำที่ต้องอ่าน (เริ่ม 0) / เครื่องหมายล้วน = -1 — ใช้เทียบกับจำนวนคำที่อ่านแล้ว
 * @returns [{ display, tokens: [], countable, order }]
 */
export function readingUnits(text) {
  let order = 0
  return String(text ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .map((display) => {
      const tokens = normalizeWord(display)
      const countable = tokens.length > 0
      return { display, tokens, countable, order: countable ? order++ : -1 }
    })
}

/**
 * อ่านถึงคำไหนแล้ว: ไล่คำในประโยคตามลำดับ เทียบกับคำที่ได้ยิน (ใกล้เคียงก็นับ)
 * @returns จำนวนคำ (countable) จากต้นประโยคที่อ่านแล้ว
 */
export function readProgress(text, heard) {
  const heardTokens = String(heard ?? '')
    .split(/\s+/)
    .flatMap(normalizeWord)
  let position = 0
  let read = 0
  for (const unit of readingUnits(text).filter((entry) => entry.countable)) {
    for (const token of unit.tokens) {
      const limit = Math.min(heardTokens.length, position + LOOK_AHEAD)
      let found = -1
      for (let index = position; index < limit; index += 1) {
        // คำพ้องเสียง (to = two) นับว่าอ่านถึงแล้ว
        if (similarity(soundAlike(token), soundAlike(heardTokens[index])) >= CLOSE_ENOUGH) {
          found = index
          break
        }
      }
      if (found < 0) return read
      position = found + 1
    }
    read += 1
  }
  return read
}
