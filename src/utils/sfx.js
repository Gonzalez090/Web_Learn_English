// =========================================================
// sfx.js — เสียงเอฟเฟกต์สั้น ๆ สังเคราะห์ด้วย Web Audio (ไม่ต้องมีไฟล์เสียง) (ส่วนที่ 8.6, ขั้นที่ 20)
//   playSfx('pass')     พูด/เขียนผ่าน           — ติ๊ง 2 โน้ตขึ้น
//   playSfx('collect')  ได้การ์ดวลีใหม่           — 3 โน้ตระยิบ
//   playSfx('special')  ได้การ์ดพิเศษ (สำนวน/สแลง) — 5 โน้ตไล่ขึ้น
//   playSfx('mission')  ภารกิจสำเร็จ / แผนวันนี้ครบ
//   playSfx('unlock')   ปลดล็อก Stage / สถานที่ / สนิทกับ NPC ขึ้นระดับ
//   playSfx('levelUp')  ขึ้นเลเวล / ชนะ Boss
//   playSfx('complete') เรียนจบบท
// - ปิดได้ในหน้าตั้งค่า (et-settings.soundEffects)
// - เรียกหลายเสียงพร้อมกัน (เช่น พูดผ่าน + ได้การ์ด + ภารกิจสำเร็จ ในจังหวะเดียว) → เล่นเฉพาะเสียงที่สำคัญที่สุด
// - เสียงเบา สั้น ไม่กลบเสียงพูดของบทเรียน / ไม่มีเสียงสำหรับ "ยังไม่ผ่าน" (ไม่ตำหนิผู้เรียน)
// =========================================================
import { useSettingsStore } from '../store/settingsStore'

const NOTE = { C5: 523.25, E5: 659.25, G5: 783.99, A5: 880, B5: 987.77, C6: 1046.5, D6: 1174.66, E6: 1318.51, G6: 1567.98 }

// เสียงแต่ละชนิด: priority (สูง = สำคัญกว่า), โน้ต [ความถี่, เริ่ม (วิ), ยาว (วิ)], รูปคลื่น
const SOUNDS = {
  pass: { priority: 1, wave: 'sine', notes: [[NOTE.C6, 0, 0.09], [NOTE.E6, 0.08, 0.16]] },
  collect: { priority: 2, wave: 'triangle', notes: [[NOTE.G5, 0, 0.08], [NOTE.B5, 0.07, 0.08], [NOTE.D6, 0.14, 0.2]] },
  mission: { priority: 3, wave: 'triangle', notes: [[NOTE.G5, 0, 0.1], [NOTE.C6, 0.1, 0.24]] },
  complete: { priority: 3, wave: 'triangle', notes: [[NOTE.C5, 0, 0.1], [NOTE.G5, 0.1, 0.1], [NOTE.C6, 0.2, 0.3]] },
  special: {
    priority: 4,
    wave: 'triangle',
    notes: [[NOTE.C6, 0, 0.07], [NOTE.E6, 0.06, 0.07], [NOTE.G6, 0.12, 0.07], [NOTE.E6, 0.18, 0.07], [NOTE.G6, 0.24, 0.26]],
  },
  unlock: { priority: 5, wave: 'triangle', notes: [[NOTE.E5, 0, 0.1], [NOTE.G5, 0.1, 0.1], [NOTE.C6, 0.2, 0.12], [NOTE.E6, 0.32, 0.3]] },
  levelUp: {
    priority: 6,
    wave: 'triangle',
    notes: [[NOTE.C5, 0, 0.1], [NOTE.E5, 0.1, 0.1], [NOTE.G5, 0.2, 0.1], [NOTE.C6, 0.3, 0.14], [NOTE.G5, 0.44, 0.08], [NOTE.C6, 0.52, 0.4]],
  },
}

export const SFX_NAMES = Object.keys(SOUNDS)

const VOLUME = 0.12
let context = null
let pending = null // เสียงที่ขอในจังหวะเดียวกัน (รวมแล้วเล่นอันที่สำคัญที่สุด)

function getContext() {
  const AudioContextClass = typeof window !== 'undefined' ? window.AudioContext || window.webkitAudioContext : null
  if (!AudioContextClass) return null
  if (!context) context = new AudioContextClass()
  if (context.state === 'suspended') context.resume().catch(() => {})
  return context
}

function render(name) {
  const sound = SOUNDS[name]
  const audio = sound && getContext()
  if (!audio) return
  const start = audio.currentTime + 0.01
  for (const [frequency, offset, length] of sound.notes) {
    const oscillator = audio.createOscillator()
    const gain = audio.createGain()
    oscillator.type = sound.wave
    oscillator.frequency.value = frequency
    // เข้าเร็ว ออกนุ่ม (ไม่มีเสียงคลิก)
    gain.gain.setValueAtTime(0, start + offset)
    gain.gain.linearRampToValueAtTime(VOLUME, start + offset + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + length)
    oscillator.connect(gain).connect(audio.destination)
    oscillator.start(start + offset)
    oscillator.stop(start + offset + length + 0.02)
  }
}

// เลือกเสียงที่สำคัญกว่า (ใช้ตอนหลายเหตุการณ์เกิดพร้อมกัน)
export const louder = (a, b) => (!a ? b : !b ? a : SOUNDS[b].priority > SOUNDS[a].priority ? b : a)

export function playSfx(name) {
  if (!SOUNDS[name]) return
  try {
    if (!useSettingsStore.getState().soundEffects) return
  } catch {
    return
  }
  const queued = pending !== null
  pending = louder(pending, name)
  if (queued) return
  setTimeout(() => {
    const chosen = pending
    pending = null
    try {
      render(chosen)
    } catch {
      // เบราว์เซอร์เล่นเสียงไม่ได้ → เงียบไป ไม่กระทบการเรียน
    }
  }, 0)
}
