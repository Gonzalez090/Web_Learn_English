// =========================================================
// toastStore — ข้อความแจ้งเตือนสั้น ๆ ที่ลอยขึ้นมาแล้วหายเอง (ไม่บันทึกลง localStorage)
// ชนิด (kind):
//   'levelUp' { level }          ขึ้นเลเวลใหม่ (+ ฉายาใหม่ถ้าเปลี่ยน)
//   'mission' { missionId, xp }  ภารกิจรายวันสำเร็จ
//   'freeze'  { count }          ใช้ Streak Freeze แทนวันที่พลาด
//   'friendship' { npcId, level } สนิทกับ NPC ขึ้นระดับใหม่ (ขั้นที่ 15)
//   'planDone'   {}             ทำแผนวันนี้ครบทุกขั้น (ขั้นที่ 18)
// เก็บแค่ชนิด + ข้อมูล → Toaster แปลงเป็นข้อความตามภาษาที่เลือกตอนแสดง
// =========================================================
import { create } from 'zustand'

const MAX_TOASTS = 3
let nextId = 1

export const useToastStore = create((set) => ({
  toasts: [],
  show: (toast) => set((state) => ({ toasts: [...state.toasts, { ...toast, id: nextId++ }].slice(-MAX_TOASTS) })),
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}))
