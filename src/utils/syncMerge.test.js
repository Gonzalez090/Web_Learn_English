import { describe, expect, it } from 'vitest'
import { INITIAL_PROGRESS } from '../store/progressStore'
import { createBackup } from './backup'
import { mergeQueue, mergeSnapshots, mergeStreak, same } from './syncMerge'

const snap = (changes = {}, reviewQueue = []) => ({
  progress: createBackup({ ...INITIAL_PROGRESS, ...changes }, []).progress,
  reviewQueue,
})
const lesson = (changes = {}) => ({
  completed: true,
  bestScore: 80,
  attempts: 1,
  completedAt: '2026-11-20',
  lastPlayedAt: '2026-11-20',
  ...changes,
})
const entry = (itemId, changes = {}) => ({
  id: `l:${itemId}`,
  lessonId: 'l',
  itemId,
  box: 0,
  dueDate: '2026-11-25',
  addedAt: '2026-11-24',
  ...changes,
})

describe('same', () => {
  it('ไม่สนลำดับ key แต่สนค่าและชนิด', () => {
    expect(same({ a: 1, b: [1, 2] }, { b: [1, 2], a: 1 })).toBe(true)
    expect(same({ a: 1 }, { a: 1, b: undefined })).toBe(false)
    expect(same([1], { 0: 1 })).toBe(false)
    expect(same(null, {})).toBe(false)
  })
})

describe('รวมครั้งแรก (ยังไม่เคยซิงก์)', () => {
  it('ตัวเลขเอาค่าที่มากกว่า ไม่บวกซ้ำ', () => {
    const merged = mergeSnapshots(
      snap({ xp: 100, npcFriendship: { rose: 2 }, studyMinutes: { '2026-11-24': 5 } }),
      snap({ xp: 300, npcFriendship: { rose: 1, jake: 4 }, studyMinutes: { '2026-11-24': 8 } }),
    )
    expect(merged.progress.xp).toBe(300)
    expect(merged.progress.npcFriendship).toEqual({ rose: 2, jake: 4 })
    expect(merged.progress.studyMinutes).toEqual({ '2026-11-24': 8 })
  })

  it('บท การ์ด Stage รวมกัน คะแนนเอาที่ดีที่สุด', () => {
    const merged = mergeSnapshots(
      snap({ lessonProgress: { a: lesson({ bestScore: 90 }), b: lesson() }, collection: ['p1'], unlockedStages: [1, 2] }),
      snap({
        lessonProgress: { a: lesson({ completed: false, bestScore: 60, attempts: 3, completedAt: null, lastPlayedAt: '2026-11-23' }) },
        collection: ['p2', 'p1'],
        unlockedStages: [1, 3],
      }),
    )
    expect(merged.progress.lessonProgress.a).toEqual(lesson({ bestScore: 90, attempts: 3, lastPlayedAt: '2026-11-23' }))
    expect(merged.progress.lessonProgress.b).toEqual(lesson())
    expect(merged.progress.collection).toEqual(['p2', 'p1'])
    expect(merged.progress.unlockedStages).toEqual([1, 2, 3])
  })

  it('เครื่องใหม่ว่าง ๆ → ได้ของบัญชีทั้งหมด (รวมห้องที่แต่งไว้)', () => {
    const account = snap({ xp: 500, room: { home: 'studio', items: { lamp: 'lamp-desk' } }, lessonProgress: { a: lesson() } }, [entry('x')])
    expect(mergeSnapshots(snap(), account)).toEqual(account)
  })
})

describe('รวมครั้งต่อไป (มี base)', () => {
  const base = snap({ xp: 100, npcFriendship: { rose: 2 }, studyMinutes: { '2026-11-24': 5 } })

  it('สองเครื่องทำเพิ่มทั้งคู่ → นับครบทั้งสองฝั่ง', () => {
    const merged = mergeSnapshots(
      snap({ xp: 150, npcFriendship: { rose: 3 }, studyMinutes: { '2026-11-24': 9 } }),
      snap({ xp: 130, npcFriendship: { rose: 4 }, studyMinutes: { '2026-11-24': 6 } }),
      base,
    )
    expect(merged.progress.xp).toBe(180)
    expect(merged.progress.npcFriendship.rose).toBe(5)
    expect(merged.progress.studyMinutes['2026-11-24']).toBe(10)
  })

  it('เครื่องนี้ข้อมูลหาย (ไม่ได้กดรีเซ็ต) → ไม่ทำให้บัญชีถอยหลัง', () => {
    const merged = mergeSnapshots(snap(), snap({ xp: 130, lessonProgress: { a: lesson() } }), base)
    expect(merged.progress.xp).toBe(130)
    expect(merged.progress.lessonProgress.a).toEqual(lesson())
  })

  it('ห้อง: ฝั่งที่เปลี่ยนชนะ', () => {
    const room = { home: 'studio', items: {} }
    expect(mergeSnapshots(snap(), snap({ room }), snap()).progress.room).toEqual(room)
    expect(mergeSnapshots(snap({ room }), snap(), snap()).progress.room).toEqual(room)
    // เอาของออกจนกลับเป็นค่าเริ่มต้น ก็ถือว่าเปลี่ยน
    expect(mergeSnapshots(snap(), snap({ room }), snap({ room })).progress.room).toEqual(INITIAL_PROGRESS.room)
  })
})

