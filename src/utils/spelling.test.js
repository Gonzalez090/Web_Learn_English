import { describe, it, expect } from 'vitest'
import {
  checkFreeWriting,
  cleanWord,
  compareSpelling,
  countSentences,
  editDistance,
  hasThaiLetters,
  isInflectionOf,
  isPassingStatus,
  soundKey,
  spellingStatus,
  splitBlank,
  splitSentences,
} from './spelling'

describe('cleanWord / soundKey / editDistance', () => {
  it('ตัดเครื่องหมาย + ตัวเล็ก + apostrophe แบบตรง', () => {
    expect(cleanWord('Kite!')).toBe('kite')
    expect(cleanWord('Don’t,')).toBe("don't")
    expect(cleanWord('"Sam')).toBe('sam')
  })

  it('คำที่เด็กเขียนตามเสียง ได้รูปเสียงเดียวกับคำจริง', () => {
    const pairs = [
      ['cat', 'kat'],
      ['phone', 'fone'],
      ['night', 'nite'],
      ['have', 'hav'],
      ['back', 'bak'],
      ['school', 'skool'],
      ['tree', 'tre'],
      ['happy', 'hapy'],
    ]
    for (const [word, spelled] of pairs) expect(soundKey(spelled), `${spelled} → ${word}`).toBe(soundKey(word))
  })

  it('คำที่เสียงต่างกันจริง ไม่ได้รูปเสียงเดียวกัน', () => {
    for (const [a, b] of [['sit', 'sat'], ['big', 'bag'], ['dog', 'dug'], ['ship', 'sheep'], ['he', 'the']]) {
      expect(soundKey(a), `${a} / ${b}`).not.toBe(soundKey(b))
    }
  })

  it('editDistance นับการสลับตัวอักษรติดกันเป็น 1', () => {
    expect(editDistance('kite', 'kiet')).toBe(1)
    expect(editDistance('friend', 'frend')).toBe(1)
    expect(editDistance('cat', 'dog')).toBe(3)
  })
})

describe('spellingStatus', () => {
  it('ถูก / สะกดตามเสียง / พิมพ์พลาด / ยังไม่ใช่', () => {
    expect(spellingStatus('Kite', 'kite')).toBe('correct')
    expect(spellingStatus('two', '2')).toBe('correct')
    expect(spellingStatus('cat', 'kat')).toBe('sound')
    expect(spellingStatus("don't", 'dont')).toBe('sound')
    expect(spellingStatus('friend', 'freind')).toBe('close')
    expect(spellingStatus('the', 'teh')).toBe('close')
    expect(spellingStatus('sit', 'sat')).toBe('missed')
    // เขียนเป็นคำจริงอีกคำ ≠ พิมพ์พลาด
    expect(spellingStatus('held', 'hold')).toBe('missed')
    expect(spellingStatus('want', 'went')).toBe('missed')
    expect(spellingStatus('kite', '')).toBe('missed')
  })

  it('ระดับ sound นับ "ใกล้แล้ว" ว่าผ่าน / ระดับ exact ต้องถูกเท่านั้น', () => {
    expect(isPassingStatus('sound', 'sound')).toBe(true)
    expect(isPassingStatus('close', 'sound')).toBe(true)
    expect(isPassingStatus('sound', 'exact')).toBe(false)
    expect(isPassingStatus('correct', 'exact')).toBe(true)
  })
})

describe('compareSpelling', () => {
  it('ถูกทุกคำ ไม่สนตัวพิมพ์และเครื่องหมาย (แต่มีคำแนะนำ)', () => {
    const result = compareSpelling('Sam got a new kite.', 'sam got a new kite')
    expect(result.passed).toBe(true)
    expect(result.score).toBe(100)
    expect(result.words.every((word) => word.status === 'correct')).toBe(true)
    expect(result.tips).toEqual(['capital', 'period'])
  })

  it('สะกดตามเสียง: ระดับ sound ผ่าน (ใกล้แล้ว) / ระดับ exact ยังไม่ผ่าน', () => {
    const sound = compareSpelling('Sam got a new kite.', 'Sam got a new kiet.', { mode: 'sound' })
    expect(sound.passed).toBe(true)
    expect(sound.close).toBe(true)
    expect(sound.words[4]).toEqual({ text: 'kite.', typed: 'kiet.', status: 'close' })
    const exact = compareSpelling('Sam got a new kite.', 'Sam got a new kiet.', { mode: 'exact' })
    expect(exact.passed).toBe(false)
  })

  it('คำที่ขาด / คำเกิน → ยังไม่ผ่าน และบอกตำแหน่ง', () => {
    const missing = compareSpelling('His friend held it up high.', 'His friend held it high.')
    expect(missing.passed).toBe(false)
    expect(missing.words.map((word) => word.status)).toEqual(['correct', 'correct', 'correct', 'correct', 'missed', 'correct'])
    const extra = compareSpelling('Dad made a picnic.', 'Dad made a big picnic.')
    expect(extra.passed).toBe(false)
    expect(extra.extra).toEqual(['big'])
    expect(extra.written.map((word) => word.status)).toEqual(['correct', 'correct', 'correct', 'extra', 'correct'])
  })

  it('รูปเต็มแทนรูปย่อก็ถูก + คำตอบอื่นที่ยอมรับ', () => {
    expect(compareSpelling("I don't like it.", 'I do not like it.').passed).toBe(true)
    expect(compareSpelling('Mom is in bed.', 'Mum is in bed.', { acceptAlso: ['Mum is in bed.'] }).passed).toBe(true)
  })

  it('ลืม apostrophe → คำแนะนำ', () => {
    const result = compareSpelling("Let's share him!", 'Lets share him!', { mode: 'sound' })
    expect(result.passed).toBe(true)
    expect(result.tips).toContain('apostrophe')
  })

  it('ยังไม่ได้เขียน = ยังไม่ผ่าน', () => {
    expect(compareSpelling('kite', '   ').passed).toBe(false)
  })
})

