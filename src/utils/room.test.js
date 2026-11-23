import { describe, expect, it } from 'vitest'
import { chooseItem, currentHome, currentItem, homes, nextUnlock, ROOM_ITEMS, slots, unlockedBetween } from './room'

// (ไฟล์ภาพ + เครดิตของทุกชิ้น ตรวจใน data.test.js "ภาพถ่ายประกอบ")
describe('room.json', () => {
  it('id และภาพไม่ซ้ำ มีชื่อ 2 ภาษา', () => {
    expect(new Set(ROOM_ITEMS.map((item) => item.id)).size).toBe(ROOM_ITEMS.length)
    expect(new Set(ROOM_ITEMS.map((item) => item.image)).size).toBe(ROOM_ITEMS.length)
    for (const item of ROOM_ITEMS) expect(item.name && item.nameTh, item.id).toBeTruthy()
  })

  it('เริ่มเลเวล 1 มีบ้าน + เรียงตามเลเวล ไม่ซ้ำเลเวลในช่องเดียวกัน', () => {
    expect(homes[0].level).toBe(1)
    for (const list of [homes, ...slots.map((slot) => slot.items)]) {
      const levels = list.map((item) => item.level)
      expect(levels).toEqual([...new Set(levels)].sort((a, b) => a - b))
    }
  })

  it('เลเวล 1–20 ได้ของใหม่อย่างน้อยทุก 2 เลเวล', () => {
    for (let level = 1; level < 20; level += 1) expect(nextUnlock(level).level - level, `Lv ${level}`).toBeLessThanOrEqual(2)
  })
})

describe('บ้าน', () => {
  it('ไม่ได้เลือก = หลังล่าสุดที่ปลดล็อก', () => {
    expect(currentHome(undefined, 1).id).toBe('small')
    expect(currentHome({ home: null, items: {} }, 8).id).toBe('loft')
    expect(currentHome({ home: null, items: {} }, 99).id).toBe('dream')
  })
  it('เลือกหลังเก่าได้ / หลังที่ยังล็อกหรือไม่มีจริง = อัตโนมัติ', () => {
    expect(currentHome({ home: 'small', items: {} }, 8).id).toBe('small')
    expect(currentHome({ home: 'dream', items: {} }, 8).id).toBe('loft')
    expect(currentHome({ home: 'castle', items: {} }, 8).id).toBe('loft')
  })
  it('เลือกหลังล่าสุด = อัตโนมัติ (ได้บ้านใหม่แล้วย้ายให้เอง)', () => {
    const room = chooseItem({ home: 'small', items: {} }, 'home', 'loft', 8)
    expect(room.home).toBeNull()
    expect(currentHome(room, 12).id).toBe('house')
  })
})

describe('ของตกแต่ง', () => {
  it('เลือก / เปลี่ยน / เว้นว่าง โดยไม่แก้ของเดิม', () => {
    const start = { home: null, items: {} }
    const one = chooseItem(start, 'lamp', 'lamp-desk', 6)
    expect(one.items).toEqual({ lamp: 'lamp-desk' })
    expect(start.items).toEqual({})
    expect(chooseItem(one, 'lamp', 'lamp-floor', 6).items.lamp).toBe('lamp-floor')
    expect(chooseItem(one, 'lamp', null, 6).items).toEqual({})
    expect(currentItem(one, 'lamp', 6).id).toBe('lamp-desk')
  })
  it('ยังล็อก / ผิดช่อง / ไม่มีจริง = ไม่เปลี่ยน', () => {
    const room = { home: null, items: {} }
    expect(chooseItem(room, 'lamp', 'lamp-lights', 6)).toBe(room)
    expect(chooseItem(room, 'lamp', 'plant-cactus', 20)).toBe(room)
    expect(chooseItem(room, 'garage', 'car', 20)).toBe(room)
    expect(chooseItem(room, 'home', 'dream', 19)).toBe(room)
    expect(currentItem({ items: { lamp: 'lamp-lights' } }, 'lamp', 6)).toBeNull()
  })
  it('ข้อมูลเก่าที่ไม่มี room ก็เลือกได้ / บ้าน null = อัตโนมัติ', () => {
    expect(chooseItem(undefined, 'home', 'small', 8)).toEqual({ home: 'small', items: {} })
    expect(chooseItem({ home: 'small', items: { lamp: 'lamp-desk' } }, 'home', null, 8)).toEqual({ home: null, items: { lamp: 'lamp-desk' } })
  })
})

describe('ปลดล็อก', () => {
  it('ข้ามหลายเลเวลได้ของครบ', () => {
    expect(unlockedBetween(1, 1)).toEqual([])
    expect(unlockedBetween(4, 5).map((item) => item.id)).toEqual(['apartment', 'art-photos'])
    expect(unlockedBetween(1, 4).map((item) => item.id).sort()).toEqual(['plant-cactus', 'sofa-armchair', 'studio'])
  })
  it('ได้ครบแล้ว = ไม่มีถัดไป', () => {
    expect(nextUnlock(1)).toMatchObject({ level: 2 })
    expect(nextUnlock(20)).toBeNull()
  })
})
