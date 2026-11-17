import { describe, expect, it } from 'vitest'
import {
  addFriendship,
  friendshipLevel,
  friendshipProgress,
  greeterNpc,
  MAX_FRIENDSHIP_LEVEL,
  recordVisit,
} from './friendship'

describe('friendshipLevel', () => {
  it('ไล่ระดับตามแต้ม 0 / 3 / 6 / 10', () => {
    expect(friendshipLevel(0)).toBe(0)
    expect(friendshipLevel(2)).toBe(0)
    expect(friendshipLevel(3)).toBe(1)
    expect(friendshipLevel(9)).toBe(2)
    expect(friendshipLevel(10)).toBe(3)
    expect(friendshipLevel(50)).toBe(MAX_FRIENDSHIP_LEVEL)
    expect(friendshipLevel(undefined)).toBe(0)
  })
})

describe('friendshipProgress', () => {
  it('บอกว่าคุยอีกกี่ครั้งถึงระดับถัดไป', () => {
    expect(friendshipProgress(0)).toEqual({ level: 0, next: 1, remaining: 3, ratio: 0 })
    expect(friendshipProgress(4)).toMatchObject({ level: 1, next: 2, remaining: 2 })
    expect(friendshipProgress(4).ratio).toBeCloseTo(1 / 3)
  })
  it('ระดับสูงสุดแล้ว → next = null', () => {
    expect(friendshipProgress(12)).toEqual({ level: 3, next: null, remaining: 0, ratio: 1 })
  })
})

describe('addFriendship', () => {
  it('เพิ่มแต้มโดยไม่แก้ object เดิม + บอกเมื่อขึ้นระดับ', () => {
    const before = { mia: 2 }
    const result = addFriendship(before, 'mia')
    expect(result.friendship).toEqual({ mia: 3 })
    expect(result.levelUp).toBe(1)
    expect(before).toEqual({ mia: 2 })
  })
  it('ยังไม่ขึ้นระดับ → levelUp = null / NPC ใหม่เริ่มจาก 0', () => {
    expect(addFriendship({}, 'sam')).toEqual({ friendship: { sam: 1 }, levelUp: null })
    expect(addFriendship(undefined, 'sam').friendship).toEqual({ sam: 1 })
  })
})

describe('recordVisit', () => {
  it('ผู้ใช้ใหม่ (ยังไม่เคยบันทึก) → ไม่ทัก', () => {
    expect(recordVisit({ lastVisitDate: null, welcomeBack: null }, '2026-11-17')).toEqual({
      lastVisitDate: '2026-11-17',
      welcomeBack: null,
    })
  })
  it('หายไป 2 วัน → ไม่ทัก / 3 วัน → ทัก', () => {
    expect(recordVisit({ lastVisitDate: '2026-11-15' }, '2026-11-17').welcomeBack).toBeNull()
    expect(recordVisit({ lastVisitDate: '2026-11-14' }, '2026-11-17').welcomeBack).toEqual({
      date: '2026-11-17',
      days: 3,
    })
  })
  it('ข้ามเดือน/ปี นับวันถูก', () => {
    expect(recordVisit({ lastVisitDate: '2026-12-25' }, '2027-01-04').welcomeBack).toEqual({
      date: '2027-01-04',
      days: 10,
    })
  })
  it('เข้าเว็บซ้ำวันเดิม → ค่าเดิม (คำทักยังอยู่จนกว่าจะปิด)', () => {
    const state = { lastVisitDate: '2026-11-17', welcomeBack: { date: '2026-11-17', days: 5 } }
    expect(recordVisit(state, '2026-11-17')).toEqual(state)
  })
  it('วันถัดมา → ล้างคำทักของเมื่อวาน', () => {
    const state = { lastVisitDate: '2026-11-17', welcomeBack: { date: '2026-11-17', days: 5 } }
    expect(recordVisit(state, '2026-11-18')).toEqual({ lastVisitDate: '2026-11-18', welcomeBack: null })
  })
})

describe('greeterNpc', () => {
  const npcs = [
    { id: 'rose', placeId: 'home' },
    { id: 'jake', placeId: 'store' },
    { id: 'mia', placeId: 'cafe' },
  ]
  it('เลือกคนที่สนิทที่สุดในที่ที่ปลดล็อกแล้ว', () => {
    expect(greeterNpc(npcs, { jake: 2, mia: 9 }, ['home', 'store']).id).toBe('jake')
    expect(greeterNpc(npcs, { jake: 2, mia: 9 }, ['home', 'store', 'cafe']).id).toBe('mia')
  })
  it('ยังไม่สนิทใคร → คนแรก', () => {
    expect(greeterNpc(npcs, {}, ['home', 'store']).id).toBe('rose')
    expect(greeterNpc(npcs, {}, []).id).toBe('rose')
  })
})
