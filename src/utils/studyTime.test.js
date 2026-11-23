import { describe, it, expect } from 'vitest'
import {
  addToSession,
  BREAK_AFTER_MS,
  BREAK_GAP_MS,
  countedMs,
  EMPTY_SESSION,
  IDLE_MS,
  isStudyPath,
  needsBreak,
  PLENTY_MINUTES,
  recommendedGoal,
  studyAdvice,
  TICK_MS,
} from './studyTime'
import { PLAN_GOALS } from './dailyPlan'

describe('isStudyPath', () => {
  it('นับเฉพาะหน้าที่เรียนจริง', () => {
    for (const path of ['/lesson/s1-a', '/review', '/talk/cafe', '/games/listen-tap', '/sounds/th', '/phrases/food', '/lesson/s1-a/'])
      expect(isStudyPath(path), path).toBe(true)
    for (const path of ['/', '/learn/1', '/lesson/s1-a/summary', '/talk', '/games', '/sounds', '/phrases', '/plan', '/settings', '/profile'])
      expect(isStudyPath(path), path).toBe(false)
  })
})

describe('countedMs', () => {
  const base = { from: 1000, now: 1000 + TICK_MS, lastInput: 1000, visible: true }
  it('หน้าเปิดอยู่และยังแตะจอ → นับเต็ม', () => expect(countedMs(base)).toBe(TICK_MS))
  it('หน้าซ่อน / ไม่แตะนาน → ไม่นับ', () => {
    expect(countedMs({ ...base, visible: false })).toBe(0)
    expect(countedMs({ ...base, lastInput: base.now - IDLE_MS - 1 })).toBe(0)
  })
  it('ช่วงยาวผิดปกติ → ตัด / เวลาย้อน → 0', () => {
    expect(countedMs({ ...base, now: 1000 + IDLE_MS })).toBe(TICK_MS * 2)
    expect(countedMs({ ...base, now: 500 })).toBe(0)
  })
})

describe('ชวนพัก', () => {
  it('เรียนต่อเนื่องครบ → ชวนพัก / ยังไม่ครบ → ไม่ชวน', () => {
    let session = EMPTY_SESSION
    let now = 0
    while (session.ms < BREAK_AFTER_MS - TICK_MS) session = addToSession(session, TICK_MS, (now += TICK_MS))
    expect(needsBreak(session, now)).toBe(false)
    session = addToSession(session, TICK_MS, (now += TICK_MS))
    expect(needsBreak(session, now)).toBe(true)
    expect(needsBreak(session, now + BREAK_GAP_MS + 1)).toBe(false) // พักไปแล้ว
  })
  it('หยุดสั้น ๆ ระหว่างบท = รอบเดิม / พักนาน = เริ่มนับใหม่', () => {
    const first = addToSession(EMPTY_SESSION, TICK_MS, TICK_MS)
    expect(addToSession(first, TICK_MS, TICK_MS + 60_000).ms).toBe(TICK_MS * 2)
    expect(addToSession(first, TICK_MS, TICK_MS * 2 + BREAK_GAP_MS + 1).ms).toBe(TICK_MS)
    expect(addToSession(first, 0, 999)).toBe(first)
  })
})

describe('คำแนะนำของวัน', () => {
  it('ยังไม่เริ่ม → กำลังเรียน → พอแล้ว → เยอะแล้ว', () => {
    expect(studyAdvice({ minutes: 0, goal: 10, planDone: false })).toBe('start')
    expect(studyAdvice({ minutes: 4, goal: 10, planDone: false })).toBe('going')
    expect(studyAdvice({ minutes: 10, goal: 10, planDone: false })).toBe('enough')
    expect(studyAdvice({ minutes: 4, goal: 10, planDone: true })).toBe('enough')
    expect(studyAdvice({ minutes: PLENTY_MINUTES, goal: 10, planDone: true })).toBe('plenty')
  })
  it('เป้าที่แนะนำอยู่ในตัวเลือกเสมอ และเพิ่มเมื่อพูดเป็นประโยคแล้ว', () => {
    expect(recommendedGoal([1])).toBe(10)
    expect(recommendedGoal([1, 2, 3, 4])).toBe(15)
    for (const goal of [recommendedGoal([1]), recommendedGoal([4])]) expect(PLAN_GOALS).toContain(goal)
  })
})
