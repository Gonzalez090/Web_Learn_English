import { describe, it, expect } from 'vitest'
import { dailyMissionPool } from '../data'
import {
  AVAILABLE_MISSION_EVENTS,
  MISSION_EVENTS,
  MISSIONS_PER_DAY,
  applyMissionEvent,
  ensureDailyMissions,
  missionReward,
  pickDailyMissions,
} from './missions'

const DAY = '2026-11-13'

describe('ข้อมูลภารกิจรายวัน (game.json)', () => {
  // สเปก 15 แบบ + "เขียนผ่าน 5 ข้อ" (ขั้นที่ 9 — ผู้ใช้อนุมัติ 2026-11-17)
  it('มี 16 แบบ id ไม่ซ้ำ และข้อมูลครบ', () => {
    expect(dailyMissionPool).toHaveLength(16)
    expect(new Set(dailyMissionPool.map((m) => m.id)).size).toBe(16)
    for (const mission of dailyMissionPool) {
      expect(mission.title && mission.titleTh).toBeTruthy()
      expect(Number.isInteger(mission.target) && mission.target > 0).toBe(true)
      expect(Number.isInteger(mission.xp) && mission.xp > 0).toBe(true)
      expect(Object.keys(MISSION_EVENTS)).toContain(mission.event)
    }
  })

  it('ภารกิจที่ทำได้แล้วตอนนี้ มีชนิดต่างกันพอให้สุ่มวันละ 3', () => {
    const events = new Set(dailyMissionPool.filter((m) => AVAILABLE_MISSION_EVENTS.has(m.event)).map((m) => m.event))
    expect(events.size).toBeGreaterThanOrEqual(MISSIONS_PER_DAY)
  })
})

describe('สุ่มภารกิจรายวัน', () => {
  it('วันเดียวกันได้ชุดเดิม, ได้ 3 ข้อ ชนิดไม่ซ้ำ และเป็นของที่ทำได้แล้ว', () => {
    const a = pickDailyMissions(dailyMissionPool, DAY)
    expect(pickDailyMissions(dailyMissionPool, DAY)).toEqual(a)
    expect(a).toHaveLength(3)
    expect(new Set(a.map((m) => m.event)).size).toBe(3)
    for (const mission of a) expect(AVAILABLE_MISSION_EVENTS.has(mission.event)).toBe(true)
  })

  it('หลายวัน → ไม่ได้ชุดเดียวกันทุกวัน', () => {
    const days = ['2026-11-13', '2026-11-14', '2026-11-15', '2026-11-16', '2026-11-17']
    const sets = days.map((day) => pickDailyMissions(dailyMissionPool, day).map((m) => m.id).sort().join(','))
    expect(new Set(sets).size).toBeGreaterThan(1)
  })

  it('ensureDailyMissions: ของวันนี้มีแล้ว → คืนของเดิม / วันใหม่ → สร้างใหม่', () => {
    const today = ensureDailyMissions(null, dailyMissionPool, DAY)
    expect(today.date).toBe(DAY)
    expect(today.missions.every((m) => m.progress === 0 && !m.done)).toBe(true)
    expect(ensureDailyMissions(today, dailyMissionPool, DAY)).toBe(today)
    expect(ensureDailyMissions(today, dailyMissionPool, '2026-11-14').date).toBe('2026-11-14')
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
