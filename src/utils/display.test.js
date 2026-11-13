import { describe, it, expect } from 'vitest'
import { englishTextMode, showThaiReading, meaningStartsVisible } from './display'

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
