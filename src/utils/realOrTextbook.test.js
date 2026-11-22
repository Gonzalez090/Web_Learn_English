import { describe, it, expect } from 'vitest'
import { buildRotRounds, lessonRotPairs, ROT_MIN_ROUNDS, ROT_ROUNDS } from './realOrTextbook'
import { createRandom } from './random'
import { lessonList, textbookVsReal } from '../data'

describe('buildRotRounds', () => {
  it('ทุกรอบมี 2 ตัวเลือก: แบบพูดจริง 1 + แบบในตำรา 1 และคำตอบคือแบบพูดจริง', () => {
    const rounds = buildRotRounds(textbookVsReal, { random: createRandom(3) })
    expect(rounds).toHaveLength(ROT_ROUNDS)
    for (const round of rounds) {
      expect(round.options.map((option) => option.kind).sort()).toEqual(['real', 'textbook'])
      expect(round.options.find((option) => option.kind === 'real').text).toBe(round.answer)
      expect(round.item.real.map((real) => real.text)).toContain(round.answer)
      expect(round.prompt && round.noteTh).toBeTruthy()
    }
  })

  it('คู่หลัก (ของสถานการณ์) มาก่อน แล้วเติมด้วยคู่อื่นจนครบ ไม่ซ้ำกัน', () => {
    // คู่หลักน้อยกว่าจำนวนรอบ → ต้องเติมจากคู่อื่น
    const main = textbookVsReal.filter((pair) => pair.situation === 'food').slice(0, 2)
    const rounds = buildRotRounds(main, { extra: textbookVsReal, random: createRandom(9) })
    expect(rounds).toHaveLength(ROT_ROUNDS)
    expect(rounds.slice(0, main.length).map((round) => round.item.situation)).toEqual(main.map(() => 'food'))
    const ids = rounds.map((round) => round.item.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('seed เดิมได้รอบเดิม / คำตอบไม่ได้อยู่ฝั่งเดียวตลอด', () => {
    expect(buildRotRounds(textbookVsReal, { random: createRandom(5), count: 15 })).toEqual(
      buildRotRounds(textbookVsReal, { random: createRandom(5), count: 15 }),
    )
    const sides = buildRotRounds(textbookVsReal, { random: createRandom(5), count: 15 }).map((round) =>
      round.options.findIndex((option) => option.kind === 'real'),
    )
    expect(new Set(sides).size).toBe(2)
  })
})

describe('lessonRotPairs (เกมในบทสนทนา Stage 5)', () => {
  const order = ['l1', 'l2', 'l3', 'l4']
  const pair = (id, lessonId) => ({ id, lessonId })
  const pairs = [pair('a', 'l1'), pair('b', 'l2'), pair('c', 'l3'), pair('d', 'l4'), pair('e', 'l4'), { id: 'adult' }]

  it('คู่ของบทนี้ + คู่ของบทที่เรียนมาก่อน (ไม่เอาบทหลัง / คู่ที่ไม่ผูกบท)', () => {
    expect(lessonRotPairs('l3', pairs, order)).toEqual({ own: [pairs[2]], pool: [pairs[0], pairs[1]] })
  })

  it('บทไม่มีคู่ หรือรวมแล้วไม่ถึง ROT_MIN_ROUNDS → ไม่มีเกม', () => {
    expect(lessonRotPairs('l9', pairs, order)).toBeNull()
    expect(lessonRotPairs('l2', pairs, order)).toBeNull()
    expect(ROT_MIN_ROUNDS).toBe(3)
  })

  it('ข้อมูลจริง: บทแรกที่มีเกมได้ ≥ 3 รอบ และ pool มาจากบทก่อนเท่านั้น', () => {
    const lessonOrder = lessonList.map((lesson) => lesson.id)
    const withGame = lessonList.filter((lesson) => lessonRotPairs(lesson.id, textbookVsReal, lessonOrder))
    expect(withGame.length).toBeGreaterThanOrEqual(80)
    for (const lesson of withGame) {
      const { own, pool } = lessonRotPairs(lesson.id, textbookVsReal, lessonOrder)
      expect(own.length + pool.length).toBeGreaterThanOrEqual(ROT_MIN_ROUNDS)
      for (const entry of pool) expect(lessonOrder.indexOf(entry.lessonId)).toBeLessThan(lessonOrder.indexOf(lesson.id))
    }
  })
})
