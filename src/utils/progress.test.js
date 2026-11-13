import { describe, it, expect } from 'vitest'
import { getStageStatus } from './progress'

const lessons = [{ id: 'a' }, { id: 'b' }]

describe('getStageStatus', () => {
  it('ยังไม่ปลดล็อก → locked', () => {
    expect(getStageStatus(2, lessons, [1], {})).toBe('locked')
  })

  it('ปลดล็อกแล้วแต่ยังไม่ผ่านครบ → unlocked', () => {
    expect(getStageStatus(1, lessons, [1], { a: { completed: true } })).toBe('unlocked')
  })

  it('ผ่านครบทุกบท → completed', () => {
    const progress = { a: { completed: true }, b: { completed: true } }
    expect(getStageStatus(1, lessons, [1], progress)).toBe('completed')
  })

  it('Stage ที่ยังไม่มีบทเรียน ไม่นับว่าผ่าน', () => {
    expect(getStageStatus(5, [], [5], {})).toBe('unlocked')
  })
})
