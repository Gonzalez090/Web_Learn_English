import { describe, it, expect } from 'vitest'
import { needsAn, splitKeywords, swapRaceRounds, swapVariants, swapWord } from './swap'

describe('swapWord (สลับคำในประโยค)', () => {
  it('แทนคำสำคัญทั้งคำ ไม่แตะคำที่มีคำนั้นซ้อนอยู่', () => {
    expect(swapWord('I want juice.', 'juice', 'milk')).toBe('I want milk.')
    expect(swapWord('The cat sat on the catalog.', 'cat', 'dog')).toBe('The dog sat on the catalog.')
  })

  it('ต้นประโยคขึ้นต้นตัวใหญ่ / คำที่เขียนตัวใหญ่ในข้อมูลแต่อยู่กลางประโยคเป็นตัวเล็ก', () => {
    expect(swapWord('Push me, Daddy!', 'Push', 'catch')).toBe('Catch me, Daddy!')
    expect(swapWord('Shake, shake, shake!', 'Shake', 'Tap')).toBe('Tap, tap, tap!')
    expect(swapWord('Higher, Daddy, higher!', 'higher', 'faster')).toBe('Faster, Daddy, faster!')
  })

  it('ชื่อเฉพาะคงตัวใหญ่ + ใช้กับรูป \'s ได้', () => {
    expect(swapWord('Wait for me!', 'me', 'Mommy')).toBe('Wait for Mommy!')
    expect(swapWord("Daddy's home!", 'Daddy', 'Grandma')).toBe("Grandma's home!")
  })

  it('แก้ a / an หน้าคำที่แทน แต่ไม่แตะคำแทนที่มี a ของตัวเอง', () => {
    expect(swapWord("It's a bird!", 'bird', 'owl')).toBe("It's an owl!")
    expect(swapWord('We need an umbrella!', 'umbrella', 'coat')).toBe('We need a coat!')
    expect(swapWord('Can I have some?', 'some', 'a bite')).toBe('Can I have a bite?')
    expect(needsAn('hour')).toBe(true)
    expect(needsAn('unicorn')).toBe(false)
  })

  it('ไม่พบคำ → ประโยคเดิม', () => {
    expect(swapWord('I want juice.', 'milk', 'water')).toBe('I want juice.')
  })
})

const item = {
  id: 'x',
  target: 'I want juice.',
  keywords: [
    {
      word: 'juice',
      alternatives: [
        { word: 'milk', meaningTh: 'นม', register: 'neutral' },
        { word: 'water', meaningTh: 'น้ำ', register: 'neutral' },
        { word: 'a cookie', meaningTh: 'คุกกี้', register: 'neutral' },
      ],
    },
  ],
}

describe('swapVariants / splitKeywords', () => {
  it('สร้างประโยคที่สลับได้ทุกแบบ (คำสำคัญ × คำแทน)', () => {
    expect(swapVariants(item).map((variant) => variant.text)).toEqual([
      'I want milk.',
      'I want water.',
      'I want a cookie.',
    ])
  })

  it('แยกคำสำคัญออกมาเป็นช่วงที่กดได้ (คำยาวก่อน)', () => {
    expect(splitKeywords('I want a cookie.', [{ word: 'a cookie', key: 'juice' }])).toEqual([
      { text: 'I want ' },
      { text: 'a cookie', key: 'juice' },
      { text: '.' },
    ])
    expect(splitKeywords('No keyword here', [])).toEqual([{ text: 'No keyword here' }])
  })
})

describe('swapRaceRounds (เกม Word Swap Race)', () => {
  it('1 รอบต่อคำแทน 1 คำ ตัวเลือกมีคำตอบอยู่ และไม่ซ้ำกัน', () => {
    const rounds = swapRaceRounds([item], () => 0.5)
    expect(rounds).toHaveLength(3)
    for (const round of rounds) {
      const words = round.options.map((option) => option.word)
      expect(words).toContain(round.answer.word)
      expect(new Set(words).size).toBe(words.length)
      expect(round.text).toBe(swapWord(item.target, 'juice', round.answer.word))
    }
  })

  it('ข้อที่ไม่มีคำสำคัญ → ไม่มีรอบ', () => {
    expect(swapRaceRounds([{ id: 'y', target: 'Hi!' }])).toEqual([])
  })
})
