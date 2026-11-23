import { describe, expect, it } from 'vitest'
import { addCard, cardRarity, cardsToShow, situationSummary, SPECIAL_TOTAL } from './collection'
import gameData from '../data/game.json'
import phrasesData from '../data/phrases.json'

const phrase = (id, text) => ({ id, text })

describe('การ์ดพิเศษ (game.json collection.special)', () => {
  const { idiom, slang } = gameData.collection.special
  const texts = new Set(phrasesData.phrases.map((item) => item.text))

  it('ทุกข้อความเป็นวลีที่มีจริงในคลังวลี ไม่ซ้ำกัน', () => {
    for (const text of [...idiom, ...slang]) expect(texts.has(text), text).toBe(true)
    expect(new Set([...idiom, ...slang]).size).toBe(idiom.length + slang.length)
    expect(SPECIAL_TOTAL).toBe(idiom.length + slang.length)
  })

  it('การ์ดพิเศษหายาก (ไม่เกิน 10% ของคลัง) แต่มีให้สะสมพอ (≥ 40)', () => {
    expect(SPECIAL_TOTAL).toBeGreaterThanOrEqual(40)
    expect(SPECIAL_TOTAL).toBeLessThanOrEqual(phrasesData.phrases.length * 0.1)
  })

  it('cardRarity', () => {
    expect(cardRarity({ text: "I'm over the moon!" })).toBe('idiom')
    expect(cardRarity({ text: 'My bad.' })).toBe('slang')
    expect(cardRarity({ text: 'Thanks so much!' })).toBeNull()
  })
})

describe('addCard', () => {
  it('ได้ครั้งเดียวต่อวลี เรียงตามลำดับที่ได้', () => {
    const first = addCard([], 'p1')
    expect(first).toEqual({ collection: ['p1'], added: true })
    const second = addCard(first.collection, 'p2')
    expect(second.collection).toEqual(['p1', 'p2'])
    const again = addCard(second.collection, 'p1')
    expect(again.added).toBe(false)
    expect(again.collection).toBe(second.collection)
  })
})

describe('สรุป + การ์ดที่แสดง', () => {
  const phrases = [
    phrase('a', 'Thanks so much!'),
    phrase('b', "I'm over the moon!"),
    phrase('c', 'My bad.'),
    phrase('d', 'Sounds good!'),
  ]

  it('situationSummary นับการ์ดที่ได้ + การ์ดพิเศษ', () => {
    expect(situationSummary(phrases, new Set(['a', 'c']))).toEqual({ total: 4, owned: 2, special: 2, specialOwned: 1 })
  })

  it('ทั้งหมด = ใหม่สุดก่อน / พิเศษ = เฉพาะพิเศษ + ใบที่ยังไม่ได้แบบปิดไว้', () => {
    const all = cardsToShow(phrases, ['c', 'a', 'd'], 'all')
    expect(all.owned.map((card) => card.phrase.id)).toEqual(['d', 'a', 'c'])
    expect(all.lockedSpecial).toEqual([])
    const special = cardsToShow(phrases, ['c', 'a', 'd'], 'special')
    expect(special.owned.map((card) => [card.phrase.id, card.rarity])).toEqual([['c', 'slang']])
    expect(special.lockedSpecial.map((card) => card.phrase.id)).toEqual(['b'])
  })
})
