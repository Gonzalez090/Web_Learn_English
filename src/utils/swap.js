// =========================================================
// swap.js — "สลับคำในบริบท" (ส่วนที่ 2.2 + ส่วนที่ 4 ขั้น 5)
// แทนคำสำคัญ (keywords[].word) ในประโยคด้วยคำที่ใช้แทนได้ (alternatives[].word)
//   "I want juice." + juice → milk = "I want milk."
// - แทนทุกจุดที่คำนั้นอยู่ (ทั้งคำ ไม่สนตัวพิมพ์): "Shake, shake, shake!" → "Tap, tap, tap!"
// - รักษาตัวพิมพ์ใหญ่ต้นประโยค / ชื่อเฉพาะ (Mommy, Grandpa) คงตัวพิมพ์ตามข้อมูล
// - แก้ a / an หน้าคำที่แทน: "It's a bird!" + owl → "It's an owl!"
// ใช้ทั้งหน้าเว็บ (ประโยคที่สลับแล้ว) และ speechTexts.js (สร้างไฟล์เสียงให้ทุกประโยคที่สลับได้)
// → ข้อความต้องตรงกันทุกตัวอักษร เพราะใช้เป็น key หาไฟล์เสียง
// =========================================================

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const isUpper = (char) => Boolean(char) && char === char.toUpperCase() && char !== char.toLowerCase()
const upperFirst = (text) => text.charAt(0).toUpperCase() + text.slice(1)
const lowerFirst = (text) => text.charAt(0).toLowerCase() + text.slice(1)

// คำที่ขึ้นต้นด้วยสระแต่ออกเสียงพยัญชนะ (a unicorn) / ขึ้นต้นพยัญชนะแต่ออกเสียงสระ (an hour)
const VOWEL_LETTER_BUT_A = /^(uni|use|usu|eu|one|once)/i
const CONSONANT_LETTER_BUT_AN = /^(hour|honest|honor)/i

// คำนี้ควรใช้ "an" หรือไม่ (ดูจากตัวสะกด — พอสำหรับคำในบทเรียน)
export function needsAn(word) {
  const clean = String(word ?? '').replace(/^[^A-Za-z]+/, '')
  if (CONSONANT_LETTER_BUT_AN.test(clean)) return true
  if (VOWEL_LETTER_BUT_A.test(clean)) return false
  return /^[aeiou]/i.test(clean)
}

// ตัวพิมพ์ของคำที่แทน ให้เข้ากับจุดที่แทน
//   ต้นประโยค (ตัวใหญ่) → ขึ้นต้นตัวใหญ่
//   กลางประโยค + คำสำคัญในข้อมูลเขียนตัวใหญ่เพราะอยู่ต้นประโยค ("Shake") → ตัวเล็ก
//   นอกนั้นใช้ตามข้อมูล (ชื่อเฉพาะอย่าง "Mommy" คงตัวใหญ่)
function matchCase(found, replacement, keyword) {
  if (isUpper(found.charAt(0))) return upperFirst(replacement)
  if (isUpper(keyword.charAt(0))) return lowerFirst(replacement)
  return replacement
}

const MARK_START = '\u0001'
const MARK_END = '\u0002'

/**
 * แทนคำสำคัญในประโยค
 * @param text        ประโยคเดิม
 * @param word        คำสำคัญ (keywords[].word)
 * @param replacement คำที่ใช้แทน (alternatives[].word)
 * @returns ประโยคใหม่ (ไม่พบคำ → ประโยคเดิม)
 */
export function swapWord(text, word, replacement) {
  const source = String(text ?? '')
  const pattern = new RegExp(`(^|[^A-Za-z'])(${escapeRegExp(word)})(?=$|[^A-Za-z])`, 'gi')
  const marked = source.replace(
    pattern,
    (_match, before, found) => `${before}${MARK_START}${matchCase(found, replacement, word)}${MARK_END}`,
  )
  if (marked === source) return source
  // a / an หน้าคำที่แทน (คำที่แทนมี a/an/the ของตัวเองอยู่แล้ว เช่น "a cookie" → ไม่แตะ)
  const fixed = marked.replace(
    new RegExp(`\\b([Aa])n? ${MARK_START}([^${MARK_END}]*)`, 'g'),
    (whole, a, inserted) => {
      if (/^(a|an|the)\s/i.test(inserted)) return whole
      return `${a}${needsAn(inserted) ? 'n' : ''} ${MARK_START}${inserted}`
    },
  )
  return fixed.replaceAll(MARK_START, '').replaceAll(MARK_END, '')
}

