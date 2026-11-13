// =========================================================
// level.js — เลเวลและฉายา คำนวณจาก XP (ส่วนที่ 8.1) ไม่เก็บซ้ำใน store
//   XP ที่ต้องมีเพื่อถึงเลเวล L = 50 · L · (L − 1)
//   → Lv1 = 0, Lv2 = 100, Lv3 = 300, Lv4 = 600, Lv5 = 1,000 …
//   ฉายา: Lv1–4 Newcomer → Lv5–9 Local → Lv10–19 Smooth Talker → Lv20+ Native-ish
// =========================================================

export const xpForLevel = (level) => 50 * level * (level - 1)

export function levelFromXp(xp) {
  const safeXp = Number.isFinite(xp) ? Math.max(0, xp) : 0
  // ประมาณจากสูตรก่อน แล้วปรับให้ตรง (กันเลขทศนิยมคลาด)
  let level = Math.max(1, Math.floor((1 + Math.sqrt(1 + (4 * safeXp) / 50)) / 2))
  while (xpForLevel(level + 1) <= safeXp) level += 1
  while (level > 1 && xpForLevel(level) > safeXp) level -= 1
  return level
}

// key ของฉายาใน locales (level.titles.*)
export function titleKeyForLevel(level) {
  if (level >= 20) return 'nativeIsh'
  if (level >= 10) return 'smoothTalker'
  if (level >= 5) return 'local'
  return 'newcomer'
}

/**
 * ข้อมูลสำหรับแถบเลเวล
 * @returns { level, titleKey, xpInLevel, xpForNext, ratio (0–1) }
 */
export function levelProgress(xp) {
  const level = levelFromXp(xp)
  const start = xpForLevel(level)
  const xpForNext = xpForLevel(level + 1) - start
  const xpInLevel = Math.max(0, (Number.isFinite(xp) ? xp : 0) - start)
  return { level, titleKey: titleKeyForLevel(level), xpInLevel, xpForNext, ratio: xpInLevel / xpForNext }
}
