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

export const AUDIO_VOICE = 'af_heart' // เสียงหลักของเว็บ: ผู้หญิงอเมริกันของ Kokoro (คุณภาพดีที่สุด)
export const AUDIO_SPEEDS = { normal: 1.0, slow: 0.75 } // ความเร็วของไฟล์ที่สร้าง

// เสียง Kokoro v1.0 ที่ NPC เลือกใช้ได้ (world.json npc.voice — ขั้นที่ 28-1: ผสมสำเนียงอเมริกัน a* + อังกฤษ b*)
//   ตัวแรกของชื่อ: a = อเมริกัน / b = อังกฤษ, ตัวที่สอง: f = ผู้หญิง / m = ผู้ชาย
export const NPC_VOICES = ['af_bella', 'af_nicole', 'am_michael', 'am_fenrir', 'am_puck', 'bf_emma', 'bf_isabella', 'bm_george', 'bm_fable']

/**
 * @param text  ข้อความ (ตัดช่องว่างหัว-ท้ายก่อน)
 * @param speed 'normal' | 'slow'
 * @param voice เสียง Kokoro (ค่าเริ่มต้น = เสียงหลัก) — เสียงหลักใช้ชื่อไฟล์แบบเดิม (ไม่ต้องสร้างไฟล์เก่าใหม่)
 * @returns '/audio/xxxxxxxxxxxx.mp3' หรือ null (ข้อความว่าง / ความเร็วที่ไม่มีไฟล์)
 */
export function audioPathFor(text, speed, voice = AUDIO_VOICE) {
  const clean = String(text ?? '').trim()
  if (!clean || !Object.hasOwn(AUDIO_SPEEDS, speed)) return null
  return `/audio/${sha1Hex(`${voice || AUDIO_VOICE}|${speed}|${clean}`).slice(0, 12)}.mp3`
}
