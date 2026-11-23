// =========================================================
// room.js — ห้องของตัวละคร (ส่วนที่ 8.1, ขั้นที่ 20-2) ฟังก์ชันล้วน (ทดสอบได้)
// - บ้าน (room.json homes) เปลี่ยนตามเลเวล: ไม่ได้เลือกเอง → บ้านล่าสุดที่ปลดล็อกแล้ว / เลือกบ้านที่ปลดล็อกแล้วหลังไหนก็ได้
// - ช่องของตกแต่ง (room.json slots) ช่องละ 1 ชิ้น เลือกจากชิ้นที่ปลดล็อกแล้ว หรือเว้นว่าง
// - สิ่งที่ผู้ใช้เลือก: et-progress.room = { home: id | null (อัตโนมัติ), items: { [slotId]: itemId } }
// =========================================================
import roomData from '../data/room.json'

export const { homes, slots } = roomData
export const HOME_SLOT = 'home'

// ทุกชิ้น (บ้าน + ของตกแต่ง)
export const ROOM_ITEMS = [...homes, ...slots.flatMap((slot) => slot.items)]

export const isUnlocked = (item, level) => Boolean(item) && level >= item.level

// บ้านที่แสดง: ที่เลือกไว้ (ถ้ายังปลดล็อกอยู่) ไม่งั้นหลังล่าสุดที่ปลดล็อก
export function currentHome(room, level) {
  const chosen = homes.find((home) => home.id === room?.home)
  if (isUnlocked(chosen, level)) return chosen
  return homes.filter((home) => isUnlocked(home, level)).at(-1) ?? homes[0]
}

// ของในช่อง (ยังไม่เลือก / ยังไม่ปลดล็อก / ไม่มีจริง = null)
export function currentItem(room, slotId, level) {
  const slot = slots.find((entry) => entry.id === slotId)
  const item = slot?.items.find((entry) => entry.id === room?.items?.[slotId])
  return isUnlocked(item, level) ? item : null
}

/**
 * เลือกของ 1 ชิ้น
 * @param slotId 'home' หรือ id ของช่อง
 * @param itemId id ของชิ้น / null = เว้นว่าง (บ้าน = กลับเป็นอัตโนมัติ)
 * @returns room ใหม่ — ชิ้นที่ยังล็อก/ไม่มีจริง = อันเดิม
 */
export function chooseItem(room, slotId, itemId, level) {
  const current = { home: room?.home ?? null, items: room?.items ?? {} }
  const options = slotId === HOME_SLOT ? homes : slots.find((slot) => slot.id === slotId)?.items
  if (!options) return room
  if (itemId !== null && !isUnlocked(options.find((item) => item.id === itemId), level)) return room
  if (slotId === HOME_SLOT) {
    // เลือกหลังล่าสุด = อัตโนมัติ → ได้บ้านใหม่เมื่อไรก็ย้ายให้เอง / เลือกหลังเก่า = อยู่หลังนั้นต่อ
    return { ...current, home: itemId === currentHome(null, level).id ? null : itemId }
  }
  const items = { ...current.items }
  if (itemId === null) delete items[slotId]
  else items[slotId] = itemId
  return { ...current, items }
}

// ของที่เพิ่งปลดล็อกเมื่อเลเวลขึ้นจาก from → to (ข้ามหลายเลเวลได้)
export const unlockedBetween = (from, to) => ROOM_ITEMS.filter((item) => item.level > from && item.level <= to)

// เลเวลถัดไปที่จะได้ของ + ของที่จะได้ (ได้ครบแล้ว = null)
export function nextUnlock(level) {
  const next = Math.min(...ROOM_ITEMS.filter((item) => item.level > level).map((item) => item.level))
  return Number.isFinite(next) ? { level: next, items: ROOM_ITEMS.filter((item) => item.level === next) } : null
}
