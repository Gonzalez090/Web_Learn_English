// =========================================================
// toastStore — ข้อความแจ้งเตือนสั้น ๆ ที่ลอยขึ้นมาแล้วหายเอง (ไม่บันทึกลง localStorage)
// ชนิด (kind):
//   'levelUp' { level, from }    ขึ้นเลเวลใหม่จากเลเวล from (+ ฉายาใหม่ / ของใหม่ของห้อง)
//   'mission' { missionId, xp }  ภารกิจรายวันสำเร็จ
//   'freeze'  { count }          ใช้ Streak Freeze แทนวันที่พลาด
//   'friendship' { npcId, level } สนิทกับ NPC ขึ้นระดับใหม่ (ขั้นที่ 15)
//   'planDone'   {}             ทำแผนวันนี้ครบทุกขั้น (ขั้นที่ 18)
//   'bossDone'   { xp }         ชนะ Boss Conversation ของสัปดาห์ (ขั้นที่ 18-2)
//   'collect'    { text, rarity, count } ได้การ์ดวลีใหม่ (rarity 'idiom' | 'slang' = การ์ดพิเศษ) (ขั้นที่ 20)
//   'break'      {}             เรียนต่อเนื่องครบ 20 นาที ชวนพัก (ไม่มีเสียง — hooks/useStudyTimer.js)
// แสดงแล้วเล่นเสียงเอฟเฟกต์ของชนิดนั้น (utils/sfx.js — หลายอันพร้อมกันเล่นแค่เสียงที่สำคัญสุด)
// เก็บแค่ชนิด + ข้อมูล → Toaster แปลงเป็นข้อความตามภาษาที่เลือกตอนแสดง
// =========================================================
import { create } from 'zustand'
import { playSfx } from '../utils/sfx'

// ชนิดการแจ้งเตือน → เสียงเอฟเฟกต์
const TOAST_SFX = {
  levelUp: 'levelUp',
  bossDone: 'levelUp',
  mission: 'mission',
  planDone: 'mission',
  friendship: 'unlock',
}
const sfxOf = (toast) => (toast.kind === 'collect' ? (toast.rarity ? 'special' : 'collect') : TOAST_SFX[toast.kind])

const MAX_TOASTS = 3
let nextId = 1

export const useToastStore = create((set) => ({
  toasts: [],
  show: (toast) => {
    set((state) => ({ toasts: [...state.toasts, { ...toast, id: nextId++ }].slice(-MAX_TOASTS) }))
    const sound = sfxOf(toast)
    if (sound) playSfx(sound)
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}))
