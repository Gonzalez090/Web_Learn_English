import { describe, it, expect } from 'vitest'
import { cityMap, dailyMissionPool, lessonList } from '../data'
import { addDays } from './date'
import { missionContext } from './missionContext'
import {
  MISSION_EVENTS,
  MISSIONS_PER_DAY,
  applyMissionEvent,
  ensureDailyMissions,
  missionPath,
  missionReward,
  pickDailyMissions,
  refreshMissions,
} from './missions'

const DAY = '2026-11-13'
const DAYS = Array.from({ length: 60 }, (_, index) => addDays(DAY, index))

// ผู้เรียนที่จบบทตามเงื่อนไข isDone
const learner = (unlockedStages, isDone, { reviewDue = 0, npcFriendship = {} } = {}) =>
  missionContext(
    {
      unlockedStages,
      lessonProgress: Object.fromEntries(
        lessonList.filter(isDone).map((lesson) => [lesson.id, { completed: true, lastPlayedAt: DAY }]),
      ),
      npcFriendship,
    },
    reviewDue,
  )
const firstOf = (stageId) => lessonList.find((lesson) => lesson.stageId === stageId)
const beginner = learner([1], () => false)
// อยู่ Stage n: จบ Stage ก่อนหน้าทั้งหมด + บทแรกของ Stage n
const stageN = (n, options) =>
  learner(
    Array.from({ length: n }, (_, index) => index + 1),
    (lesson) => lesson.stageId < n || lesson.id === firstOf(n).id,
    options,
  )
const graduate = learner([1, 2, 3, 4, 5, 6, 7], () => true, { reviewDue: 5 })

const missionOf = (event) => dailyMissionPool.find((mission) => mission.event === event)
const openEvents = (ctx) => MISSION_EVENTS.filter((event) => missionPath(missionOf(event), ctx) !== null).sort()
const pickedEvents = (ctx) =>
  new Set(DAYS.flatMap((day) => pickDailyMissions(dailyMissionPool, day, ctx).map((mission) => mission.event)))

describe('ข้อมูลภารกิจรายวัน (game.json)', () => {
  // สเปก 15 แบบ + "เขียนผ่าน 5 ข้อ" (ขั้นที่ 9 — ผู้ใช้อนุมัติ 2026-11-17)
  it('มี 16 แบบ id ไม่ซ้ำ และข้อมูลครบ', () => {
    expect(dailyMissionPool).toHaveLength(16)
    expect(new Set(dailyMissionPool.map((m) => m.id)).size).toBe(16)
    for (const mission of dailyMissionPool) {
      expect(mission.title && mission.titleTh).toBeTruthy()
      expect(Number.isInteger(mission.target) && mission.target > 0).toBe(true)
      expect(Number.isInteger(mission.xp) && mission.xp > 0).toBe(true)
      expect(MISSION_EVENTS).toContain(mission.event)
    }
  })
})

