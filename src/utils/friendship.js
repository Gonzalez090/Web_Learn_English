// =========================================================
// friendship.js — NPC + ความสนิท + "Long time no see!" (ส่วนที่ 7, 8.6 — ขั้นที่ 15)
//   - คุยบทสนทนาสุ่มจบ 1 รอบกับ NPC คนไหน → ความสนิทกับคนนั้น +1 แต้ม
//   - ระดับ: เพิ่งรู้จัก 0 → คนคุ้นหน้า 3 → เพื่อน 6 → เพื่อนสนิท 10 แต้ม — ขึ้นระดับ = ปลดล็อกบทคุยที่ลึกขึ้น (npc.levels[ระดับ])
//   - เปิดเว็บหลังหายไป ≥ 3 วัน → NPC ทัก "Long time no see!" บนหน้าแรก (วันนั้นวันเดียว ปิดได้)
// (ฟังก์ชันล้วน → ทดสอบได้)
// =========================================================
import { daysBetween } from './date'

// แต้มขั้นต่ำของแต่ละระดับ (index = ระดับ) — ชื่อระดับอยู่ใน locales `npc.level.<index>`
export const FRIENDSHIP_THRESHOLDS = [0, 3, 6, 10]
export const MAX_FRIENDSHIP_LEVEL = FRIENDSHIP_THRESHOLDS.length - 1

// หายไปกี่วันถึงจะทัก
export const LONG_TIME_DAYS = 3

// แต้ม → ระดับ (0 – 3)
export function friendshipLevel(points = 0) {
  let level = 0
  FRIENDSHIP_THRESHOLDS.forEach((min, index) => {
    if (points >= min) level = index
  })
  return level
}

// ความคืบหน้าไประดับถัดไป → { level, next (null = สูงสุดแล้ว), remaining (คุยอีกกี่ครั้ง), ratio 0–1 }
export function friendshipProgress(points = 0) {
  const level = friendshipLevel(points)
  if (level >= MAX_FRIENDSHIP_LEVEL) return { level, next: null, remaining: 0, ratio: 1 }
  const from = FRIENDSHIP_THRESHOLDS[level]
  const to = FRIENDSHIP_THRESHOLDS[level + 1]
  return { level, next: level + 1, remaining: to - points, ratio: (points - from) / (to - from) }
}

// เพิ่มแต้มให้ NPC คนหนึ่ง → { friendship ใหม่, levelUp (ระดับใหม่ หรือ null) } — ไม่แก้ object เดิม
export function addFriendship(friendship, npcId, amount = 1) {
  const before = friendship?.[npcId] ?? 0
  const after = before + amount
  const next = { ...friendship, [npcId]: after }
  const levelBefore = friendshipLevel(before)
  const levelAfter = friendshipLevel(after)
  return { friendship: next, levelUp: levelAfter > levelBefore ? levelAfter : null }
}

// บันทึกการเข้าเว็บวันนี้ → { lastVisitDate, welcomeBack }
//   welcomeBack = { date: วันนี้, days: หายไปกี่วัน } ถ้าหายไป ≥ LONG_TIME_DAYS (ผู้ใช้ใหม่ / ยังไม่เคยบันทึก = ไม่ทัก)
//   เข้าเว็บซ้ำวันเดิม → คืนค่าเดิม (ไม่ทักซ้ำ ไม่ล้างคำทักที่ยังไม่ได้ปิด)
export function recordVisit({ lastVisitDate, welcomeBack }, today) {
  if (lastVisitDate === today) return { lastVisitDate, welcomeBack }
  const days = lastVisitDate ? daysBetween(lastVisitDate, today) : 0
  return {
    lastVisitDate: today,
    welcomeBack: days >= LONG_TIME_DAYS ? { date: today, days } : null,
  }
}

// NPC ที่จะมาทักตอนกลับมา: คนที่สนิทที่สุดในสถานที่ที่ปลดล็อกแล้ว (เท่ากัน → ตามลำดับในข้อมูล; ยังไม่สนิทใคร → คนแรก = ป้าโรส)
export function greeterNpc(npcs, friendship, unlockedPlaceIds) {
  const available = npcs.filter((npc) => unlockedPlaceIds.includes(npc.placeId))
  if (!available.length) return npcs[0] ?? null
  return available.reduce((best, npc) => ((friendship?.[npc.id] ?? 0) > (friendship?.[best.id] ?? 0) ? npc : best))
}
