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

export function collectSpeechTexts(lessonsData) {
  const texts = new Set()
  const add = (text) => {
    const clean = typeof text === 'string' ? text.trim() : ''
    if (clean) texts.add(clean)
  }

  for (const lesson of lessonsData.lessons) {
    for (const item of lesson.items) {
      add(item.word ?? item.target) // คำ/ประโยคบนการ์ด (VocabCard)
      for (const line of item.parentese ?? []) add(line) // ประโยคแบบพ่อแม่พูด (Stage 1–3)
      add(item.question) // คำถามของพ่อแม่ (Stage 4)
      for (const error of item.commonErrors ?? []) add(error.correct) // ประโยคที่ทวนกลับ (recast)
    }
  }

  // คำขึ้นต้นตอนทวนกลับ ("Yes!", "Listen." …) — พูดคู่กับประโยคที่ถูก
  for (const opener of [...RECAST_OPENERS.error, ...RECAST_OPENERS.model]) add(opener)

  return [...texts].sort()
}
