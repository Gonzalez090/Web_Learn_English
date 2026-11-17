import { describe, it, expect } from 'vitest'
import { buildRotRounds, ROT_ROUNDS } from './realOrTextbook'
import { createRandom } from './random'
import { textbookVsReal } from '../data'

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
    const main = textbookVsReal.filter((pair) => pair.situation === 'food')
    const rounds = buildRotRounds(main, { extra: textbookVsReal, random: createRandom(9) })
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
