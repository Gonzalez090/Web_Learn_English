import { describe, it, expect } from 'vitest'
import { buildListenTapRounds, listenTapPrompt } from './listenTap'
import { createRandom, shuffle } from './random'

const items = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id, word: id.toUpperCase() }))

describe('random', () => {
  it('seed เดิมได้ลำดับเดิม, seed ต่างได้ลำดับต่าง', () => {
    const list = [1, 2, 3, 4, 5, 6, 7, 8]
    expect(shuffle(list, createRandom(42))).toEqual(shuffle(list, createRandom(42)))
    expect(shuffle(list, createRandom(1))).not.toEqual(shuffle(list, createRandom(2)))
  })

  it('shuffle ไม่แก้ array เดิม และสมาชิกครบ', () => {
    const list = [1, 2, 3]
    const result = shuffle(list, createRandom(7))
    expect(list).toEqual([1, 2, 3])
    expect([...result].sort()).toEqual([1, 2, 3])
  })
})

describe('buildListenTapRounds', () => {
  const rounds = buildListenTapRounds(items, { optionsPerRound: 3, seed: 123 })

  it('ทุกข้อเป็นคำตอบครบ 1 รอบพอดี', () => {
    expect(rounds.map((r) => r.answer.id).sort()).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('แต่ละรอบมีตัวเลือก 3 ภาพ ไม่ซ้ำกัน และมีคำตอบอยู่ด้วย', () => {
    for (const round of rounds) {
      const ids = round.options.map((o) => o.id)
      expect(ids).toHaveLength(3)
      expect(new Set(ids).size).toBe(3)
      expect(ids).toContain(round.answer.id)
    }
  })

  it('ข้อน้อยกว่าจำนวนตัวเลือก → ใช้เท่าที่มี', () => {
    const two = buildListenTapRounds(items.slice(0, 2), { optionsPerRound: 4, seed: 1 })
    expect(two[0].options).toHaveLength(2)
  })

  it('seed เดิมได้เกมเดิม (ทดสอบซ้ำได้)', () => {
    expect(buildListenTapRounds(items, { seed: 9 })).toEqual(buildListenTapRounds(items, { seed: 9 }))
  })

  it('คำถามใช้ target ก่อน แล้วค่อย word', () => {
    expect(listenTapPrompt({ word: 'Mama', target: 'mama' })).toBe('mama')
    expect(listenTapPrompt({ word: 'Mommy' })).toBe('Mommy')
  })

  it('ใช้ pool เป็นตัวหลอกได้ (ฝึกซ้ำเฉพาะข้อที่พลาด)', () => {
    const missed = buildListenTapRounds(items.slice(0, 1), { optionsPerRound: 4, pool: items, seed: 5 })
    expect(missed).toHaveLength(1)
    expect(missed[0].answer.id).toBe('a')
    expect(missed[0].options).toHaveLength(4)
    expect(new Set(missed[0].options.map((o) => o.id)).size).toBe(4)
  })
})
