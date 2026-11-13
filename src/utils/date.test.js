import { describe, it, expect } from 'vitest'
import { toDateKey, addDays, daysBetween } from './date'

describe('date', () => {
  it('ใช้เวลาเครื่อง ไม่ใช่ UTC (ตี 1 ของวันที่ 2 ต้องยังเป็นวันที่ 2)', () => {
    expect(toDateKey(new Date(2026, 0, 2, 1, 0))).toBe('2026-01-02')
    expect(toDateKey(new Date(2026, 0, 2, 23, 59))).toBe('2026-01-02')
  })

  it('บวกวันข้ามเดือน/ข้ามปี/ปีอธิกสุรทิน', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
    expect(addDays('2026-03-10', -10)).toBe('2026-02-28')
  })

  it('นับจำนวนวันระหว่างวัน', () => {
    expect(daysBetween('2026-11-13', '2026-11-14')).toBe(1)
    expect(daysBetween('2026-11-13', '2026-11-13')).toBe(0)
    expect(daysBetween('2026-12-30', '2027-01-02')).toBe(3)
  })
})