// ประโยคตอนนี้ของข้อ ตามคำที่สลับอยู่ (choice = { keyword, alternative } | null)
export const currentSentence = (item, choice) =>
  choice ? swapWord(item.target, choice.keyword, choice.alternative) : item.target

/**
 * ทุกประโยคที่สลับได้ของข้อหนึ่ง (สลับทีละคำสำคัญ ทีละคำแทน)
 * @param item { target, keywords: [{ word, alternatives: [{ word }] }] }
 * @returns [{ keyword, alternative, text }]
 */
export function swapVariants(item) {
  const target = item?.target ?? ''
  return (item?.keywords ?? []).flatMap((keyword) =>
    keyword.alternatives.map((alternative) => ({
      keyword: keyword.word,
      alternative: alternative.word,
      text: swapWord(target, keyword.word, alternative.word),
    })),
  )
}

/**
 * รอบของเกม Word Swap Race: 1 รอบ = ประโยค 1 ข้อ + คำสำคัญ 1 คำ + คำแทนที่ต้องเลือก (จากความหมายไทย)
 * ตัวเลือก = คำแทนของคำสำคัญเดียวกัน (ความหมายต่างกันทุกตัว) สูงสุด maxOptions ตัว
 * @param items  ข้อในบท (ต้องมี keywords)
 * @param random ฟังก์ชันสุ่ม 0–1 (ส่งเข้ามาได้ → test ได้ผลแน่นอน)
 * @returns [{ item, keyword, answer: { word, meaningTh }, options: [{ word, meaningTh }], text }]
 */
export function swapRaceRounds(items, random = Math.random, maxOptions = 4) {
  const shuffled = (list) =>
    list
      .map((value) => ({ value, sort: random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value)
  const rounds = (items ?? []).flatMap((item) =>
    (item.keywords ?? []).flatMap((keyword) => {
      // คำแทนที่ความหมายไทยซ้ำกันใช้เป็นตัวเลือกพร้อมกันไม่ได้ (ตอบได้ 2 แบบ)
      const distinct = keyword.alternatives.filter(
        (alternative, index, list) => list.findIndex((other) => other.meaningTh === alternative.meaningTh) === index,
      )
      if (distinct.length < 2) return []
      return distinct.map((answer) => {
        const others = shuffled(distinct.filter((alternative) => alternative !== answer)).slice(0, maxOptions - 1)
        return {
          item,
          keyword: keyword.word,
          answer,
          options: shuffled([answer, ...others]),
          text: swapWord(item.target, keyword.word, answer.word),
        }
      })
    }),
  )
  return shuffled(rounds)
}

/**
 * แยกประโยคเป็นช่วง ๆ เพื่อแสดงคำสำคัญเป็นปุ่มกดได้
 * @param text   ประโยคที่แสดงอยู่ (อาจสลับแล้ว)
 * @param words  คำที่จะทำเป็นปุ่ม [{ word: คำที่อยู่ในประโยคตอนนี้, key: คำสำคัญเดิมในข้อมูล }]
 * @returns [{ text, key? }] — ช่วงที่มี key คือคำสำคัญ
 */
export function splitKeywords(text, words) {
  const source = String(text ?? '')
  const list = (words ?? []).filter((entry) => entry.word)
  if (!list.length) return [{ text: source }]
  // คำยาวก่อน ("ice cream" ก่อน "ice") กันจับคำสั้นที่ซ้อนอยู่
  const sorted = [...list].sort((a, b) => b.word.length - a.word.length)
  const pattern = new RegExp(
    `(^|[^A-Za-z'])(${sorted.map((entry) => escapeRegExp(entry.word)).join('|')})(?=$|[^A-Za-z])`,
    'gi',
  )
  const parts = []
  let last = 0
  for (const match of source.matchAll(pattern)) {
    const start = match.index + match[1].length
    if (start > last) parts.push({ text: source.slice(last, start) })
    const found = match[2]
    const entry = sorted.find((candidate) => candidate.word.toLowerCase() === found.toLowerCase())
    parts.push({ text: found, key: entry.key })
    last = start + found.length
  }
  if (last < source.length) parts.push({ text: source.slice(last) })
  return parts
}
