import { describe, it, expect } from 'vitest'
import { normalizeWord, tokenize, similarity, scoreTranscript, compareSpeech, PASS_SCORE } from './compareWords'

const statuses = (result) => result.words.map((word) => `${word.text}:${word.status}`)

describe('normalizeWord', () => {
  it('ตัวเล็ก + ตัดเครื่องหมายหัวท้าย', () => {
    expect(normalizeWord('Dog!')).toEqual(['dog'])
    expect(normalizeWord('"Hi,')).toEqual(['hi'])
  })

  it('รูปย่อ → รูปเต็ม (รวม apostrophe แบบโค้ง)', () => {
    expect(normalizeWord("Don't")).toEqual(['do', 'not'])
    expect(normalizeWord('I’m')).toEqual(['i', 'am'])
    expect(normalizeWord("Where's")).toEqual(['where', 'is'])
    expect(normalizeWord('gonna')).toEqual(['going', 'to'])
  })

  it('ตัวเลข → คำ, คำมีขีดแยกเป็นคำย่อย', () => {
    expect(normalizeWord('2')).toEqual(['two'])
    expect(normalizeWord('bye-bye')).toEqual(['bye', 'bye'])
  })

  it("คำแสดงความเป็นเจ้าของที่ไม่อยู่ในรายการ คงเดิม (Daddy's)", () => {
    expect(normalizeWord("Daddy's")).toEqual(["daddy's"])
  })

  it('เครื่องหมายล้วน → ไม่มีคำ', () => {
    expect(normalizeWord('…')).toEqual([])
    expect(tokenize('Hmm, somebody’s hiding…').map((u) => u.display)).toEqual(['Hmm,', 'somebody’s', 'hiding…'])
  })
})

describe('similarity', () => {
  it('คำเหมือนกัน = 1, ต่างกันหมด = 0, ใกล้เคียง อยู่ระหว่างกลาง', () => {
    expect(similarity('dog', 'dog')).toBe(1)
    expect(similarity('dog', 'cat')).toBe(0)
    expect(similarity('dog', 'dock')).toBeCloseTo(0.5)
  })
})

describe('scoreTranscript', () => {
  it('พูดตรงทุกคำ = 100 (ไม่สนตัวพิมพ์และเครื่องหมาย)', () => {
    const result = scoreTranscript('I want juice.', 'i want juice')
    expect(result.score).toBe(100)
    expect(statuses(result)).toEqual(['I:correct', 'want:correct', 'juice.:correct'])
  })

  it('รูปย่อกับรูปเต็มถือว่าเหมือนกัน (ทั้งสองทาง)', () => {
    expect(scoreTranscript("Where's the cat?", 'where is the cat').score).toBe(100)
    expect(scoreTranscript('No, I do not like it.', "no I don't like it").score).toBe(100)
  })

  it('ขาดคำ → คำนั้นเป็น missed และคะแนนลด', () => {
    const result = scoreTranscript('He goes to school.', 'he goes school')
    expect(statuses(result)).toEqual(['He:correct', 'goes:correct', 'to:missed', 'school.:correct'])
    expect(result.score).toBe(75)
  })

  it('พูดคำเกิน (um, please) ไม่หักคะแนน', () => {
    expect(scoreTranscript('I want juice.', 'um I want juice please').score).toBe(100)
  })

  it('คำที่ออกเสียงใกล้เคียง → close ได้คะแนนครึ่งเดียว (โหมดปกติ)', () => {
    const result = scoreTranscript('I want juice.', 'I want juices')
    expect(result.words[2].status).toBe('close')
    expect(result.score).toBe(83)
  })

  it('พูดคำอื่นไปเลย → missed', () => {
    const result = scoreTranscript('I want juice.', 'I want shoes')
    expect(result.words[2].status).toBe('missed')
    expect(result.score).toBeLessThan(PASS_SCORE.normal)
  })

  it('รูปย่อที่พูดผิดครึ่งเดียว → คำนั้นเป็น close', () => {
    // don't = do + not → พูดแค่ "do" (ขาด not)
    const result = scoreTranscript("I don't like it.", 'I do like it')
    expect(result.words[1]).toEqual({ text: "don't", status: 'close' })
  })

  it('ไม่ได้ยินอะไรเลย = 0 ทุกคำ missed', () => {
    const result = scoreTranscript('dog', '')
    expect(result.score).toBe(0)
    expect(result.words[0].status).toBe('missed')
  })
})

describe('โหมดผ่อนปรน (Stage 2–3)', () => {
  it('คำที่ยอมรับเพิ่ม (acceptAlso) = 100', () => {
    expect(scoreTranscript('mama', 'mom', { lenient: true, acceptAlso: ['mom', 'mommy'] }).score).toBe(100)
  })

  it('พูดคำเป้าหมายอยู่ในประโยคที่ยาวกว่า = 100', () => {
    expect(scoreTranscript('more milk', 'yes more milk please', { lenient: true }).score).toBe(100)
  })

  it('คำใกล้เคียง (dog → dock) ผ่านในโหมดผ่อนปรน', () => {
    const result = compareSpeech('dog', ['dock'], { lenient: true })
    expect(result.words[0].status).toBe('close')
    expect(result.passed).toBe(true)
  })

  it('คำใกล้เคียงแบบเดียวกัน ไม่ผ่านในโหมดปกติ', () => {
    expect(compareSpeech('dog', ['dock']).passed).toBe(false)
  })
})

describe('compareSpeech (เลือกแบบที่ได้ยินดีที่สุด)', () => {
  it('เลือก alternative ที่คะแนนสูงสุด และบอกว่าได้ยินว่าอะไร', () => {
    const result = compareSpeech('I want juice.', [
      { transcript: 'I want shoes', confidence: 0.9 },
      { transcript: 'I want juice', confidence: 0.6 },
    ])
    expect(result.score).toBe(100)
    expect(result.heard).toBe('I want juice')
    expect(result.passed).toBe(true)
  })

  it('รับได้ทั้ง array ของข้อความ', () => {
    expect(compareSpeech('cat', ['cat']).score).toBe(100)
  })

  it('ไม่มีอะไรเลย → 0, ไม่ผ่าน, heard ว่าง', () => {
    expect(compareSpeech('cat', [])).toMatchObject({ score: 0, passed: false, heard: '' })
  })

  it('ผิดทุกแบบ → ยังบอกว่าได้ยินแบบแรกว่าอะไร', () => {
    expect(compareSpeech('cat', ['dog', 'log']).heard).toBe('dog')
  })

  it('ใช้ได้กับประโยคจริงในบทเรียน Stage 4', () => {
    expect(compareSpeech("Daddy's home!", ["daddy's home"]).passed).toBe(true)
    expect(compareSpeech("Where's the cat?", ['where is the cat']).passed).toBe(true)
    expect(compareSpeech('He goes to school.', ['he go school']).passed).toBe(false)
  })
})
