import { describe, it, expect } from 'vitest'
import { displayStreak, recordActivity, refreshFreeze, studiedToday } from './streak'
import { weekStartKey } from './date'

// 2026-11-13 = วันศุกร์, 2026-11-16 = วันจันทร์
const FRI = '2026-11-13'
const weekOf = (day) => ({ available: 1, weekId: weekStartKey(day) })

describe('weekStartKey', () => {
  it('คืนวันจันทร์ของสัปดาห์', () => {
    expect(weekStartKey('2026-11-13')).toBe('2026-11-09') // ศุกร์ → จันทร์ก่อนหน้า
    expect(weekStartKey('2026-11-16')).toBe('2026-11-16') // จันทร์ → วันเดียวกัน
    expect(weekStartKey('2026-11-15')).toBe('2026-11-09') // อาทิตย์ = วันสุดท้ายของสัปดาห์
  })
})

describe('streak', () => {
  it('เรียนครั้งแรก → 1 วัน', () => {
    const result = recordActivity({ count: 0, lastActiveDate: null }, null, FRI)
    expect(result.streak).toEqual({ count: 1, lastActiveDate: FRI, best: 1 })
    expect(result.usedFreeze).toBe(false)
  })

  it('เรียนซ้ำวันเดิม → ไม่เพิ่ม', () => {
    const streak = { count: 3, lastActiveDate: FRI, best: 5 }
    expect(recordActivity(streak, weekOf(FRI), FRI).streak).toBe(streak)
  })

  it('เรียนวันถัดไป → +1 และจำค่าสูงสุด', () => {
    const result = recordActivity({ count: 5, lastActiveDate: '2026-11-12', best: 5 }, weekOf(FRI), FRI)
    expect(result.streak).toEqual({ count: 6, lastActiveDate: FRI, best: 6 })
  })

  it('พลาด 1 วัน + มี Freeze → ใช้ Freeze แล้ว streak ไม่ขาด', () => {
    const result = recordActivity({ count: 4, lastActiveDate: '2026-11-11', best: 4 }, weekOf(FRI), FRI)
    expect(result.usedFreeze).toBe(true)
    expect(result.streak.count).toBe(5)
    expect(result.streakFreeze.available).toBe(0)
  })

  it('พลาด 1 วัน แต่ใช้ Freeze ของสัปดาห์นี้ไปแล้ว → เริ่มใหม่', () => {
    const freeze = { available: 0, weekId: weekStartKey(FRI) }
    const result = recordActivity({ count: 4, lastActiveDate: '2026-11-11', best: 4 }, freeze, FRI)
    expect(result.streak).toEqual({ count: 1, lastActiveDate: FRI, best: 4 })
    expect(result.usedFreeze).toBe(false)
  })

  it('หายไปหลายวัน → เริ่มนับใหม่ (Freeze ไม่ถูกใช้)', () => {
    const result = recordActivity({ count: 9, lastActiveDate: '2026-11-05', best: 9 }, weekOf(FRI), FRI)
    expect(result.streak.count).toBe(1)
    expect(result.streakFreeze.available).toBe(1)
  })

  it('Freeze ได้ใหม่ทุกวันจันทร์', () => {
    const used = { available: 0, weekId: '2026-11-09' }
    expect(refreshFreeze(used, '2026-11-15')).toBe(used) // ยังสัปดาห์เดิม
    expect(refreshFreeze(used, '2026-11-16')).toEqual({ available: 1, weekId: '2026-11-16' })
  })

  it('ตัวเลขที่แสดง: ยังไม่เรียนวันนี้ก็ยังนับ ถ้ายังต่อได้', () => {
    const streak = { count: 7, lastActiveDate: '2026-11-12' }
    expect(displayStreak(streak, weekOf(FRI), FRI)).toBe(7) // เมื่อวานเรียน
    expect(displayStreak({ count: 7, lastActiveDate: '2026-11-11' }, weekOf(FRI), FRI)).toBe(7) // ยังมี Freeze
    expect(displayStreak({ count: 7, lastActiveDate: '2026-11-11' }, { available: 0, weekId: '2026-11-09' }, FRI)).toBe(0)
    expect(displayStreak({ count: 7, lastActiveDate: '2026-11-01' }, weekOf(FRI), FRI)).toBe(0)
    expect(displayStreak({ count: 0, lastActiveDate: null }, null, FRI)).toBe(0)
  })

  it('studiedToday', () => {
    expect(studiedToday({ lastActiveDate: FRI }, FRI)).toBe(true)
    expect(studiedToday({ lastActiveDate: '2026-11-12' }, FRI)).toBe(false)
  })
})
