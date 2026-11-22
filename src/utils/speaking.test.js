import { describe, it, expect } from 'vitest'
import { addSpeaking, ESTIMATE_MS_PER_WORD, KEEP_DAYS, lastDays, MAX_SPEECH_MS, speechDurationMs } from './speaking'
import { addDays } from './date'

describe('speechDurationMs', () => {
  it('มีเวลาเริ่ม/หยุดพูดจากระบบ → ใช้ช่วงนั้น (ไม่มีเวลาหยุด → ถึงตอนจบ)', () => {
    expect(speechDurationMs({ speechStart: 1000, speechEnd: 3500, transcript: 'hi' })).toBe(2500)
    expect(speechDurationMs({ speechStart: 1000, now: 2200 })).toBe(1200)
  })

  it('ไม่มีเวลาจากระบบ → ประมาณจากจำนวนคำ / ไม่มีคำ → 0 / เกินเพดาน → ตัด', () => {
    expect(speechDurationMs({ transcript: 'can I get a latte' })).toBe(5 * ESTIMATE_MS_PER_WORD)
    expect(speechDurationMs({ transcript: '  ' })).toBe(0)
    expect(speechDurationMs({ speechStart: 0, speechEnd: 999_999 })).toBe(MAX_SPEECH_MS)
  })
})

describe('addSpeaking / lastDays', () => {
  const today = '2026-11-22'

  it('บวกเวลาพูดของวันนี้ + บอกจำนวน "นาทีเต็ม" ที่เพิ่งครบ', () => {
    let result = addSpeaking({}, today, 45_000)
    expect(result.minutes[today]).toBe(0.75)
    expect(result.wholeMinutes).toBe(0)
    result = addSpeaking(result.minutes, today, 90_000)
    expect(result.minutes[today]).toBe(2.25)
    expect(result.wholeMinutes).toBe(2)
    expect(addSpeaking(result.minutes, today, 0).minutes).toBe(result.minutes)
  })

  it(`เก็บย้อนหลังไม่เกิน ${KEEP_DAYS} วัน`, () => {
    const old = { [addDays(today, -KEEP_DAYS)]: 3, [addDays(today, -1)]: 2 }
    const { minutes } = addSpeaking(old, today, 60_000)
    expect(Object.keys(minutes).sort()).toEqual([addDays(today, -1), today])
  })

  it('ย้อนหลัง 7 วัน เรียงเก่า → ใหม่ วันที่ไม่ได้พูด = 0', () => {
    const days = lastDays({ [today]: 1.5, [addDays(today, -6)]: 2 }, today)
    expect(days).toHaveLength(7)
    expect(days[0]).toEqual({ date: addDays(today, -6), minutes: 2 })
    expect(days[6]).toEqual({ date: today, minutes: 1.5 })
    expect(days[3].minutes).toBe(0)
  })
})
