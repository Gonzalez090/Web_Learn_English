import { describe, it, expect } from 'vitest'
import { checkKeywords, compareKeywords, keywordLabel, parseKeyword, stem } from './storyCheck'

describe('stem (รากคำแบบง่าย)', () => {
  it('รูปอดีต/พหูพจน์/-ing เป็นรากเดียวกัน', () => {
    for (const [a, b] of [
      ['kicked', 'kick'],
      ['kicking', 'kick'],
      ['kicks', 'kick'],
      ['liked', 'like'],
      ['puppies', 'puppy'],
      ['hugged', 'hug'],
      ['running', 'run'],
      ['flew', 'fly'],
      ['flies', 'fly'],
      ['flying', 'fly'],
      ['held', 'hold'],
      ['kites', 'kite'],
      ['goes', 'go'],
      ['boxes', 'box'],
      ['made', 'making'],
    ]) {
      expect(stem(a), `${a} = ${b}`).toBe(stem(b))
    }
  })

  it('คำสั้นไม่ถูกตัด และพยัญชนะซ้ำท้ายคำยุบเหมือนกันทุกรูป (kiss = kissed = kisses)', () => {
    expect(stem('bus')).toBe('bus')
    expect(stem('up')).toBe('up')
    expect(new Set(['kiss', 'kissed', 'kisses', 'kissing'].map(stem)).size).toBe(1)
    expect(new Set(['fall', 'falls', 'falling', 'fell'].map(stem)).size).toBe(1)
  })
})

describe('คำสำคัญ (requiredWords)', () => {
  it('แยกคำที่ใช้แทนกันได้ด้วย / และวลีหลายคำ', () => {
    expect(parseKeyword('puppy/dog')).toEqual([['puppy'], ['dog']])
    expect(parseKeyword('fell down')).toEqual([[stem('fall'), 'down']])
    expect(keywordLabel('puppy/dog')).toBe('puppy')
  })

  it('เจอคำในรูปไหนก็ได้ + คำแทน + วลีต้องติดกัน', () => {
    const result = checkKeywords(['kite', 'fly', 'puppy/dog', 'fell down'], 'the dogs flew the kites and he falls down')
    expect(result.words.map((word) => word.found)).toEqual([true, true, true, true])
    expect(checkKeywords(['fell down'], 'down he fell').words[0].found).toBe(false)
  })

  it('ผ่านเมื่อได้ ≥ 60%: 2 คำต้องได้ 2, 3 คำได้ 2 ก็ผ่าน', () => {
    expect(checkKeywords(['kite', 'bird'], 'a kite').passed).toBe(false)
    expect(checkKeywords(['kite', 'bird'], 'a kite like a bird').passed).toBe(true)
    expect(checkKeywords(['friend', 'hold', 'string'], 'his friend is holding it').passed).toBe(true)
    expect(checkKeywords(['friend', 'hold', 'string'], 'his friend').passed).toBe(false)
    expect(checkKeywords([], 'anything').passed).toBe(false)
  })

  it('ออกเสียงใกล้เคียงนับได้เฉพาะคำยาว', () => {
    expect(checkKeywords(['puppy'], 'a poppy').words[0].found).toBe(true)
    expect(checkKeywords(['kite'], 'a kit').words[0].found).toBe(true) // รากเดียวกัน (kite → kit)
    expect(checkKeywords(['kite'], 'a cat').words[0].found).toBe(false)
  })
})

describe('compareKeywords (ผลแบบเดียวกับ compareSpeech)', () => {
  const model = 'Sam got a new kite. It looked like a big bird!'

  it('เลือกแบบที่ได้ยินซึ่งได้คำสำคัญมากที่สุด', () => {
    const result = compareKeywords(['kite', 'bird'], ['a kit', 'he got a kite it looks like a bird'], { model })
    expect(result).toMatchObject({ score: 100, passed: true, heard: 'he got a kite it looks like a bird', recast: null })
    expect(result.words).toEqual([
      { text: 'kite', status: 'correct' },
      { text: 'bird', status: 'correct' },
    ])
  })

  it('ยังไม่ผ่าน → ทวนกลับด้วยประโยคที่เจ้าของภาษาเล่า (คำขึ้นต้นหมุนเวียน)', () => {
    const result = compareKeywords(['kite', 'bird'], [{ transcript: 'a kite' }], { model, attempt: 1 })
    expect(result.passed).toBe(false)
    expect(result.words[1]).toEqual({ text: 'bird', status: 'missed' })
    expect(result.recast).toEqual({ kind: 'model', opener: 'Like this.', correct: model, lines: ['Like this.', model] })
  })

  it('ไม่ได้ยินอะไรเลย = 0 คะแนน', () => {
    expect(compareKeywords(['kite'], [], { model })).toMatchObject({ score: 0, passed: false, heard: '' })
  })
})

describe('คำพ้องเสียงในคำสำคัญ', () => {
  it('ได้ยินคำพ้องเสียง (rode = road, sails = sale) นับว่าพบคำสำคัญ', () => {
    expect(checkKeywords(['road'], 'we rode down the hill').words[0].found).toBe(true)
    expect(checkKeywords(['sale'], 'look at the sails').words[0].found).toBe(true)
    expect(checkKeywords(['read'], 'she is reading').words[0].found).toBe(true)
  })
})
