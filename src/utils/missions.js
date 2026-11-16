// =========================================================
// missions.js — ภารกิจรายวัน (ส่วนที่ 8.3)
// - ทุกวันสุ่ม 3 ภารกิจจาก game.json → dailyMissionPool (สุ่มจากวันที่ → วันเดียวกันได้ชุดเดิม)
// - สุ่มเฉพาะภารกิจที่ฟีเจอร์มีแล้วในเว็บ และไม่ซ้ำชนิดกันในวันเดียว
// - เว็บแจ้ง "เหตุการณ์" (เช่น พูดผ่าน 1 ครั้ง) → ภารกิจชนิดนั้นคืบหน้า → ครบเป้า = สำเร็จ ได้ XP รางวัล
// =========================================================
import { createRandom, hashString, shuffle } from './random'

// ชนิดเหตุการณ์ทั้งหมดที่ภารกิจใช้ได้ → ขั้นที่ฟีเจอร์นั้นเริ่มมี
export const MISSION_EVENTS = {
  listen: 4, // ฟังคำ/ประโยคในบทเรียน 1 ข้อ
  speakPass: 4, // พูดตามผ่าน 1 ครั้ง
  gameCorrect: 4, // มินิเกม: ตอบถูกตั้งแต่ครั้งแรก 1 รอบ
  gamePlay: 4, // เล่นมินิเกมจบ 1 เกม
  lessonComplete: 4, // เรียนจบ 1 บท
  perfectLesson: 4, // จบบทได้ 100%
  xp: 13, // เก็บ XP จากการเรียน (ไม่นับ XP รางวัลภารกิจ)
  sound: 8, // ฝึกเสียงที่คนไทยออกยาก 1 ชุด
  phrase: 10, // ฝึกวลีใช้งานจริง 1 วลี
  conversation: 11, // คุยบทสนทนาสุ่มจบ 1 รอบ
  npcTalk: 15, // คุยกับ NPC 1 ครั้ง
  review: 16, // ทบทวน 1 รายการ
  speakingMinutes: 18, // พูดภาษาอังกฤษ 1 นาที
}

// เหตุการณ์ที่เว็บแจ้งได้แล้วตอนนี้ — ทำขั้นใหม่เสร็จ ให้เพิ่มเหตุการณ์ของขั้นนั้นที่นี่
export const AVAILABLE_MISSION_EVENTS = new Set([
  'listen',
  'speakPass',
  'gameCorrect',
  'gamePlay',
  'lessonComplete',
  'perfectLesson',
  'xp',
  'review',
  'sound', // โหมดฝึกเสียง (ขั้นที่ 8 + 21ก)
])

export const MISSIONS_PER_DAY = 3

// เลือกภารกิจของวันนั้น (ผลเดิมทุกครั้งสำหรับวันเดียวกัน)
export function pickDailyMissions(pool, today, count = MISSIONS_PER_DAY) {
  const random = createRandom(hashString(today))
  const available = pool.filter((mission) => AVAILABLE_MISSION_EVENTS.has(mission.event))
  const picked = []
  const usedEvents = new Set()
  for (const mission of shuffle(available, random)) {
    if (usedEvents.has(mission.event)) continue
    picked.push(mission)
    usedEvents.add(mission.event)
    if (picked.length === count) break
  }
  return picked
}

// ถ้ายังไม่มีภารกิจของวันนี้ → สร้างใหม่ (คืน object เดิมถ้าเป็นของวันนี้อยู่แล้ว)
export function ensureDailyMissions(daily, pool, today) {
  if (daily?.date === today && daily.missions?.length) return daily
  return {
    date: today,
    missions: pickDailyMissions(pool, today).map((mission) => ({ id: mission.id, progress: 0, done: false })),
  }
}

/**
 * แจ้งเหตุการณ์ → อัปเดตความคืบหน้า
 * @returns { daily (object ใหม่ถ้ามีอะไรเปลี่ยน), completed: [ภารกิจที่เพิ่งสำเร็จ] }
 */
export function applyMissionEvent(daily, pool, event, amount = 1) {
  if (!daily?.missions || !(amount > 0)) return { daily, completed: [] }
  const completed = []
  let changed = false
  const missions = daily.missions.map((entry) => {
    const mission = pool.find((item) => item.id === entry.id)
    if (!mission || entry.done || mission.event !== event) return entry
    changed = true
    const progress = Math.min(mission.target, entry.progress + amount)
    const done = progress >= mission.target
    if (done) completed.push(mission)
    return { ...entry, progress, done }
  })
  return { daily: changed ? { ...daily, missions } : daily, completed }
}

// XP รางวัลรวมของภารกิจที่สำเร็จ
export const missionReward = (missions) => missions.reduce((sum, mission) => sum + (mission.xp ?? 0), 0)
