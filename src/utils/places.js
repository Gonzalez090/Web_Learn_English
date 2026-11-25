// =========================================================
// places.js — แผนที่เมือง: สถานที่ไหนปลดล็อกแล้ว (ส่วนที่ 7)
//   สถานที่ปลดล็อกเมื่อ "ผ่าน Stage N" (unlockAfterStage) = เรียนครบทุกบทของ Stage N
//   = Stage N+1 ถูกปลดล็อกแล้ว (computeUnlockedStages ปลดล็อก Stage ถัดไปตอนผ่านครบ)
//   คิดจาก unlockedStages ทุกครั้ง → ผู้เรียนเดิมได้สถานที่ตามความคืบหน้าทันที ไม่ต้องย้ายข้อมูล
// คำแนะนำ: สถานที่เปิดก่อนได้ แต่บทสนทนา/วลีข้างในเป็นประโยคเต็ม → แนะนำให้ใช้จริงตั้งแต่ TALK_FROM_STAGE
// (ฟังก์ชันล้วน → ทดสอบได้)
// =========================================================
import { TALK_FROM_STAGE } from './dailyPlan'

export const isPlaceUnlocked = (place, unlockedStages) =>
  !place?.unlockAfterStage || unlockedStages.includes(place.unlockAfterStage + 1)

// Stage ที่แนะนำให้มาใช้สถานที่นี้ (ไม่ก่อน Stage ที่สถานที่เปิด)
export const recommendedStage = (place) => Math.max(TALK_FROM_STAGE, (place?.unlockAfterStage ?? 0) + 1)

// 'locked' = ยังไม่เปิด / 'early' = เปิดแล้วแต่ยังไม่ถึง Stage ที่แนะนำ (ลองฟังได้) / 'ready' = พร้อมใช้
export function placeStatus(place, unlockedStages) {
  if (!isPlaceUnlocked(place, unlockedStages)) return 'locked'
  return unlockedStages.includes(recommendedStage(place)) ? 'ready' : 'early'
}

// สถานที่ถัดไปที่จะเปิด (ตามลำดับแผนที่) — เปิดครบแล้ว = null
export const nextLockedPlace = (cityMap, unlockedStages) =>
  cityMap.find((place) => !isPlaceUnlocked(place, unlockedStages)) ?? null

export const unlockedPlaceIds = (cityMap, unlockedStages) =>
  cityMap.filter((place) => isPlaceUnlocked(place, unlockedStages)).map((place) => place.placeId)

// สถานที่ที่เพิ่งปลดล็อกจาก Stage ที่เพิ่งเปิด (หน้าสรุปบท: Stage 3 เปิด = ผ่าน Stage 2 = ร้านกาแฟ)
export const placesUnlockedBy = (cityMap, newlyUnlockedStages) =>
  cityMap.filter((place) => place.unlockAfterStage && newlyUnlockedStages.includes(place.unlockAfterStage + 1))
