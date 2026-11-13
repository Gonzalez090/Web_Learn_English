import { describe, it, expect } from 'vitest'
import { levelFromXp, levelProgress, titleKeyForLevel, xpForLevel } from './level'

describe('level', () => {
  it('XP ถึงเลเวล L = 50·L·(L−1)', () => {
    expect([1, 2, 3, 4, 5, 10, 20].map(xpForLevel)).toEqual([0, 100, 300, 600, 1000, 4500, 19000])
  })

  it('คำนวณเลเวลจาก XP ตรงขอบพอดี', () => {
    expect(levelFromXp(0)).toBe(1)
    expect(levelFromXp(99)).toBe(1)
    expect(levelFromXp(100)).toBe(2)
    expect(levelFromXp(299)).toBe(2)
    expect(levelFromXp(300)).toBe(3)
    expect(levelFromXp(19000)).toBe(20)
    expect(levelFromXp(18999)).toBe(19)
  })

  it('ค่าแปลก ๆ → เลเวล 1', () => {
    expect(levelFromXp(-50)).toBe(1)
    expect(levelFromXp(Number.NaN)).toBe(1)
    expect(levelFromXp(undefined)).toBe(1)
  })

  it('ฉายาตามช่วงเลเวล', () => {
    expect([1, 4, 5, 9, 10, 19, 20, 35].map(titleKeyForLevel)).toEqual([
      'newcomer',
      'newcomer',
      'local',
      'local',
      'smoothTalker',
      'smoothTalker',
      'nativeIsh',
      'nativeIsh',
    ])
  })

  it('ความคืบหน้าในเลเวล', () => {
    expect(levelProgress(150)).toEqual({ level: 2, titleKey: 'newcomer', xpInLevel: 50, xpForNext: 200, ratio: 0.25 })
    expect(levelProgress(0).ratio).toBe(0)
  })
})
