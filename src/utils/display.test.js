import { describe, it, expect } from 'vitest'
import { englishTextMode, showThaiReading, meaningStartsVisible, markStress } from './display'

describe('markStress', () => {
  it('บอกคำที่ลงเสียงหนัก ไม่สนตัวพิมพ์และเครื่องหมาย', () => {
    expect(markStress("No, I don't like it.", ['no', "Don't", 'like'])).toEqual([
      { text: 'No,', stressed: true },
      { text: 'I', stressed: false },
      { text: "don't", stressed: true },
      { text: 'like', stressed: true },
      { text: 'it.', stressed: false },
    ])
  })

  it('ไม่มีคำที่ลงเสียงหนัก → ทุกคำไม่เน้น', () => {
    expect(markStress('Daddy’s home!', undefined).every((word) => !word.stressed)).toBe(true)
    expect(markStress("Daddy's home!", ['Daddy’s']).map((word) => word.stressed)).toEqual([true, false])
  })
})

const stage = (id, showText) => ({ id, showText })

describe('englishTextMode', () => {
  it('แปลง showText ของ Stage เป็นโหมดการแสดงคำ', () => {
    expect(englishTextMode('never')).toBe('hidden')
    expect(englishTextMode('toggle')).toBe('toggle')
    expect(englishTextMode('always')).toBe('shown')
  })
})

describe('showThaiReading', () => {
  it('Stage 1–3 ไม่แสดงคำอ่านไทยเลย แม้ผู้ใช้ตั้งเป็น "แสดง"', () => {
    expect(showThaiReading('on', stage(2, 'never'))).toBe(false)
  })

  it('อัตโนมัติ: ซ่อนใน Stage 4–5, แสดงใน Stage 6–7', () => {
    expect(showThaiReading('auto', stage(4, 'toggle'))).toBe(false)
    expect(showThaiReading('auto', stage(5, 'always'))).toBe(false)
    expect(showThaiReading('auto', stage(6, 'always'))).toBe(true)
    expect(showThaiReading('auto', stage(7, 'always'))).toBe(true)
  })

  it('ผู้ใช้เลือกเอง: แสดง/ซ่อน ตามที่ตั้ง', () => {
    expect(showThaiReading('on', stage(4, 'toggle'))).toBe(true)
    expect(showThaiReading('off', stage(7, 'always'))).toBe(false)
  })
})

describe('meaningStartsVisible', () => {
  it('ค่าเริ่มต้นซ่อนไว้ กดดูได้', () => {
    expect(meaningStartsVisible('hidden')).toBe(false)
    expect(meaningStartsVisible('shown')).toBe(true)
  })
})
