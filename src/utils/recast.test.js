import { describe, it, expect } from 'vitest'
import { applyRecast, findCommonError, normalizeForPattern, RECAST_OPENERS } from './recast'
import { compareSpeech } from './compareWords'

const goesToSchool = {
  target: 'He goes to school.',
  commonErrors: [
    { pattern: '^he go (to )?school$', correct: 'He goes to school.' },
    { pattern: '^he goes school$', correct: 'He goes to school.' },
  ],
}

const dontLike = {
  target: "No, I don't like it.",
  commonErrors: [{ pattern: "^(no )?i don't like$", correct: "No, I don't like it." }],
}

// ผลการพูดจริงจากตัวให้คะแนน (ไม่สร้างผลปลอม)
const spoken = (item, transcript) => compareSpeech(item.target, [transcript])

describe('normalizeForPattern', () => {
  it('ตัวเล็ก ตัดเครื่องหมาย เก็บ \' และเว้นวรรคเดียว', () => {
    expect(normalizeForPattern('  He GO,  school! ')).toBe('he go school')
    expect(normalizeForPattern('I don’t like')).toBe("i don't like")
  })
})

describe('findCommonError', () => {
  it('จับรูปแบบผิดที่พบบ่อยได้', () => {
    expect(findCommonError(goesToSchool.commonErrors, 'he go school')?.pattern).toBe('^he go (to )?school$')
    expect(findCommonError(goesToSchool.commonErrors, 'He goes school.')?.pattern).toBe('^he goes school$')
  })

  it('จับได้ทั้งรูปย่อและรูปเต็ม ("do not" ตรงกับ pattern ที่เขียนว่า don\'t ไม่ได้ แต่ "don\'t" ได้)', () => {
    expect(findCommonError(dontLike.commonErrors, "I don't like")).not.toBeNull()
    const expanded = [{ pattern: '^i do not like$', correct: "I don't like it." }]
    expect(findCommonError(expanded, "I don't like")).not.toBeNull()
  })

  it('ไม่จับประโยคที่ถูก / ไม่มีข้อมูล / pattern เสีย ไม่ทำให้พัง', () => {
    expect(findCommonError(goesToSchool.commonErrors, 'He goes to school')).toBeNull()
    expect(findCommonError(undefined, 'he go school')).toBeNull()
    expect(findCommonError(goesToSchool.commonErrors, '')).toBeNull()
    expect(findCommonError([{ pattern: '(', correct: 'x' }], 'anything')).toBeNull()
  })
})

describe('applyRecast', () => {
  it('พูดถูกครบ → ไม่ต้องทวน', () => {
    const result = applyRecast(goesToSchool, spoken(goesToSchool, 'he goes to school'))
    expect(result.passed).toBe(true)
    expect(result.recast).toBeNull()
  })

  it('ตรงรูปแบบผิด → ตอบรับแล้วทวนแบบที่ถูก และให้ลองใหม่ แม้คะแนนรายคำถึงเกณฑ์', () => {
    const scored = spoken(goesToSchool, 'he go to school')
    expect(scored.passed).toBe(true) // 3 ใน 4 คำ = 75% ถึงเกณฑ์ 70%
    const result = applyRecast(goesToSchool, scored)
    expect(result.passed).toBe(false)
    expect(result.recast).toEqual({
      kind: 'error',
      opener: 'Yes!',
      correct: 'He goes to school.',
      lines: ['Yes!', 'He goes to school.'],
    })
  })

  it('ไม่ตรงรูปแบบไหนและยังไม่ผ่าน → พูดประโยคเป้าหมายให้ฟังอีกครั้ง', () => {
    const result = applyRecast(goesToSchool, spoken(goesToSchool, 'banana'))
    expect(result.passed).toBe(false)
    expect(result.recast.kind).toBe('model')
    expect(result.recast.correct).toBe('He goes to school.')
  })

  it('ผ่านแล้ว (ไม่ตรงรูปแบบผิด) → ไม่ทวน แม้ไม่ได้ 100%', () => {
    const result = applyRecast(goesToSchool, spoken(goesToSchool, 'he goes to the school'))
    expect(result.passed).toBe(true)
    expect(result.recast).toBeNull()
  })

  it('คำขึ้นต้นหมุนเวียนตามครั้งที่ลอง และมีให้เลือกทุกแบบ', () => {
    const scored = spoken(goesToSchool, 'he go school')
    const openers = RECAST_OPENERS.error.map((_, attempt) => applyRecast(goesToSchool, scored, attempt).recast.opener)
    expect(openers).toEqual(RECAST_OPENERS.error)
    expect(applyRecast(goesToSchool, scored, RECAST_OPENERS.error.length).recast.opener).toBe(RECAST_OPENERS.error[0])
  })

  it('คำขึ้นต้นทุกคำเป็นข้อความสั้น ๆ ภาษาอังกฤษ (มีไฟล์เสียง)', () => {
    for (const opener of [...RECAST_OPENERS.error, ...RECAST_OPENERS.model]) {
      expect(opener).toMatch(/^[A-Z][A-Za-z ,']*[.!]$/)
    }
  })
})
