import { describe, it, expect } from 'vitest'
import scenariosData from '../data/scenarios.json'
import { scenarioMeta, twistsCompatible } from '../data/scenarioChunks'
import { buildConversation } from './conversation'
import { bossDoneThisWeek, bossOfWeek, bossSeed, currentBoss, isWeeklyBoss } from './boss'

const list = scenariosData.scenarios.map(scenarioMeta)

describe('twistsCompatible (บทที่เล่นเป็น Boss ได้)', () => {
  it('twist ที่ตัดบรรทัดที่อีกแบบต้องแทรกต่อ → ใช้พร้อมกันไม่ได้', () => {
    const turns = [{ id: 't1' }, { id: 't2' }, { id: 't3' }]
    const ok = { turns, twists: [{ id: 'a', afterTurn: 't1', turns: [] }, { id: 'b', afterTurn: 't3', turns: [] }] }
    const clash = { turns, twists: [{ id: 'a', afterTurn: 't1', skip: ['t3'], turns: [] }, { id: 'b', afterTurn: 't3', turns: [] }] }
    expect(twistsCompatible(ok)).toBe(true)
    expect(twistsCompatible(clash)).toBe(false)
    expect(twistsCompatible({ turns, twists: [ok.twists[0]] })).toBe(false)
  })

  it('ข้อมูลจริง: บท Boss ทุกบทสร้างบทสนทนาที่มี twist ครบทุกแบบ (ป้ายขึ้นทุกแบบ) และจบด้วยบรรทัดที่สร้างได้', () => {
    const ready = scenariosData.scenarios.filter(twistsCompatible)
    expect(ready.length).toBeGreaterThanOrEqual(20)
    for (const scenario of ready) {
      const ids = scenario.twists.map((twist) => twist.id)
      const conversation = buildConversation(scenario, 7, { twist: ids })
      expect(conversation.twists.map((twist) => twist.id), scenario.id).toEqual(ids)
      for (const id of ids) expect(conversation.lines.some((line) => line.twistId === id), `${scenario.id}/${id}`).toBe(true)
    }
  })
})

describe('bossOfWeek / bossSeed / bossDoneThisWeek', () => {
  it('สัปดาห์เดิมได้บทเดิม seed เดิม / เลือกเฉพาะบทที่ bossReady และเล่นได้', () => {
    const week = '2026-11-16'
    const boss = bossOfWeek(list, week)
    expect(boss.bossReady).toBe(true)
    expect(bossOfWeek(list, week)).toBe(boss)
    expect(bossSeed(week)).toBe(bossSeed(week))
    const onlyCafe = bossOfWeek(list, week, (scenario) => scenario.placeId === 'cafe')
    expect(onlyCafe.placeId).toBe('cafe')
    expect(bossOfWeek(list, week, () => false)).toBeNull()
  })

  it('หลายสัปดาห์ได้บทหลากหลาย', () => {
    const weeks = Array.from({ length: 12 }, (_, index) => `2026-${String(index + 1).padStart(2, '0')}-05`)
    expect(new Set(weeks.map((week) => bossOfWeek(list, week).id)).size).toBeGreaterThan(3)
  })

  it('Boss ของสัปดาห์จริง = บทที่ล็อกไว้ + seed ของสัปดาห์ (บทอื่น/seed อื่น = ฝึกซ้อม)', () => {
    const week = '2026-11-16'
    const pinned = { weekId: week, scenarioId: 'store-return', done: false }
    expect(isWeeklyBoss(pinned, week, 'store-return', bossSeed(week))).toBe(true)
    expect(isWeeklyBoss(pinned, week, 'taxi', bossSeed(week))).toBe(false)
    expect(isWeeklyBoss(pinned, week, 'store-return', 1)).toBe(false)
    expect(isWeeklyBoss(pinned, '2026-11-23', 'store-return', bossSeed('2026-11-23'))).toBe(false)
  })

  it('currentBoss: บทที่ล็อกไว้คงเดิมแม้ตัวเลือกเปลี่ยน / ล็อกไว้แต่เล่นไม่ได้แล้ว → เลือกใหม่ / ชนะแล้วคงบทที่ชนะ', () => {
    const week = '2026-11-16'
    const getMeta = (id) => list.find((scenario) => scenario.id === id) ?? null
    const all = () => true
    const fresh = currentBoss({ scenarios: list, bossWeek: null, weekId: week, isAvailable: all, getMeta })
    expect(fresh.needsPin).toBe(true)
    const pinned = { weekId: week, scenarioId: fresh.boss.id, done: false }
    // ตัวเลือกเปลี่ยน (เช่น ความสนิทขึ้นระดับ) แต่บทที่ล็อกไว้ยังเล่นได้ → บทเดิม
    const others = (scenario) => scenario.id === fresh.boss.id || scenario.placeId === 'airport'
    expect(currentBoss({ scenarios: list, bossWeek: pinned, weekId: week, isAvailable: others, getMeta })).toEqual({
      boss: fresh.boss,
      needsPin: false,
    })
    // บทที่ล็อกไว้เล่นไม่ได้แล้ว → เลือกใหม่
    const notPinned = (scenario) => scenario.id !== fresh.boss.id
    const moved = currentBoss({ scenarios: list, bossWeek: pinned, weekId: week, isAvailable: notPinned, getMeta })
    expect(moved.needsPin).toBe(true)
    expect(moved.boss.id).not.toBe(fresh.boss.id)
    // ชนะแล้ว → บทที่ชนะเสมอ
    const won = { ...pinned, done: true }
    expect(currentBoss({ scenarios: list, bossWeek: won, weekId: week, isAvailable: () => false, getMeta }).boss.id).toBe(
      fresh.boss.id,
    )
  })

  it('twist ที่ประกาศ conflicts → บทนั้นไม่เป็น Boss (restaurant: เมนูหมด + ได้อาหารผิด)', () => {
    expect(list.find((scenario) => scenario.id === 'restaurant').bossReady).toBe(false)
  })

  it('ชนะแล้วนับเฉพาะสัปดาห์เดียวกัน', () => {
    expect(bossDoneThisWeek({ weekId: '2026-11-16', scenarioId: 'cafe', done: true }, '2026-11-16')).toBe(true)
    expect(bossDoneThisWeek({ weekId: '2026-11-09', scenarioId: 'cafe', done: true }, '2026-11-16')).toBe(false)
    expect(bossDoneThisWeek(null, '2026-11-16')).toBe(false)
  })
})
