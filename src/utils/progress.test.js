import { describe, it, expect } from 'vitest'
import { getStageStatus, computeUnlockedStages, nextLesson, recordLessonResult } from './progress'

describe('nextLesson (ปุ่มเรียนต่อ)', () => {
  const lessons = [
    { id: 's2a', stageId: 2 },
    { id: 's1a', stageId: 1 },
    { id: 's1b', stageId: 1 },
  ]
  const done = (...ids) => Object.fromEntries(ids.map((id) => [id, { completed: true }]))

  it('บทแรกที่ยังไม่จบ ไล่ตาม Stage ก่อน แล้วตามลำดับในไฟล์', () => {
    expect(nextLesson(lessons, [1], {})?.id).toBe('s1a')
    expect(nextLesson(lessons, [1], done('s1a'))?.id).toBe('s1b')
  })

  it('ข้ามบทใน Stage ที่ยังล็อก / จบหมดแล้ว → null', () => {
    expect(nextLesson(lessons, [1], done('s1a', 's1b'))).toBeNull()
    expect(nextLesson(lessons, [1, 2], done('s1a', 's1b'))?.id).toBe('s2a')
  })

  it('จำกัดเฉพาะ Stage เดียวได้ (ป้าย "บทต่อไป" ในหน้ารายการบท)', () => {
    expect(nextLesson(lessons, [1, 2], {}, { stageId: 2 })?.id).toBe('s2a')
    expect(nextLesson(lessons, [1, 2], done('s2a'), { stageId: '2' })).toBeNull()
  })
})

describe('computeUnlockedStages', () => {
  const stages = [{ id: 1 }, { id: 2 }, { id: 3 }]
  const lessons = [
    { id: 'a', stageId: 1 },
    { id: 'b', stageId: 2 },
    { id: 'c', stageId: 2 },
  ]

  it('ผ่าน Stage 1 ครบ → ปลดล็อก Stage 2', () => {
    const result = computeUnlockedStages(stages, lessons, [1], { a: { completed: true } })
    expect(result).toEqual({ unlockedStages: [1, 2], newlyUnlocked: [2] })
  })

  it('Stage 2 ผ่านไม่ครบทุกบท → ยังไม่ปลดล็อก Stage 3', () => {
    const result = computeUnlockedStages(stages, lessons, [1, 2], { a: { completed: true }, b: { completed: true } })
    expect(result.newlyUnlocked).toEqual([])
  })

  it('ยังไม่ผ่านอะไร → ไม่เปลี่ยน', () => {
    expect(computeUnlockedStages(stages, lessons, [1], {}).unlockedStages).toEqual([1])
  })
})

describe('recordLessonResult', () => {
  it('ครั้งแรก: completed + คะแนน + attempts 1', () => {
    expect(recordLessonResult({}, 'a', 80, '2026-11-13').a).toEqual({
      completed: true,
      bestScore: 80,
      attempts: 1,
      completedAt: '2026-11-13',
      lastPlayedAt: '2026-11-13',
    })
  })

  it('เล่นซ้ำ: เก็บคะแนนดีที่สุด และวันที่ผ่านครั้งแรก', () => {
    const first = recordLessonResult({}, 'a', 90, '2026-11-13')
    const second = recordLessonResult(first, 'a', 60, '2026-11-15').a
    expect(second).toMatchObject({ bestScore: 90, attempts: 2, completedAt: '2026-11-13', lastPlayedAt: '2026-11-15' })
  })
})

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
