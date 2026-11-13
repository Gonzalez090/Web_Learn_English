// =========================================================
// progressStore — ที่เก็บ "ความคืบหน้า" ของผู้เรียน
// บันทึกลง localStorage อัตโนมัติ (key: et-progress)
// วันที่ทั้งหมดใช้รูปแบบ 'YYYY-MM-DD' ตามเวลาเครื่อง (ไม่ใช้ UTC)
// เลเวลและฉายาคำนวณจาก xp ไม่เก็บซ้ำ (ขั้นที่ 13)
// =========================================================
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ค่าเริ่มต้นของผู้เรียนใหม่
export const INITIAL_PROGRESS = {
  xp: 0, // XP สะสมทั้งหมด
  streak: { count: 0, lastActiveDate: null }, // เรียนต่อเนื่องกี่วัน (ขั้นที่ 13)
  streakFreeze: { available: 1, weekId: null }, // Streak Freeze 1 ครั้ง/สัปดาห์ (ขั้นที่ 13)
  unlockedStages: [1], // Stage ที่ปลดล็อกแล้ว
  unlockedPlaces: ['home'], // สถานที่ที่ปลดล็อกแล้ว (ขั้นที่ 14)
  lessonProgress: {}, // { [lessonId]: { completed, bestScore, attempts, completedAt } }
  collection: [], // วลีที่สะสมได้ (ขั้นที่ 20)
  npcFriendship: {}, // { [npcId]: แต้มความสนิท } (ขั้นที่ 15)
  dailyMissions: { date: null, missions: [] }, // ภารกิจของวันนี้ (ขั้นที่ 13)
  speakingMinutes: {}, // { 'YYYY-MM-DD': นาทีที่พูด } (ขั้นที่ 18)
  lastVisitDate: null, // ใช้ตรวจว่าหายไปหลายวันหรือไม่ (ขั้นที่ 15)
}

export const useProgressStore = create(
  persist(
    (set) => ({
      ...INITIAL_PROGRESS,

      // ปลดล็อกทุก Stage และทุกสถานที่ — ใช้ในหน้า /dev เท่านั้น
      devUnlockAll: (stageIds, placeIds) =>
        set({
          unlockedStages: [...stageIds],
          unlockedPlaces: Array.from(new Set([...INITIAL_PROGRESS.unlockedPlaces, ...placeIds])),
        }),

      // ล้างความคืบหน้าทั้งหมด กลับเป็นผู้เรียนใหม่
      resetProgress: () => set(INITIAL_PROGRESS),
    }),
    {
      name: 'et-progress',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // เมื่อ version เพิ่มในขั้นถัด ๆ ไป ให้แปลงข้อมูลเก่าที่นี่
      migrate: (persisted) => ({ ...INITIAL_PROGRESS, ...persisted }),
    },
  ),
)
