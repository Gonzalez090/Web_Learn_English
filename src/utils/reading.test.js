import { describe, it, expect } from 'vitest'
import { graphemeUnits, markGrapheme, readingUnits, readProgress, shortSoundTh, spellUnits } from './reading'

const sounds = {
  s: { grapheme: 's', soundTh: 'ซ', ipa: 's' },
  i: { grapheme: 'i', soundTh: 'อิ', ipa: 'ɪ' },
  t: { grapheme: 't', soundTh: 'ท', ipa: 't' },
}

describe('reading (ขั้นอ่าน Stage 6)', () => {
  it('หน่วยเสียงของคำ phonics → ตัวอักษร + เสียงไทย และสะกดกลับเป็นคำเดิม', () => {
    const units = graphemeUnits(['s', 'i', 't'], sounds)
    expect(units.map((unit) => unit.soundTh)).toEqual(['ซ', 'อิ', 'ท'])
    expect(spellUnits(units)).toBe('sit')
  })

  it('ป้ายตัวอักษรใช้เสียงไทยแบบสั้น และตัวที่ไม่ออกเสียงเป็น –', () => {
    const more = {
      ...sounds,
      r: { grapheme: 'r', soundTh: 'ร (อเมริกัน)' },
      'e-silent': { grapheme: 'e', soundTh: '(เงียบ)', silent: true },
    }
    expect(graphemeUnits(['r', 'e-silent'], more).map((unit) => unit.hint)).toEqual(['ร', '–'])
    expect(shortSoundTh(more['e-silent'])).toBe('–')
  })

  it('ระบายตัวอักษรที่กำลังสอนในคำตัวอย่าง', () => {
    expect(markGrapheme('cat', 'a')).toEqual({ before: 'c', match: 'a', after: 't' })
    expect(markGrapheme('Sun', 's')).toEqual({ before: '', match: 'S', after: 'un' })
    expect(markGrapheme('dog', 'a')).toEqual({ before: 'dog', match: '', after: '' })
  })

  it('ประโยค → คำตามที่เขียน (เครื่องหมายล้วนไม่นับเป็นคำที่ต้องอ่าน)', () => {
    const units = readingUnits('Up, up, up! — The kite flew!')
    expect(units.map((unit) => unit.display)).toEqual(['Up,', 'up,', 'up!', '—', 'The', 'kite', 'flew!'])
    expect(units.filter((unit) => unit.countable)).toHaveLength(6)
    expect(units.map((unit) => unit.order)).toEqual([0, 1, 2, -1, 3, 4, 5])
  })

  it('อ่านถึงคำไหนแล้ว: นับจากต้นประโยคตามลำดับ', () => {
    expect(readProgress('Sam got a new kite.', '')).toBe(0)
    expect(readProgress('Sam got a new kite.', 'sam got')).toBe(2)
    expect(readProgress('Sam got a new kite.', 'sam got a new kite')).toBe(5)
  })

  it('ผ่อนปรนคำที่ได้ยินใกล้เคียง และข้ามคำเกินได้นิดหน่อย', () => {
    expect(readProgress('Sam got a new kite.', 'sam gut a new kit')).toBe(5)
    expect(readProgress('Sam got a new kite.', 'um sam got a new kite')).toBe(5)
  })

  it('ข้ามคำในประโยคไม่ได้ (หยุดที่คำแรกที่ยังไม่ได้อ่าน)', () => {
    expect(readProgress('Sam got a new kite.', 'sam kite')).toBe(1)
  })
})
