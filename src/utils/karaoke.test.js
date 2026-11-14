import { describe, it, expect } from 'vitest'
import {
  activeWordAt,
  karaokeTimings,
  karaokeWords,
  KARAOKE,
  maxListenMsFor,
  singDurationMs,
  syllableCount,
} from './karaoke'
import { compareSpeech } from './compareWords'

describe('syllableCount', () => {
  it('ประมาณจำนวนพยางค์จากกลุ่มสระ', () => {
    expect(syllableCount('cat')).toBe(1)
    expect(syllableCount('juice.')).toBe(1) // e ท้ายคำไม่ออกเสียง
    expect(syllableCount('Daddy\'s')).toBe(2)
    expect(syllableCount('banana')).toBe(3)
    expect(syllableCount('')).toBe(1)
    expect(syllableCount('the')).toBe(1)
  })
})

describe('karaokeWords', () => {
  it('คำตรงกับคำที่ตัวให้คะแนนใช้ (ระบายสีผลรายคำได้ตรงตำแหน่ง)', () => {
    const text = "No, I don't like it."
    expect(karaokeWords(text)).toEqual(['No,', 'I', "don't", 'like', 'it.'])
    expect(compareSpeech(text, ['no i do not like it']).words.map((word) => word.text)).toEqual(karaokeWords(text))
  })
})

describe('karaokeTimings', () => {
  it('เวลาเรียงต่อกัน เริ่มหลังช่วงเงียบสั้น ๆ และจบพอดีเวลาทั้งหมด', () => {
    const timings = karaokeTimings('I want juice.', 1500)
    expect(timings.map((timing) => timing.text)).toEqual(['I', 'want', 'juice.'])
    expect(timings[0].start).toBe(Math.round(1500 * KARAOKE.leadInRatio))
    expect(timings.at(-1).end).toBe(1500)
    for (let i = 1; i < timings.length; i += 1) expect(timings[i].start).toBe(timings[i - 1].end)
  })

  it('คำหลายพยางค์ใช้เวลานานกว่า และหยุดหลังเครื่องหมายกลางประโยค', () => {
    const [no, i] = karaokeTimings('No, I want it.', 2000)
    const [banana, cat] = karaokeTimings('banana cat', 2000)
    expect(no.end - no.start).toBeGreaterThan(i.end - i.start)
    expect(banana.end - banana.start).toBeGreaterThan(cat.end - cat.start)
  })

  it('ไม่มีคำ / ไม่มีเวลา → ว่าง', () => {
    expect(karaokeTimings('', 1000)).toEqual([])
    expect(karaokeTimings('hi', 0)).toEqual([])
  })
})

describe('activeWordAt', () => {
  const timings = karaokeTimings('I want juice.', 1500)
  it('บอกคำที่แถบวิ่งถึง', () => {
    expect(activeWordAt(timings, 0)).toBe(-1)
    expect(activeWordAt(timings, timings[1].start + 1)).toBe(1)
    expect(activeWordAt(timings, 1500)).toBe(3)
    expect(activeWordAt([], 100)).toBe(-1)
  })
})

describe('เวลาของรอบผู้เรียน', () => {
  it('ช้ากว่าเสียงต้นแบบ และอย่างน้อย 2 วินาที', () => {
    expect(singDurationMs(1200)).toBe(2300)
    expect(singDurationMs(400)).toBe(2000)
    expect(singDurationMs(undefined)).toBe(2000)
  })

  it('ไมค์ฟังนานพอให้จบรอบ', () => {
    const sing = singDurationMs(1500)
    expect(maxListenMsFor(sing)).toBeGreaterThan(KARAOKE.countdown * KARAOKE.beatMs + sing + KARAOKE.graceMs)
  })
})
