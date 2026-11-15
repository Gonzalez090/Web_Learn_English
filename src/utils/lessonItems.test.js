import { describe, it, expect } from 'vitest'
import { coupletOf, prepareLessonItems, rhymeFillFor, sameWord, speakerOf, splitLastWord } from './lessonItems'

const rhymeLines = [
  { id: 'r1', target: 'Night, night! Time for bed.', translationTh: 'ฝันดีนะ' },
  { id: 'r2', target: 'Pillow for my sleepy head.', translationTh: 'หมอน' },
  { id: 'r3', target: 'Close your eyes, one, two, three.', translationTh: 'หลับตา' },
  { id: 'r4', target: 'Mommy gives a kiss to me.', translationTh: 'แม่จุ๊บ' },
]

describe('splitLastWord', () => {
  it('แยกคำท้ายออกจากเครื่องหมาย', () => {
    expect(splitLastWord('Pillow for my sleepy head.')).toEqual({ before: 'Pillow for my sleepy', word: 'head', after: '.' })
    expect(splitLastWord('Here you go. Thanks!')).toEqual({ before: 'Here you go.', word: 'Thanks', after: '!' })
    expect(splitLastWord('Bed')).toEqual({ before: '', word: 'Bed', after: '' })
    expect(splitLastWord('...')).toBeNull()
  })

  it('sameWord ไม่สนตัวพิมพ์', () => {
    expect(sameWord('Head', 'head')).toBe(true)
    expect(sameWord('head', 'bed')).toBe(false)
  })
})

describe('คำคล้องจอง (rhyme)', () => {
  it('เติมคำเฉพาะบรรทัดที่ 2 ของคู่ — ตัวเลือก = คำตอบ + คำท้ายของคู่อื่น', () => {
    expect(rhymeFillFor(rhymeLines, 0)).toBeNull()
    expect(rhymeFillFor(rhymeLines, 2)).toBeNull()
    const fill = rhymeFillFor(rhymeLines, 1)
    expect(fill).toMatchObject({ word: 'head', before: 'Pillow for my sleepy', after: '.', rhymesWith: 'bed' })
    expect([...fill.choices].sort()).toEqual(['head', 'me', 'three'])
    const last = rhymeFillFor(rhymeLines, 3)
    expect([...last.choices].sort()).toEqual(['bed', 'head', 'me'])
  })

  it('ลำดับตัวเลือกคงที่ทุกครั้ง (ไม่สลับตอน render ใหม่)', () => {
    expect(rhymeFillFor(rhymeLines, 1).choices).toEqual(rhymeFillFor(rhymeLines, 1).choices)
  })

  it('คู่ติดกันในเพลงเดียวกัน คำตอบไม่อยู่ช่องเดิม (เดาจากตำแหน่งไม่ได้)', () => {
    for (let song = 0; song < 50; song += 1) {
      const lines = rhymeLines.map((line, index) => ({ ...line, id: `song${song}-${index}` }))
      const first = rhymeFillFor(lines, 1)
      const second = rhymeFillFor(lines, 3)
      expect(first.choices.indexOf(first.word)).not.toBe(second.choices.indexOf(second.word))
      expect([first.couplet, second.couplet]).toEqual([0, 1])
    }
  })

  it('ตัวเลือกไม่เกิน 3 และไม่ซ้ำกัน แม้มีหลายคู่', () => {
    const many = [...rhymeLines, { id: 'r5', target: 'Hug my teddy, warm and tight.' }, { id: 'r6', target: 'Sweet dreams, good night!' }]
    const { choices } = rhymeFillFor(many, 5)
    expect(choices).toHaveLength(3)
    expect(new Set(choices).size).toBe(3)
    expect(choices).toContain('night')
  })

  it('prepareLessonItems: บรรทัดก่อนหน้าเป็นตัวนำ + rhymeFill เฉพาะบรรทัดคู่', () => {
    const items = prepareLessonItems({ type: 'rhyme', items: rhymeLines })
    expect(items[0].question).toBeUndefined()
    expect(items[1]).toMatchObject({ question: rhymeLines[0].target, questionTh: 'ฝันดีนะ' })
    expect(items[1].rhymeFill.word).toBe('head')
    expect(items[2].rhymeFill).toBeUndefined()
    expect(items[2].question).toBe(rhymeLines[1].target)
    expect(coupletOf(0)).toBe(0)
    expect(coupletOf(3)).toBe(1)
  })
})

describe('บทสนทนา (dialogue)', () => {
  const lesson = {
    type: 'dialogue',
    speakers: [
      { id: 'barista', name: 'Barista', nameTh: 'บาริสต้า' },
      { id: 'customer', name: 'Customer', nameTh: 'ลูกค้า' },
    ],
    items: [
      { id: 'd1', speaker: 'barista', target: 'Hi there!', translationTh: 'สวัสดี' },
      { id: 'd2', speaker: 'customer', target: 'Hi!', translationTh: 'หวัดดี' },
    ],
  }

  it('บรรทัดก่อนหน้า (อีกฝ่าย) เป็นตัวนำของบรรทัดถัดไป — ไม่แก้ข้อมูลเดิม', () => {
    const items = prepareLessonItems(lesson)
    expect(items[1]).toMatchObject({ question: 'Hi there!', questionTh: 'สวัสดี', speaker: 'customer' })
    expect(items[0].question).toBeUndefined()
    expect(lesson.items[1].question).toBeUndefined()
  })

  it('speakerOf หาผู้พูดของบรรทัด', () => {
    expect(speakerOf(lesson, lesson.items[0]).name).toBe('Barista')
    expect(speakerOf(lesson, { speaker: 'x' })).toBeNull()
  })

  it('บทประเภทอื่นคืน items เดิม', () => {
    const items = [{ id: 'a', target: 'Hi.' }]
    expect(prepareLessonItems({ type: 'sentence', items })).toBe(items)
  })
})
