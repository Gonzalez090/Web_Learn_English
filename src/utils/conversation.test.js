import { describe, it, expect } from 'vitest'
import {
  buildConversation,
  checkUserTurn,
  defaultSlotValues,
  expandScenarioTexts,
  fillSlots,
  pickTwist,
  slotsIn,
  talkReviewLesson,
} from './conversation'
import { scenarios } from '../data'

const cafe = scenarios.find((scenario) => scenario.id === 'cafe')

describe('fillSlots / slotsIn', () => {
  const values = { drink: { en: 'a latte', th: 'ลาเต้', key: 'latte' }, nights: { en: 'two nights', th: '2 คืน' } }

  it('แทนค่าภาษาอังกฤษ/ไทย และขึ้นต้นตัวใหญ่', () => {
    expect(fillSlots('Can I get {drink}, please?', values)).toBe('Can I get a latte, please?')
    expect(fillSlots('{nights}, is that correct?', values)).toBe('Two nights, is that correct?')
    expect(fillSlots('สั่ง{drink}', values, 'th')).toBe('สั่งลาเต้')
    expect(slotsIn('{drink} and {drink} at {time}')).toEqual(['drink', 'time'])
  })
})

describe('buildConversation', () => {
  it('seed เดิม = บทสนทนาเดิม / ค่าช่องเดียวกันทั้งบท', () => {
    const a = buildConversation(cafe, 42)
    expect(buildConversation(cafe, 42)).toEqual(a)
    expect(a.lines).toHaveLength(cafe.turns.length)
    const drink = a.values.drink
    const order = a.lines.find((line) => line.id === 'cafe-2')
    expect(order.options[0].text).toContain(drink.en)
    expect(order.requiredWords).toEqual([drink.key])
    expect(order.hintTh).toContain(drink.th)
  })

  it('สุ่มหลาย seed แล้วได้บทอีกฝ่ายต่างกัน (มี 3 แบบ)', () => {
    const openings = new Set(Array.from({ length: 30 }, (_, seed) => buildConversation(cafe, seed).lines[0].target))
    expect(openings.size).toBeGreaterThanOrEqual(2)
  })
})

describe('twists (ขั้นที่ 12)', () => {
  it('เกิดราว 30% ของรอบ (สุ่ม 400 seed) และ seed เดิมได้ twist เดิม', () => {
    const hits = Array.from({ length: 400 }, (_, seed) => pickTwist(cafe, seed)).filter(Boolean).length
    expect(hits / 400).toBeGreaterThan(0.2)
    expect(hits / 400).toBeLessThan(0.4)
    expect(pickTwist(cafe, 123)).toEqual(pickTwist(cafe, 123))
  })

  it('แทรกต่อจาก afterTurn และตัดบรรทัดใน skip ออก', () => {
    const cash = buildConversation(cafe, 1, { twist: 'cafe-cash-only' })
    const ids = cash.lines.map((line) => line.id)
    expect(cash.twist.titleTh).toBe('เครื่องรูดบัตรเสีย')
    expect(ids.indexOf('cafe-t2-1')).toBe(ids.indexOf('cafe-8') + 1)
    expect(ids).not.toContain('cafe-9')
    expect(cash.lines.find((line) => line.id === 'cafe-t2-2').twist).toBe(true)
    expect(buildConversation(cafe, 1, { twist: null }).twist).toBeNull()
  })

  it('ทุก twist ของทุกสถานการณ์: afterTurn / skip มีอยู่จริง', () => {
    for (const scenario of scenarios) {
      const ids = new Set(scenario.turns.map((turn) => turn.id))
      for (const twist of scenario.twists ?? []) {
        expect(ids.has(twist.afterTurn), twist.id).toBe(true)
        for (const id of twist.skip ?? []) expect(ids.has(id), `${twist.id}: ${id}`).toBe(true)
        const lines = buildConversation(scenario, 5, { twist: twist.id }).lines
        expect(lines.some((line) => line.twist), twist.id).toBe(true)
      }
    }
  })
})

describe('checkUserTurn', () => {
  const line = buildConversation(cafe, 1).lines.find((entry) => entry.id === 'cafe-2')
  const drink = buildConversation(cafe, 1).values.drink

  it('พูดตามตัวเลือก = ผ่าน', () => {
    expect(checkUserTurn(line, [line.options[1].text]).passed).toBe(true)
  })

  it('พูดแบบของตัวเองแต่มีคำสำคัญครบ = ผ่าน', () => {
    expect(checkUserTurn(line, [`um ${drink.key} for me`]).passed).toBe(true)
  })

  it('ไม่ตรงและไม่มีคำสำคัญ = ยังไม่ผ่าน + ทวนกลับด้วยตัวเลือกแรก', () => {
    const result = checkUserTurn(line, ['what time is it'])
    expect(result.passed).toBe(false)
    expect(result.recast.correct).toBe(line.options[0].text)
  })

  it('freeAnswer (บอกชื่อตัวเอง) พูดอะไรก็ผ่าน แต่ต้องมีเสียง', () => {
    const name = buildConversation(cafe, 1).lines.find((entry) => entry.id === 'cafe-6')
    expect(checkUserTurn(name, ['Somchai']).passed).toBe(true)
    expect(checkUserTurn(name, []).passed).toBe(false)
  })
})

describe('expandScenarioTexts / talkReviewLesson', () => {
  it('ทุกข้อความที่บทสนทนาอาจพูดอยู่ในรายการเสียง (สุ่ม 50 รอบ)', () => {
    for (const scenario of scenarios) {
      const texts = new Set(expandScenarioTexts(scenario))
      const twistOptions = ['auto', null, ...(scenario.twists ?? []).map((twist) => twist.id)]
      for (let seed = 0; seed < 50; seed += 1) {
        const twist = twistOptions[seed % twistOptions.length]
        for (const line of buildConversation(scenario, seed, { twist }).lines) {
          if (line.speaker === 'npc') expect(texts.has(line.target), line.target).toBe(true)
          else for (const option of line.options) expect(texts.has(option.text), option.text).toBe(true)
        }
      }
    }
  })

  it('บทเรียนสำหรับทบทวน: บรรทัดของเรา ใช้ค่าแรกของช่อง (คงที่)', () => {
    const lesson = talkReviewLesson(cafe)
    expect(lesson.id).toBe('talk-cafe')
    const userTurnIds = [...cafe.turns, ...cafe.twists.flatMap((twist) => twist.turns)]
      .filter((turn) => turn.speaker === 'user')
      .map((turn) => turn.id)
    expect(lesson.items.map((item) => item.id)).toEqual(userTurnIds)
    expect(lesson.items[0].target).toContain(defaultSlotValues(cafe).drink.en)
  })
})