describe('ภารกิจที่ทำได้ตามสิ่งที่เรียนแล้ว', () => {
  it('ผู้เริ่มต้น: เฉพาะที่ทำได้ในบทแรก', () => {
    expect(openEvents(beginner)).toEqual(['lessonComplete', 'listen', 'xp'])
    expect(missionPath(missionOf('listen'), beginner)).toBe(`/lesson/${firstOf(1).id}`)
  })

  it('เรียนบทแรกแล้ว → มีมินิเกม ยังไม่มีพูด / จบบทพูด Stage 2 → มีพูด', () => {
    expect(openEvents(stageN(1))).toEqual(['gameCorrect', 'gamePlay', 'lessonComplete', 'listen', 'perfectLesson', 'xp'])
    expect(openEvents(learner([1, 2], (lesson) => lesson.stageId === 1))).not.toContain('speakPass')
    expect(openEvents(stageN(2))).toContain('speakPass')
    expect(openEvents(stageN(2))).not.toContain('speakingMinutes')
  })

  it('Stage 4 → ฝึกเสียง + นับนาทีที่พูด / Stage 5 → วลี บทสนทนา NPC / Stage 7 → เขียน', () => {
    for (const event of ['sound', 'speakingMinutes']) {
      expect(openEvents(stageN(3))).not.toContain(event)
      expect(openEvents(stageN(4))).toContain(event)
    }
    for (const event of ['phrase', 'conversation', 'npcTalk']) {
      expect(openEvents(stageN(4))).not.toContain(event)
      expect(openEvents(stageN(5))).toContain(event)
    }
    expect(openEvents(stageN(6))).not.toContain('writePass')
    expect(openEvents(stageN(7))).toContain('writePass')
  })

  it('ทบทวน: ต้องมีรายการพอถึงเป้า (นับที่ทำแล้วด้วย)', () => {
    const review = missionOf('review')
    expect(missionPath(review, stageN(2, { reviewDue: review.target - 1 }))).toBeNull()
    expect(missionPath(review, stageN(2, { reviewDue: review.target }))).toBe('/review')
    expect(missionPath(review, stageN(2, { reviewDue: 2 }), review.target - 2)).toBe('/review')
    expect(missionPath(review, stageN(2, { reviewDue: 0 }), 1)).toBeNull()
  })

  it('บทต่อไปไม่มีกิจกรรมของภารกิจ → พาไปที่อื่นที่ทำได้ (ฟัง = เรียนซ้ำบทที่มีการฟัง, พูด = บทสนทนาสุ่ม)', () => {
    const ctx = stageN(7) // บทต่อไป = บทเขียน
    const lessonId = missionPath(missionOf('listen'), ctx).split('/').pop()
    expect(lessonList.find((lesson) => lesson.id === lessonId)).toMatchObject({ stageId: 6 })
    expect(missionPath(missionOf('speakPass'), ctx)).toBe('/talk')
  })

  it('npcTalk พาไปสถานที่ที่มีอยู่จริง', () => {
    const placeId = missionPath(missionOf('npcTalk'), stageN(5)).split('/').pop()
    expect(cityMap.some((place) => place.placeId === placeId)).toBe(true)
  })

  it('เรียนครบทุกบท → ทุกแบบทำได้ แต่ไม่สุ่ม "เรียนจบ N บท"', () => {
    expect(openEvents(graduate)).toEqual([...MISSION_EVENTS].sort())
    const picked = pickedEvents(graduate)
    expect(picked.has('lessonComplete')).toBe(false)
    expect(picked.size).toBe(MISSION_EVENTS.length - 1)
  })

  it('ทุกระดับได้วันละ 3 ข้อ ชนิดไม่ซ้ำ และทุกข้อมีที่ให้ทำ', () => {
    for (const ctx of [beginner, ...[1, 2, 3, 4, 5, 6, 7].map((n) => stageN(n)), graduate]) {
      for (const day of DAYS) {
        const picked = pickDailyMissions(dailyMissionPool, day, ctx)
        expect(picked).toHaveLength(MISSIONS_PER_DAY)
        expect(new Set(picked.map((mission) => mission.event)).size).toBe(MISSIONS_PER_DAY)
        for (const mission of picked) expect(missionPath(mission, ctx), mission.id).toMatch(/^\//)
      }
    }
  })
})

describe('สุ่มภารกิจรายวัน', () => {
  it('วันเดียวกันได้ชุดเดิม', () => {
    const a = pickDailyMissions(dailyMissionPool, DAY, graduate)
    expect(pickDailyMissions(dailyMissionPool, DAY, graduate)).toEqual(a)
  })

  it('หลายวัน → ไม่ได้ชุดเดียวกันทุกวัน', () => {
    const sets = DAYS.slice(0, 5).map((day) =>
      pickDailyMissions(dailyMissionPool, day, graduate)
        .map((m) => m.id)
        .sort()
        .join(','),
    )
    expect(new Set(sets).size).toBeGreaterThan(1)
  })

  it('ensureDailyMissions: ของวันนี้มีแล้ว → คืนของเดิม / วันใหม่ → สร้างใหม่', () => {
    const today = ensureDailyMissions(null, dailyMissionPool, DAY, beginner)
    expect(today.date).toBe(DAY)
    expect(today.missions.every((m) => m.progress === 0 && !m.done)).toBe(true)
    expect(ensureDailyMissions(today, dailyMissionPool, DAY, beginner)).toBe(today)
    expect(ensureDailyMissions(today, dailyMissionPool, DAYS[1], beginner).date).toBe(DAYS[1])
  })
})

describe('เปลี่ยนภารกิจที่ทำไม่ได้', () => {
  const daily = {
    date: DAY,
    missions: [
      { id: 'speak-minutes-3', progress: 0, done: false },
      { id: 'game-1', progress: 1, done: true },
      { id: 'review-5', progress: 0, done: false },
    ],
  }

  it('ข้อที่ยังไม่เปิดถูกแทนที่ ข้อที่สำเร็จแล้วคงไว้ และชนิดไม่ซ้ำ', () => {
    const ctx = stageN(1)
    const next = refreshMissions(daily, dailyMissionPool, DAY, ctx)
    expect(next.missions).toHaveLength(MISSIONS_PER_DAY)
    expect(next.missions[0]).toBe(daily.missions[1])
    const missions = next.missions.map((entry) => dailyMissionPool.find((mission) => mission.id === entry.id))
    expect(new Set(missions.map((mission) => mission.event)).size).toBe(MISSIONS_PER_DAY)
    for (const mission of missions.slice(1)) expect(missionPath(mission, ctx)).not.toBeNull()
    // เรียกซ้ำ → ไม่เปลี่ยนอีก (ไม่วน set ไม่จบ)
    expect(refreshMissions(next, dailyMissionPool, DAY, ctx)).toBe(next)
  })

  it('ข้อที่เหลือทำได้อยู่แล้ว → คืนของเดิม', () => {
    expect(refreshMissions(daily, dailyMissionPool, DAY, stageN(5, { reviewDue: 5 }))).toBe(daily)
  })
})

describe('ความคืบหน้าภารกิจ', () => {
  const pool = [
    { id: 'speak-3', event: 'speakPass', target: 3, xp: 15 },
    { id: 'lesson-1', event: 'lessonComplete', target: 1, xp: 10 },
  ]
  const daily = {
    date: DAY,
    missions: [
      { id: 'speak-3', progress: 0, done: false },
      { id: 'lesson-1', progress: 0, done: false },
    ],
  }

  it('นับเฉพาะภารกิจชนิดเดียวกัน และไม่แก้ของเดิม', () => {
    const { daily: next, completed } = applyMissionEvent(daily, pool, 'speakPass')
    expect(next.missions[0]).toEqual({ id: 'speak-3', progress: 1, done: false })
    expect(next.missions[1]).toBe(daily.missions[1])
    expect(completed).toEqual([])
    expect(daily.missions[0].progress).toBe(0)
  })

  it('ครบเป้า → สำเร็จครั้งเดียว ไม่นับเกินเป้า', () => {
    const first = applyMissionEvent(daily, pool, 'speakPass', 5)
    expect(first.daily.missions[0]).toEqual({ id: 'speak-3', progress: 3, done: true })
    expect(first.completed.map((m) => m.id)).toEqual(['speak-3'])
    const again = applyMissionEvent(first.daily, pool, 'speakPass')
    expect(again.completed).toEqual([])
    expect(again.daily).toBe(first.daily)
  })

  it('เหตุการณ์ที่ไม่เกี่ยว / จำนวนไม่ถูกต้อง → ไม่เปลี่ยน', () => {
    expect(applyMissionEvent(daily, pool, 'gamePlay').daily).toBe(daily)
    expect(applyMissionEvent(daily, pool, 'speakPass', 0).daily).toBe(daily)
  })

  it('รวม XP รางวัล', () => {
    expect(missionReward(pool)).toBe(25)
    expect(missionReward([])).toBe(0)
  })
})
