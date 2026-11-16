// =========================================================
// lessonItems.js — เตรียมข้อของบทก่อนเล่น (ข้อมูลที่คิดจากลำดับในบทได้ ไม่ต้องเขียนซ้ำใน lessons.json)
// - บทสนทนา (dialogue) / คำคล้องจอง (rhyme): 1 ข้อ = 1 บรรทัด เรียงตามลำดับในบท
//     question / questionTh = บรรทัดก่อนหน้า → ขั้นพูดเองเป็นแบบ "ได้ยินบรรทัดก่อน แล้วพูดบรรทัดของเรา"
//     (อีกฝ่ายพูด → เราตอบ / พ่อแม่ร้องท่อนแรก → ลูกร้องท่อนต่อ) ใช้ทั้งในบท ฝึกซ้ำ และทบทวน
// - คำคล้องจอง: คู่บรรทัดแบบ AABB (บรรทัด 1–2, 3–4, …) → บรรทัดที่ 2 ของคู่มี rhymeFill
//     = เว้นคำท้ายไว้ให้เลือกคำที่คล้องจองกับบรรทัดแรก (ตัวหลอก = คำท้ายของคู่อื่น ซึ่งไม่คล้องจองกัน)
// (ฟังก์ชันล้วน → ทดสอบได้)
// =========================================================
import { createRandom, hashString, shuffle } from './random.js'

// ประเภทบทที่ข้อเป็น "บรรทัดต่อเนื่องกัน" (บรรทัดก่อนหน้าเป็นตัวนำของบรรทัดถัดไป)
const LINE_TYPES = new Set(['dialogue', 'rhyme'])

// ตัวเลือกคำท้ายในขั้นเติมคำคล้องจอง: คำตอบ + ตัวหลอกไม่เกินกี่คำ
const RHYME_DISTRACTORS = 2

/**
 * แยกคำสุดท้ายของบรรทัด
 * @returns { before, word, after } เช่น "Pillow for my sleepy head." → { before: 'Pillow for my sleepy', word: 'head', after: '.' }
 *          ไม่มีคำ → null
 */
export function splitLastWord(text) {
  const match = String(text ?? '')
    .trim()
    .match(/^(.*?)([A-Za-z][A-Za-z'’-]*)([^A-Za-z]*)$/s)
  if (!match) return null
  return { before: match[1].trim(), word: match[2], after: match[3] }
}

// คำท้ายของบรรทัด (ตัวเล็ก) — ใช้เทียบ
const endWordOf = (text) => splitLastWord(text)?.word.toLowerCase() ?? ''

// คำเดียวกันไหม (ไม่สนตัวพิมพ์)
export const sameWord = (a, b) => String(a ?? '').toLowerCase() === String(b ?? '').toLowerCase()

/**
 * ข้อมูลขั้น "เติมคำท้ายที่คล้องจอง" ของบรรทัดที่ index (บรรทัดที่ 2 ของคู่เท่านั้น ไม่ใช่ → null)
 * @returns { word, before, after, rhymesWith, couplet, choices }
 *   choices คงที่ทุกครั้ง (ตาม id) — ตัวหลอกสุ่มลำดับ ส่วนคำตอบเลื่อนไปทีละช่องในแต่ละคู่ของเพลงเดียวกัน
 *   (คู่ติดกันคำตอบไม่อยู่ช่องเดิม → เดาจากตำแหน่งไม่ได้)
 */
export function rhymeFillFor(lines, index) {
  if (index % 2 !== 1 || !lines[index] || !lines[index - 1]) return null
  const parts = splitLastWord(lines[index].target)
  if (!parts) return null
  const answer = parts.word.toLowerCase()
  const couplet = coupletOf(index)
  // ตัวหลอก = คำท้ายของคู่อื่น (ไม่ซ้ำ ไม่ใช่คำตอบ)
  const others = [
    ...new Set(
      lines
        .filter((_, lineIndex) => coupletOf(lineIndex) !== couplet)
        .map((line) => endWordOf(line.target))
        .filter((word) => word && word !== answer),
    ),
  ]
  const random = createRandom(hashString(lines[index].id ?? String(index)))
  const choices = shuffle(others, random).slice(0, RHYME_DISTRACTORS)
  const slot = (hashString(lines[0].id ?? '') + couplet) % (choices.length + 1)
  choices.splice(slot, 0, answer)
  return {
    word: parts.word,
    before: parts.before,
    after: parts.after,
    rhymesWith: splitLastWord(lines[index - 1].target)?.word ?? '',
    couplet,
    choices,
  }
}

/**
 * ข้อของบทที่พร้อมเล่น — บทสนทนา/คำคล้องจองได้ตัวนำ (บรรทัดก่อนหน้า) + ขั้นเติมคำ (คำคล้องจอง)
 * บทประเภทอื่นคืน items เดิม
 */
export function prepareLessonItems(lesson) {
  const items = lesson?.items ?? []
  if (!LINE_TYPES.has(lesson?.type)) return items
  return items.map((item, index) => {
    const previous = items[index - 1]
    const prepared = previous ? { ...item, question: previous.target, questionTh: previous.translationTh } : { ...item }
    if (lesson.type === 'rhyme') {
      const fill = rhymeFillFor(items, index)
      if (fill) prepared.rhymeFill = fill
    }
    return prepared
  })
}

/**
 * นิทาน Stage 6: หน้าแบบ "พ่อแม่อ่านให้ฟัง" (readAloud) ใช้กับขั้นฟังทั้งเรื่อง — ขั้นอ่านเองใช้ target เดิม
 * หน้าที่ไม่มี readAloud คืนตามเดิม
 */
export const readAloudItems = (items) =>
  (items ?? []).map((item) =>
    item.readAloud
      ? {
          ...item,
          target: item.readAloud,
          translationTh: item.readAloudTh,
          readingTh: item.readAloudReadingTh,
          stressWords: undefined,
          intonation: undefined,
        }
      : item,
  )

// ผู้พูดของบรรทัด (บทสนทนา) → { id, name, nameTh } หรือ null
export const speakerOf = (lesson, item) => lesson?.speakers?.find((speaker) => speaker.id === item?.speaker) ?? null

// คำคล้องจอง: บรรทัดนี้อยู่คู่ที่เท่าไร (0, 1, …) — ใช้ระบายสีคำท้ายที่คล้องจองกันให้เป็นสีเดียวกัน
export function coupletOf(index) {
  return Math.floor(index / 2)
}
