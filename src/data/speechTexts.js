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
import { expandScenarioTexts } from '../utils/conversation.js'

/**
 * @param lessons        บทเรียนทั้งหมด (lessons.json)
 * @param soundPractice  ชุดฝึกเสียง (game.json) — คู่คำ think / sink …
 * @param phonicsSounds  เสียง phonics (phonics.json) — คำตัวอย่างของแต่ละเสียง
 * @param phrases        คลังวลี (phrases.json) { phrases, textbookVsReal }
 * @param scenarios      บทสนทนาสุ่ม (scenarios.json) — บทอีกฝ่ายทุกแบบ + ตัวเลือกของเรา × ทุกค่าของช่องสุ่ม
 * @param npcs           NPC (world.json) — คำทัก "Long time no see!" + บทคุยแต่ละระดับความสนิท (NPC พูด + ประโยคตอบ)
 */
export function collectSpeechTexts({
  lessons,
  soundPractice = [],
  phonicsSounds = [],
  phrases = {},
  scenarios = [],
  npcs = [],
}) {
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
      add(item.readAloud) // นิทาน Stage 6: ฉบับพ่อแม่อ่านให้ฟัง
      if (item.target && item.word) add(item.word) // sight word: พูดคำเดี่ยว ๆ ด้วย (ประโยคอยู่ใน target)
      // Stage 7 เขียน: ประโยคตัวอย่างแบบอื่น (บรรยายภาพ) + เรื่องตัวอย่างทีละภาพ (เรื่องสั้น)
      for (const example of item.examples ?? []) add(example.text)
      for (const line of item.lines ?? []) add(line.text)
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

  // คลังวลี: วลี + ประโยคตัวอย่าง / คำในตำรา vs คำที่ใช้จริง (ทั้งสองแบบถูกไวยากรณ์ — ฟังเทียบได้)
  // ⚠️ ไม่สร้างเสียงให้ thaiMistake.wrong (ภาษาอังกฤษที่ผิด — ไม่ให้ได้ยินเป็นตัวอย่าง)
  for (const phrase of phrases.phrases ?? []) {
    add(phrase.text)
    for (const example of phrase.examples ?? []) add(example.text)
  }
  for (const pair of phrases.textbookVsReal ?? []) {
    add(pair.textbook)
    for (const real of pair.real ?? []) add(real.text)
  }

  // บทสนทนาสุ่ม (ช่องสุ่มค่า → สร้างเสียงให้ทุกค่าที่สุ่มได้)
  for (const scenario of scenarios) for (const text of expandScenarioTexts(scenario)) add(text)

  // NPC ประจำสถานที่ (ขั้นที่ 15)
  for (const npc of npcs) {
    add(npc.welcomeBack?.text)
    for (const level of npc.levels ?? []) {
      add(level.npc.text)
      add(level.reply.text)
    }
  }

  // คำขึ้นต้นตอนทวนกลับ ("Yes!", "Listen." …) — พูดคู่กับประโยคที่ถูก
  for (const opener of [...RECAST_OPENERS.error, ...RECAST_OPENERS.model]) add(opener)

  return [...texts].sort()
}