describe('splitBlank', () => {
  it('แบ่งประโยคตรงคำที่ให้เติม (เครื่องหมายอยู่ข้างช่องว่าง)', () => {
    expect(splitBlank('They ate on the blanket.', 'blanket')).toEqual({ before: 'They ate on the', after: '.', found: true })
    expect(splitBlank('His friend held it up high.', 'held')).toEqual({ before: 'His friend', after: ' it up high.', found: true })
    expect(splitBlank('Up, up, up! The kite flew!', 'up')).toEqual({ before: '', after: ', up, up! The kite flew!', found: true })
    expect(splitBlank('Sam got a kite.', 'dog').found).toBe(false)
  })
})

describe('ประโยคในงานเขียนอิสระ', () => {
  it('แบ่งประโยคที่ . ! ? และขึ้นบรรทัดใหม่ / นับเฉพาะประโยค ≥ 3 คำ', () => {
    expect(splitSentences('Sam got a kite. It flew!\nYay')).toEqual(['Sam got a kite', 'It flew', 'Yay'])
    expect(countSentences('Sam got a kite. It flew!\nUp, up, up!')).toBe(2)
  })

  it('ตรวจว่าพิมพ์เป็นอักษรไทย', () => {
    expect(hasThaiLetters('ไำพ')).toBe(true)
    expect(hasThaiLetters('kite')).toBe(false)
  })
})

describe('checkFreeWriting', () => {
  const models = ['The kite flew up high.', 'Up, up, up! The kite flew!']

  it('บรรยายภาพ: มีคำสำคัญครบ (รับรูปอดีต) = ผ่าน', () => {
    const result = checkFreeWriting('The kite flies in the sky.', {
      requiredWords: ['kite', 'fly/up'],
      models,
      requireAll: true,
    })
    expect(result.passed).toBe(true)
    expect(result.keywords.found).toBe(2)
    expect(result.hints).toEqual([])
  })

  it('ขาดคำสำคัญ → ยังไม่ผ่าน', () => {
    const result = checkFreeWriting('Sam is happy.', { requiredWords: ['kite', 'fly/up'], models, requireAll: true })
    expect(result.passed).toBe(false)
    expect(result.keywords.words).toEqual([
      { text: 'kite', found: false },
      { text: 'fly', found: false },
    ])
  })

  it('สะกดตามเสียง: ระดับ sound นับคำสำคัญ + แนะนำคำที่ถูก / ระดับ exact ยังไม่ผ่าน', () => {
    const options = { requiredWords: ['kite', 'fly/up'], models, requireAll: true }
    const sound = checkFreeWriting('The kiet flew up.', { ...options, mode: 'sound' })
    expect(sound.passed).toBe(true)
    expect(sound.hints).toEqual([{ typed: 'kiet', suggestion: 'kite', status: 'close' }])
    const exact = checkFreeWriting('The kiet flew up.', { ...options, mode: 'exact' })
    expect(exact.passed).toBe(false)
    expect(exact.hints).toHaveLength(1)
  })

  it('คำจริงที่ไม่อยู่ในตัวอย่าง (คำ Dolch / รูปผัน / รูปพิเศษ) ไม่ถูกแนะนำให้แก้', () => {
    const result = checkFreeWriting('Sam went out. His kites flew. He hide.', {
      requiredWords: ['kite'],
      models: ['Sam wants a kite.', 'Sam hid his face.', 'It can fly.'],
    })
    expect(result.hints).toEqual([])
  })

  it('สะกดรูปผันพลาด (snifed) → ยังได้คำแนะนำ และระดับ exact ยังไม่ผ่าน', () => {
    const result = checkFreeWriting('They found a cat. They sat down. The cat snifed his hand.', {
      requiredWords: ['cat', 'sniffed'],
      models: ['The cat sniffed his hand.'],
      minSentences: 3,
    })
    expect(result.hints).toEqual([{ typed: 'snifed', suggestion: 'sniffed', status: 'sound' }])
    expect(result.passed).toBe(false)
  })

  it('isInflectionOf: รูปผันปกติที่ถูกเท่านั้น', () => {
    expect(isInflectionOf('kites', 'kite')).toBe(true)
    expect(isInflectionOf('hugged', 'hug')).toBe(true)
    expect(isInflectionOf('smiling', 'smile')).toBe(true)
    expect(isInflectionOf('babies', 'baby')).toBe(true)
    expect(isInflectionOf('snifed', 'sniff')).toBe(false)
    expect(isInflectionOf('huged', 'hug')).toBe(false)
  })

  it('เรื่องสั้น: ต้องครบจำนวนประโยค + คำสำคัญ ≥ 60%', () => {
    const options = { requiredWords: ['Sam', 'kite', 'friend/held', 'fly/up'], models, minSentences: 3 }
    expect(checkFreeWriting('Sam got a kite. The kite flew up.', options).passed).toBe(false)
    const story = checkFreeWriting('Sam got a new kite. His friend held it. The kite flew up!', options)
    expect(story.sentences).toBe(3)
    expect(story.passed).toBe(true)
  })
})