describe('mergeStreak', () => {
  const streak = (count, lastActiveDate, best = count) => ({ count, lastActiveDate, best })

  it('ฝั่งหนึ่งไม่เคยเรียน → ใช้อีกฝั่ง', () => {
    expect(mergeStreak(streak(0, null), streak(4, '2026-11-24', 9))).toEqual(streak(4, '2026-11-24', 9))
  })

  it('วันเดียวกัน → ค่ามากกว่า', () => {
    expect(mergeStreak(streak(2, '2026-11-24'), streak(5, '2026-11-24')).count).toBe(5)
  })

  it('เรียนสลับเครื่องต่อเนื่องกัน → นับต่อ', () => {
    // เครื่อง A: 19–23 (5 วัน) / เครื่อง B: 24 (1 วัน) → 6 วัน
    expect(mergeStreak(streak(5, '2026-11-23'), streak(1, '2026-11-24'))).toEqual(streak(6, '2026-11-24'))
  })

  it('ช่วงวันซ้อนกัน → ไม่นับวันซ้ำ', () => {
    // A: 19–23 / B: 22–24 → 19–24 = 6 วัน
    expect(mergeStreak(streak(5, '2026-11-23'), streak(3, '2026-11-24')).count).toBe(6)
  })

  it('ขาดช่วง → ใช้ของใหม่ เก็บสถิติดีที่สุด', () => {
    expect(mergeStreak(streak(8, '2026-11-10'), streak(2, '2026-11-24'))).toEqual(streak(2, '2026-11-24', 8))
  })

  it('สลับฝั่งได้ผลเท่ากัน', () => {
    const a = streak(5, '2026-11-23')
    const b = streak(3, '2026-11-24')
    expect(mergeStreak(a, b)).toEqual(mergeStreak(b, a))
  })
})

describe('mergeFreeze / Boss', () => {
  it('Freeze สัปดาห์เดียวกันเอาที่เหลือน้อยกว่า / คนละสัปดาห์เอาสัปดาห์ใหม่', () => {
    const at = (available, weekId) => snap({ streakFreeze: { available, weekId } })
    expect(mergeSnapshots(at(1, '2026-11-23'), at(0, '2026-11-23')).progress.streakFreeze.available).toBe(0)
    expect(mergeSnapshots(at(1, '2026-11-23'), at(0, '2026-11-16')).progress.streakFreeze).toEqual({ available: 1, weekId: '2026-11-23' })
  })

  it('Boss: ชนะแล้วฝั่งใดฝั่งหนึ่ง = ชนะ (ไม่ได้โบนัสซ้ำ)', () => {
    const boss = (done, scenarioId = 'cafe') => snap({ bossWeek: { weekId: '2026-11-23', scenarioId, done } })
    expect(mergeSnapshots(boss(false), boss(true)).progress.bossWeek.done).toBe(true)
    expect(mergeSnapshots(boss(true), boss(false, 'store')).progress.bossWeek).toEqual({ weekId: '2026-11-23', scenarioId: 'cafe', done: true })
    expect(mergeSnapshots(snap(), boss(true)).progress.bossWeek.done).toBe(true)
  })
})

describe('mergeQueue', () => {
  it('ครั้งแรก: รวมกัน ข้อซ้ำเอาที่แตะล่าสุด', () => {
    const merged = mergeQueue(
      [entry('a', { box: 2, lastReviewedAt: '2026-11-25' }), entry('b')],
      [entry('a'), entry('c')],
      null,
    )
    expect(merged.map((item) => item.itemId)).toEqual(['a', 'c', 'b'])
    expect(merged[0].box).toBe(2)
  })

  it('อีกเครื่องจำได้แล้ว (เอาออก) → ไม่ฟื้นกลับมา', () => {
    const before = [entry('a'), entry('b')]
    expect(mergeQueue(before, [entry('b')], before).map((item) => item.itemId)).toEqual(['b'])
    expect(mergeQueue([entry('b')], before, before).map((item) => item.itemId)).toEqual(['b'])
  })

  it('เอาออกฝั่งหนึ่ง แต่อีกฝั่งพลาดซ้ำหลังซิงก์ → เก็บไว้ทบทวน', () => {
    const before = [entry('a', { box: 3 })]
    const missedAgain = entry('a', { box: 0, addedAt: '2026-11-26' })
    expect(mergeQueue([], [missedAgain], before)).toEqual([missedAgain])
  })

  it('เปลี่ยนฝั่งเดียว → ใช้ฝั่งที่เปลี่ยน', () => {
    const before = [entry('a')]
    const next = entry('a', { box: 1, dueDate: '2026-11-28' })
    expect(mergeQueue([next], before, before)).toEqual([next])
    expect(mergeQueue(before, [next], before)).toEqual([next])
  })
})

it('รวมซ้ำหลายครั้งได้ผลเดิม (ไม่พุ่ง)', () => {
  const a = snap({ xp: 150, npcFriendship: { rose: 3 }, studyMinutes: { '2026-11-24': 9 } }, [entry('a')])
  const b = snap({ xp: 130, npcFriendship: { rose: 4 } }, [entry('b')])
  const once = mergeSnapshots(a, b)
  expect(mergeSnapshots(once, b, b)).toEqual(mergeSnapshots(mergeSnapshots(once, b, b), b, b))
  expect(mergeSnapshots(once, once, once)).toEqual(once)
})
