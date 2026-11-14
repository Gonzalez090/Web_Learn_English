// =========================================================
// audioPath.js — ชื่อไฟล์เสียงเจ้าของภาษา (Kokoro) ของข้อความหนึ่ง
//   /audio/<sha1("เสียง|ความเร็ว|ข้อความ") 12 ตัวแรก>.mp3
// ใช้ร่วมกัน 2 ที่ (ต้องตรงกันเสมอ):
//   - scripts/generate-audio.mjs → ตั้งชื่อไฟล์ตอนสร้างเสียง
//   - utils/speech.js           → หน้าเว็บคำนวณชื่อไฟล์เอง ไม่ต้องโหลดสารบัญเสียง (audioManifest.json) ทั้งก้อน
// audioManifest.json ยังสร้างอยู่ — ใช้ใน test ตรวจว่าทุกข้อความมีไฟล์เสียงครบ
// (ใส่ .js ใน import เพราะสคริปต์ Node นำเข้าไฟล์นี้)
// =========================================================
import { sha1Hex } from './sha1.js'

export const AUDIO_VOICE = 'af_heart' // เสียงผู้หญิงอเมริกันของ Kokoro
export const AUDIO_SPEEDS = { normal: 1.0, slow: 0.75 } // ความเร็วของไฟล์ที่สร้าง

/**
 * @param text  ข้อความ (ตัดช่องว่างหัว-ท้ายก่อน)
 * @param speed 'normal' | 'slow'
 * @returns '/audio/xxxxxxxxxxxx.mp3' หรือ null (ข้อความว่าง / ความเร็วที่ไม่มีไฟล์)
 */
export function audioPathFor(text, speed) {
  const clean = String(text ?? '').trim()
  if (!clean || !Object.hasOwn(AUDIO_SPEEDS, speed)) return null
  return `/audio/${sha1Hex(`${AUDIO_VOICE}|${speed}|${clean}`).slice(0, 12)}.mp3`
}
