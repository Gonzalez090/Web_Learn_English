// =========================================================
// recast.js — การตอบกลับแบบพ่อแม่ (Recast) ส่วนที่ 2.4 ของสเปก
// ผู้เรียนพูดยังไม่ถูก → ห้ามบอกว่า "ผิด" ให้ทวนประโยคที่ถูกกลับมาอย่างเป็นธรรมชาติ แล้วให้ลองใหม่
//   - ตรงกับรูปแบบผิดที่พบบ่อย (item.commonErrors) → ตอบรับก่อน แล้วทวนแบบที่ถูก เช่น "he go school" → "Yes! He goes to school."
//   - ไม่ตรงรูปแบบไหน และยังไม่ผ่าน → พูดประโยคเป้าหมายให้ฟังอีกครั้ง เช่น "Listen. He goes to school."
// commonErrors[].pattern = regex บนข้อความที่ normalize แล้ว (ตัวเล็ก ตัดเครื่องหมาย เก็บ ' ไว้)
//   เทียบทั้งรูปที่ระบบได้ยิน ("don't") และรูปที่ขยายแล้ว ("do not") → เขียน pattern แบบไหนก็จับได้
// (ฟังก์ชันล้วน ไม่แตะเบราว์เซอร์ → ทดสอบได้)
// =========================================================
// ใส่ .js เพราะ scripts/generate-audio.mjs (Node) นำเข้าไฟล์นี้ผ่าน speechTexts.js
import { normalizeWord } from './compareWords.js'

// คำขึ้นต้นตอนทวนกลับ (หมุนเวียนตามครั้งที่ลอง) — ทุกคำต้องมีไฟล์เสียง (รวบรวมใน speechTexts.js)
export const RECAST_OPENERS = {
  // สื่อความหมายได้แล้ว แต่รูปประโยคยังไม่ตรง → ตอบรับแบบพ่อแม่ แล้วทวนแบบที่ถูก
  error: ['Yes!', 'Right!', 'Oh, I see!', 'Yeah!'],
  // ยังฟังไม่ออกว่าจะพูดอะไร → พูดให้ฟังอีกครั้ง
  model: ['Listen.', 'Like this.'],
}

// ข้อความ → รูปที่ใช้เทียบกับ pattern: ตัวเล็ก, ' แบบโค้งเป็นแบบตรง, ตัดเครื่องหมาย (ยกเว้น '), เว้นวรรคเดียว
export function normalizeForPattern(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[^a-z0-9' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// รูปที่ขยายรูปย่อแล้ว ("I don't" → "i do not") — ใช้ตัวเดียวกับที่ให้คะแนน
const expandedForm = (text) => String(text ?? '').split(/\s+/).flatMap(normalizeWord).join(' ')

/**
 * หารูปแบบผิดที่พบบ่อยที่ตรงกับสิ่งที่ได้ยิน
 * @returns { pattern, correct } หรือ null
 */
export function findCommonError(commonErrors, transcript) {
  if (!Array.isArray(commonErrors) || !transcript) return null
  const forms = [...new Set([normalizeForPattern(transcript), expandedForm(transcript)])].filter(Boolean)
  for (const error of commonErrors) {
    let regex
    try {
      regex = new RegExp(error.pattern)
    } catch {
      continue // pattern เสีย (test ข้อมูลจับได้อยู่แล้ว) — ข้ามไป ไม่ให้หน้าเว็บพัง
    }
    if (forms.some((form) => regex.test(form))) return error
  }
  return null
}

/**
 * ผลการพูด → ผลที่มีการทวนกลับ (ถ้าต้องทวน)
 * @param item    ข้อในบทเรียน { target, commonErrors }
 * @param result  ผลจาก compareSpeech { score, passed, words, heard }
 * @param attempt ครั้งที่ลอง (เริ่ม 0) — ใช้เลือกคำขึ้นต้นหมุนเวียน ไม่สุ่ม
 * @returns result เดิม + recast: null | { kind: 'error' | 'model', opener, correct, lines }
 *   ตรงรูปแบบผิดที่พบบ่อย → passed = false เสมอ (แม้คะแนนรายคำถึงเกณฑ์) เพื่อให้ลองพูดแบบที่ถูกอีกครั้ง
 */
export function applyRecast(item, result, attempt = 0) {
  const error = result.score < 100 ? findCommonError(item?.commonErrors, result.heard) : null
  if (!error && result.passed) return { ...result, recast: null }

  const kind = error ? 'error' : 'model'
  const openers = RECAST_OPENERS[kind]
  const opener = openers[Math.abs(attempt) % openers.length]
  const correct = error?.correct || item?.target || ''
  return { ...result, passed: false, recast: { kind, opener, correct, lines: [opener, correct] } }
}
