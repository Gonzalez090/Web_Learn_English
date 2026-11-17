// =========================================================
// places.js — แผนที่เมือง: สถานที่ไหนปลดล็อกแล้ว (ส่วนที่ 7)
//   สถานที่ปลดล็อกเมื่อ "ผ่าน Stage N" (unlockAfterStage) = เรียนครบทุกบทของ Stage N
//   = Stage N+1 ถูกปลดล็อกแล้ว (computeUnlockedStages ปลดล็อก Stage ถัดไปตอนผ่านครบ)
//   คิดจาก unlockedStages ทุกครั้ง → ผู้เรียนเดิมได้สถานที่ตามความคืบหน้าทันที ไม่ต้องย้ายข้อมูล
// (ฟังก์ชันล้วน → ทดสอบได้)
// =========================================================

export const isPlaceUnlocked = (place, unlockedStages) =>
  !place?.unlockAfterStage || unlockedStages.includes(place.unlockAfterStage + 1)

export const unlockedPlaceIds = (cityMap, unlockedStages) =>
  cityMap.filter((place) => isPlaceUnlocked(place, unlockedStages)).map((place) => place.placeId)

// สถานที่ที่เพิ่งปลดล็อกจาก Stage ที่เพิ่งเปิด (หน้าสรุปบท: Stage 3 เปิด = ผ่าน Stage 2 = ร้านกาแฟ)
export const placesUnlockedBy = (cityMap, newlyUnlockedStages) =>
  cityMap.filter((place) => place.unlockAfterStage && newlyUnlockedStages.includes(place.unlockAfterStage + 1))
