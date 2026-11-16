// =========================================================
// settingsStore — ที่เก็บ "การตั้งค่า" ของผู้ใช้
// บันทึกลง localStorage อัตโนมัติ (key: et-settings) ผ่าน zustand persist
// =========================================================
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ภาษาของหน้าเว็บที่รองรับ
export const UI_LANGUAGES = ['th', 'en']

// ค่าเริ่มต้นของการตั้งค่าทั้งหมด
export const DEFAULT_SETTINGS = {
  uiLanguage: 'th', // ภาษาของหน้าเว็บ: 'th' | 'en'
  thaiReading: 'auto', // คำอ่านไทย: 'auto' (ปิดใน Stage 1–5) | 'on' | 'off'
  thaiTranslation: 'hidden', // คำแปลไทย: 'hidden' (ซ่อนไว้ กดดูได้) | 'shown'
  speechRate: 'normal', // ความเร็วเสียงเริ่มต้น: 'normal' | 'slow'
  voiceURI: null, // เสียงอ่านที่เลือก (null = ให้ระบบเลือกเสียง en-US เอง)
  dailyGoal: 10, // เป้าหมายรายวัน (นาที): 5 | 10 | 15 | 20
  soundEffects: true, // เปิด/ปิดเสียงเอฟเฟกต์
  introSeen: false, // ดูหน้าแนะนำวิธีเรียน (/welcome) แล้วหรือยัง — ยังไม่เคย → หน้าแรกพาไปหน้าแนะนำก่อน
}

export const useSettingsStore = create(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      // เปลี่ยนภาษาหน้าเว็บ (รับเฉพาะภาษาที่รองรับ)
      setUiLanguage: (lng) => {
        if (UI_LANGUAGES.includes(lng)) set({ uiLanguage: lng })
      },

      // เปลี่ยนค่าตั้งค่าทีละ key เช่น setSetting('thaiReading', 'on')
      setSetting: (key, value) => {
        if (key in DEFAULT_SETTINGS) set({ [key]: value })
      },

      // กลับเป็นค่าเริ่มต้นทั้งหมด
      resetSettings: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'et-settings',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      // แปลงข้อมูลเก่า: version 1 → 2 เพิ่ม introSeen — ผู้ใช้เดิมใช้เว็บมาแล้ว ไม่ต้องเห็นหน้าแนะนำ
      migrate: (persisted, version) => ({
        ...DEFAULT_SETTINGS,
        ...persisted,
        ...(version < 2 ? { introSeen: true } : {}),
      }),
    },
  ),
)
