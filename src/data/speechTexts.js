// =========================================================
// speechTexts.js — รวบรวม "ข้อความภาษาอังกฤษที่เว็บต้องพูด" จากข้อมูลบทเรียน
// ใช้โดย:
//   - scripts/generate-audio.mjs → สร้างไฟล์เสียง Kokoro ให้ครบทุกข้อความ
//   - data.test.js               → ตรวจว่าทุกข้อความมีไฟล์เสียงแล้ว
// (ไฟล์นี้ไม่ได้ถูกใช้ในหน้าเว็บ)
//
// ข้อความต้องตรงกับที่ส่งให้ SpeakButton ทุกตัวอักษร เพราะใช้เป็น key หาไฟล์เสียง
// =========================================================
import { RECAST_OPENERS } from '../utils/recast.js'
import { swapVariants } from '../utils/swap.js'

/**
 * @param lessons        บทเรียนทั้งหมด (lessons.json)
 * @param soundPractice  ชุดฝึกเสียง (game.json) — คู่คำ think / sink …
 * @param phonicsSounds  เสียง phonics (phonics.json) — คำตัวอย่างของแต่ละเสียง
 */
export function collectSpeechTexts({ lessons, soundPractice = [], phonicsSounds = [] }) {
  const texts = new Set()
  const add = (text) => {
    const clean = typeof text === 'string' ? text.trim() : ''
    if (clean) texts.add(clean)
  }

  for (const lesson of lessons) {
    for (const item of lesson.items) {
      add(item.word ?? item.target) // คำ/ประโยคบนการ์ด (VocabCard)
      for (const line of item.parentese ?? []) add(line) // ประโยคแบบพ่อแม่พูด (Stage 1–3)
      add(item.question) // คำถามของพ่อแม่ (Stage 4)
      for (const error of item.commonErrors ?? []) add(error.correct) // ประโยคที่ทวนกลับ (recast)
      // สลับคำในบริบท (Stage 4+): คำที่ใช้แทน + ประโยคที่สลับแล้วทุกแบบ
      for (const keyword of item.keywords ?? []) for (const alternative of keyword.alternatives) add(alternative.word)
      for (const variant of swapVariants(item)) add(variant.text)
      for (const other of item.alsoSay ?? []) add(other.text) // แบบสุภาพ/แบบกันเอง (ประโยคในบริบท)
      add(item.pairWith) // คำคู่ในเกม Minimal Pair Duel (Stage 6)
      if (item.target && item.word) add(item.word) // sight word: พูดคำเดี่ยว ๆ ด้วย (ประโยคอยู่ใน target)
    }
  }

  // Stage 6 phonics: คำตัวอย่างของแต่ละเสียง ("s as in sun, sock, see")
  for (const sound of phonicsSounds) for (const example of sound.examples ?? []) add(example)
  // โหมดฝึกเสียง: คู่คำเสียงคล้าย
  for (const set of soundPractice) {
    for (const pair of set.pairs ?? []) {
      add(pair.a)
      add(pair.b)
    }
  }

  // คำขึ้นต้นตอนทวนกลับ ("Yes!", "Listen." …) — พูดคู่กับประโยคที่ถูก
  for (const opener of [...RECAST_OPENERS.error, ...RECAST_OPENERS.model]) add(opener)

  return [...texts].sort()
}
