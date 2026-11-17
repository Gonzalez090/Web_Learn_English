import { describe, it, expect } from 'vitest'
import {
  buildConversation,
  checkUserTurn,
  defaultSlotValues,
  expandScenarioTexts,
  fillSlots,
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
      for (let seed = 0; seed < 50; seed += 1) {
        for (const line of buildConversation(scenario, seed).lines) {
          if (line.speaker === 'npc') expect(texts.has(line.target), line.target).toBe(true)
          else for (const option of line.options) expect(texts.has(option.text), option.text).toBe(true)
        }
      }
    }
  })

  it('บทเรียนสำหรับทบทวน: บรรทัดของเรา ใช้ค่าแรกของช่อง (คงที่)', () => {
    const lesson = talkReviewLesson(cafe)
    expect(lesson.id).toBe('talk-cafe')
    expect(lesson.items.map((item) => item.id)).toEqual(cafe.turns.filter((t) => t.speaker === 'user').map((t) => t.id))
    expect(lesson.items[0].target).toContain(defaultSlotValues(cafe).drink.en)
  })
})
