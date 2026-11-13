// ทดสอบฟังก์ชันล้วนของ speech.js (ส่วนที่คุยกับเบราว์เซอร์ทดสอบใน Chrome จริง)
import { describe, it, expect } from 'vitest'
import {
  splitIntoChunks,
  scoreVoice,
  englishVoices,
  pickVoice,
  pickLocalVoice,
  shouldFallbackToLocal,
  estimateDurationMs,
  audioFileFor,
  planSegments,
} from './speech'

describe('ไฟล์เสียงที่สร้างไว้ (Kokoro)', () => {
  const manifest = {
    normal: { 'Big dog!': '/audio/a.mp3', 'Look! A dog.': '/audio/b.mp3' },
    slow: { 'Big dog!': '/audio/a-slow.mp3' },
  }

  it('หาไฟล์ตามความเร็ว และตัดช่องว่างหัวท้าย', () => {
    expect(audioFileFor('Big dog!', 'normal', manifest)).toBe('/audio/a.mp3')
    expect(audioFileFor(' Big dog! ', 'slow', manifest)).toBe('/audio/a-slow.mp3')
  })

  it('ไม่มีไฟล์ / ความเร็วเป็นตัวเลข → null (ให้เบราว์เซอร์อ่านแทน)', () => {
    expect(audioFileFor('Look! A dog.', 'slow', manifest)).toBeNull()
    expect(audioFileFor('Big dog!', 0.8, manifest)).toBeNull()
  })

  it('บรรทัดที่มีไฟล์ทั้งบรรทัด เล่นทีเดียว ไม่แยกประโยค', () => {
    expect(planSegments('Look! A dog.', 'normal', { manifest })).toEqual([{ text: 'Look! A dog.', file: '/audio/b.mp3' }])
  })

  it('บรรทัดที่ไม่มีไฟล์ แยกทีละประโยคให้เบราว์เซอร์อ่าน', () => {
    expect(planSegments('Look! A dog.', 'slow', { manifest })).toEqual([
      { text: 'Look!', file: null },
      { text: 'A dog.', file: null },
    ])
  })

  it('ปิดการใช้ไฟล์ (ปุ่มลองเสียงในตั้งค่า) → ใช้เสียงเบราว์เซอร์ทั้งหมด', () => {
    expect(planSegments(['Big dog!'], 'normal', { manifest, useFiles: false })).toEqual([
      { text: 'Big dog!', file: null },
    ])
  })
})

const voice = (name, lang, voiceURI = name, localService = false) => ({ name, lang, voiceURI, localService })

describe('เสียงสำรองตอนเสียงออนไลน์ใช้ไม่ได้', () => {
  const voices = [
    voice('Google US English', 'en-US'),
    voice('Microsoft Zira - English (United States)', 'en-US', 'zira', true),
    voice('Microsoft David - English (United States)', 'en-US', 'david', true),
    voice('Google UK English Female', 'en-GB'),
  ]

  it('ปกติเลือกเสียงออนไลน์คุณภาพสูงก่อน', () => {
    expect(pickVoice(voices, null).name).toBe('Google US English')
  })

  it('ออฟไลน์ (preferLocal) → เลือกเสียงในเครื่อง', () => {
    expect(pickVoice(voices, null, { preferLocal: true }).localService).toBe(true)
  })

  it('ออฟไลน์ + ผู้ใช้เลือกเสียงออนไลน์ไว้ → ใช้เสียงในเครื่องแทน (ไม่งั้นจะเงียบ)', () => {
    expect(pickVoice(voices, 'Google UK English Female', { preferLocal: true }).localService).toBe(true)
  })

  it('ออฟไลน์ + ผู้ใช้เลือกเสียงในเครื่องไว้ → ใช้เสียงที่เลือก', () => {
    expect(pickVoice(voices, 'david', { preferLocal: true }).voiceURI).toBe('david')
  })

  it('pickLocalVoice เลือกเสียงในเครื่องอันแรก / ไม่มีเลยได้ null', () => {
    expect(pickLocalVoice(voices).localService).toBe(true)
    expect(pickLocalVoice([voice('Google US English', 'en-US')])).toBeNull()
  })

  it('ลองเสียงสำรองเฉพาะ error ที่แปลว่าเสียงใช้ไม่ได้ ไม่ใช่ตอนถูกสั่งหยุด', () => {
    expect(shouldFallbackToLocal('network')).toBe(true)
    expect(shouldFallbackToLocal('synthesis-failed')).toBe(true)
    expect(shouldFallbackToLocal('interrupted')).toBe(false)
    expect(shouldFallbackToLocal('canceled')).toBe(false)
    expect(shouldFallbackToLocal(undefined)).toBe(false)
  })
})

