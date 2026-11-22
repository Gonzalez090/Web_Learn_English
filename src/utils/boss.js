// =========================================================
// boss.js — Boss Conversation รายสัปดาห์ (ส่วนที่ 8.3, ขั้นที่ 18-2)
// - สัปดาห์ละ 1 บท: บทสนทนาสุ่มยาว + twist 2 ครั้ง + ไม่มีตัวเลือกคำตอบ (เหลือแค่คำใบ้ไทย) → /talk/<id>?mode=boss&seed=<ของสัปดาห์>
// - เลือกจากสถานการณ์ที่ twist ใช้พร้อมกันได้ (scenarioMeta.bossReady) อยู่ในสถานที่ที่เปิดแล้ว และไม่ล็อกตามความสนิท
//   เลือกด้วย hash ของสัปดาห์ (weekStartKey = วันจันทร์) → ทั้งสัปดาห์ได้บทเดิม seed เดิม (ค่าช่องสุ่มเดิม)
// - ชนะครั้งแรกของสัปดาห์ = โบนัส BOSS_BONUS_XP (progressStore.completeBoss — เก็บใน et-progress.bossWeek)
// - เปิดเมื่อพูดเป็นประโยคได้แล้ว (Stage 5 — เหมือนขั้นบทสนทนาของแผนรายวัน)
// (ฟังก์ชันล้วน → ทดสอบได้)
// =========================================================
import { hashString } from './random'

export const BOSS_BONUS_XP = 50

// seed ของสัปดาห์ (ค่าช่องสุ่ม เช่น เมนู/ราคา เหมือนเดิมทั้งสัปดาห์)
export const bossSeed = (weekId) => hashString(`boss:${weekId}`) % 1_000_000_000

/**
 * บท Boss ของสัปดาห์
 * @param scenarios  scenarioList (แบบย่อ มี bossReady)
 * @param isAvailable (scenario) => เล่นได้ไหม (สถานที่เปิดแล้ว + ไม่ล็อกตามความสนิท)
 * @returns สถานการณ์แบบย่อ หรือ null (ยังไม่มีบทที่เล่นได้)
 */
export function bossOfWeek(scenarios, weekId, isAvailable = () => true) {
  const candidates = scenarios
    .filter((scenario) => scenario.bossReady && isAvailable(scenario))
    .sort((a, b) => a.id.localeCompare(b.id))
  if (!candidates.length) return null
  return candidates[hashString(`boss-pick:${weekId}`) % candidates.length]
}

// ชนะ Boss ของสัปดาห์นี้แล้วหรือยัง
export const bossDoneThisWeek = (bossWeek, weekId) => Boolean(bossWeek?.weekId === weekId && bossWeek.done)

// บทที่กำลังเล่นคือ Boss ของสัปดาห์นี้จริงไหม (บทที่ล็อกไว้ใน bossWeek + seed ของสัปดาห์) — ไม่ใช่ = ฝึกซ้อม ไม่ได้โบนัส
export const isWeeklyBoss = (bossWeek, weekId, scenarioId, seed) =>
  Boolean(bossWeek?.weekId === weekId && bossWeek.scenarioId === scenarioId && seed === bossSeed(weekId))

/**
 * Boss ที่ใช้สัปดาห์นี้: บทที่ล็อกไว้ (ถ้ายังเล่นได้ หรือชนะไปแล้ว) ไม่งั้นเลือกใหม่ด้วย bossOfWeek
 * @param getMeta id → สถานการณ์แบบย่อ
 * @returns { boss: สถานการณ์แบบย่อ | null, needsPin: ต้องล็อกบทนี้ไว้ (ยังไม่ได้ล็อก/ล็อกบทอื่นที่เล่นไม่ได้แล้ว) }
 */
export function currentBoss({ scenarios, bossWeek, weekId, isAvailable, getMeta }) {
  const pinned = bossWeek?.weekId === weekId ? getMeta(bossWeek.scenarioId) : null
  if (pinned && (bossWeek.done || (pinned.bossReady && isAvailable(pinned)))) return { boss: pinned, needsPin: false }
  const boss = bossOfWeek(scenarios, weekId, isAvailable)
  return { boss, needsPin: Boolean(boss) }
}
