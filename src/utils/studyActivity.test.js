import { describe, it, expect, vi } from 'vitest'
import { beginActivity, isActive, markPractice, subscribeActivity, subscribePractice } from './studyActivity'

describe('studyActivity', () => {
  it('กำลังเรียนจนกว่าตัวเล่นทุกตัวจะจบ (เกมซ้อนในบทเรียน) / จบซ้ำไม่นับซ้ำ', () => {
    expect(isActive()).toBe(false)
    const endLesson = beginActivity()
    const endGame = beginActivity()
    endGame()
    endGame()
    expect(isActive()).toBe(true)
    endLesson()
    expect(isActive()).toBe(false)
  })

  it('แจ้งเมื่อเริ่ม/จบ และเมื่อกดฟัง/พูด / เลิกติดตามแล้วไม่แจ้ง', () => {
    const onActivity = vi.fn()
    const onPractice = vi.fn()
    const offActivity = subscribeActivity(onActivity)
    const offPractice = subscribePractice(onPractice)
    beginActivity()()
    markPractice()
    expect(onActivity).toHaveBeenCalledTimes(2)
    expect(onPractice).toHaveBeenCalledTimes(1)
    offActivity()
    offPractice()
    beginActivity()()
    markPractice()
    expect(onActivity).toHaveBeenCalledTimes(2)
    expect(onPractice).toHaveBeenCalledTimes(1)
  })
})