describe('splitIntoChunks', () => {
  it('แยกทีละประโยค', () => {
    expect(splitIntoChunks('Look! A dog. The dog is big. Big dog!')).toEqual([
      'Look!',
      'A dog.',
      'The dog is big.',
      'Big dog!',
    ])
  })

  it('รับ array หลายบรรทัด และตัดช่องว่าง/บรรทัดว่างทิ้ง', () => {
    expect(splitIntoChunks(['  Hi, Mommy! ', '', 'Mommy loves you.'])).toEqual(['Hi, Mommy!', 'Mommy loves you.'])
  })

  it('คำเดี่ยวได้ 1 ท่อน และค่าว่างได้ array ว่าง', () => {
    expect(splitIntoChunks('dog')).toEqual(['dog'])
    expect(splitIntoChunks('')).toEqual([])
    expect(splitIntoChunks(null)).toEqual([])
  })

  it("ไม่ตัดกลางรูปย่อ เช่น What's / don't", () => {
    expect(splitIntoChunks("No, I don't like it. What's that?")).toEqual(["No, I don't like it.", "What's that?"])
  })
})

describe('scoreVoice / englishVoices / pickVoice', () => {
  const voices = [
    voice('Microsoft David - English (United States)', 'en-US'),
    voice('Google UK English Female', 'en-GB'),
    voice('Microsoft Aria Online (Natural) - English (United States)', 'en-US'),
    voice('Microsoft Pattara - Thai (Thailand)', 'th-TH'),
    voice('Google US English', 'en-US'),
  ]

  it('เสียงไม่ใช่ภาษาอังกฤษได้ -1', () => {
    expect(scoreVoice(voice('Pattara', 'th-TH'))).toBe(-1)
    expect(scoreVoice({})).toBe(-1)
  })

  it('en-US ได้มากกว่า en-GB และเสียง Natural ได้มากที่สุด', () => {
    expect(scoreVoice(voices[0])).toBeGreaterThan(scoreVoice(voices[1]))
    expect(scoreVoice(voices[2])).toBeGreaterThan(scoreVoice(voices[4]))
  })

  it('รองรับ lang แบบ en_US (Android บางรุ่น)', () => {
    expect(scoreVoice(voice('x', 'en_US'))).toBe(100)
  })

  it('englishVoices ตัดเสียงไทยออก และเรียงจากดีที่สุด', () => {
    const names = englishVoices(voices).map((v) => v.name)
    expect(names).toHaveLength(4)
    expect(names[0]).toMatch(/Natural/)
    expect(names.at(-1)).toMatch(/UK/)
  })

  it('pickVoice ใช้เสียงที่ผู้ใช้เลือกถ้ายังมีในเครื่อง ไม่งั้นใช้อันที่ดีที่สุด', () => {
    expect(pickVoice(voices, 'Google UK English Female').name).toBe('Google UK English Female')
    expect(pickVoice(voices, 'ไม่มีเสียงนี้').name).toMatch(/Natural/)
    expect(pickVoice(voices, null).name).toMatch(/Natural/)
  })

  it('pickVoice ไม่ยอมใช้เสียงที่ไม่ใช่ภาษาอังกฤษ แม้ผู้ใช้เลือกไว้', () => {
    expect(pickVoice(voices, 'Microsoft Pattara - Thai (Thailand)').name).toMatch(/Natural/)
  })

  it('ไม่มีเสียงภาษาอังกฤษเลย → null', () => {
    expect(pickVoice([voice('Thai', 'th-TH')], null)).toBeNull()
    expect(pickVoice([], null)).toBeNull()
  })
})

describe('estimateDurationMs', () => {
  it('พูดช้าใช้เวลานานกว่า', () => {
    const text = 'The dog is big.'
    expect(estimateDurationMs(text, 0.65)).toBeGreaterThan(estimateDurationMs(text, 0.95))
  })

  it('ข้อความว่างยังได้เวลาขั้นต่ำ', () => {
    expect(estimateDurationMs('', 1)).toBeGreaterThan(0)
  })
})
