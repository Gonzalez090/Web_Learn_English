import { describe, it, expect } from 'vitest'
import { buildDuelRounds, duelWordOf, soundPairItems } from './duel'

const items = [
  { id: 'a', word: 'sit', pairWith: 'sat' },
  { id: 'b', word: 'nap', pairWith: 'snap' },
  { id: 'c', word: 'ant' }, // ไม่มีคำคู่ → ใช้คำของข้ออื่น
]

describe('duel (Minimal Pair Duel)', () => {
  it('1 ข้อ = 1 รอบ ตัวเลือก 2 คำ = คำของข้อ + คำคู่', () => {
    const rounds = buildDuelRounds(items, { seed: 1 })
    expect(rounds).toHaveLength(3)
    const sit = rounds.find((round) => round.item.id === 'a')
    expect(sit.options.map((option) => option.text).sort()).toEqual(['sat', 'sit'])
  })

  it('คำที่ได้ยินเป็นหนึ่งในตัวเลือกเสมอ และสุ่มได้ทั้งสองฝั่ง', () => {
    const answers = new Set()
    for (let seed = 1; seed <= 30; seed += 1) {
      for (const round of buildDuelRounds(items, { seed })) {
        expect(round.options.map((option) => option.text)).toContain(round.answer.text)
        if (round.item.id === 'a') answers.add(round.answer.text)
      }
    }
    expect([...answers].sort()).toEqual(['sat', 'sit'])
  })

  it('ไม่มี pairWith → คู่กับคำของข้ออื่น (ไม่ใช่คำเดิม)', () => {
    const round = buildDuelRounds(items, { seed: 3 }).find((entry) => entry.item.id === 'c')
    const texts = round.options.map((option) => option.text)
    expect(texts).toHaveLength(2)
    expect(texts).toContain('ant')
    expect(new Set(texts).size).toBe(2)
  })

  it('seed เดิม → รอบเหมือนเดิม', () => {
    expect(buildDuelRounds(items, { seed: 7 })).toEqual(buildDuelRounds(items, { seed: 7 }))
  })

  it('ชุดฝึกเสียง → ข้อของเกม (คู่คำพร้อมความหมาย)', () => {
    const set = { id: 'th', pairs: [{ a: 'think', aTh: 'คิด', b: 'sink', bTh: 'อ่างล้างจาน' }] }
    expect(soundPairItems(set)).toEqual([
      { id: 'th:think-sink', word: 'think', meaningTh: 'คิด', pairWith: 'sink', pairMeaningTh: 'อ่างล้างจาน' },
    ])
    expect(duelWordOf(soundPairItems(set)[0])).toBe('think')
  })
})
