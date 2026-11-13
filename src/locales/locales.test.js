// ตรวจไฟล์ภาษา: th.json กับ en.json ต้องมี key ตรงกัน ไม่มีข้อความว่าง และตัวแปร {{x}} ตรงกัน
// (กันลืมแปลเมื่อเพิ่มข้อความ UI ใหม่)
import { describe, it, expect } from 'vitest'
import th from './th.json'
import en from './en.json'
import devTh from './dev.th.json'
import devEn from './dev.en.json'

// แปลง object ซ้อนกันให้เป็น { 'home.title': '...' }
function flatten(obj, prefix = '') {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const path = `${prefix}${key}`
    if (value && typeof value === 'object') return { ...acc, ...flatten(value, `${path}.`) }
    return { ...acc, [path]: value }
  }, {})
}

// ดึงชื่อตัวแปรใน {{...}} ออกมา เช่น "ทบทวน ({{count}})" → ['count']
const variablesOf = (text) => [...text.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]).sort()

const thFlat = flatten(th)
const enFlat = flatten(en)

describe('locales', () => {
  it('th.json และ en.json มี key ชุดเดียวกัน', () => {
    expect(Object.keys(enFlat).sort()).toEqual(Object.keys(thFlat).sort())
  })

  it('ไม่มีข้อความว่าง', () => {
    for (const [key, value] of Object.entries({ ...thFlat, ...enFlat })) {
      expect(typeof value, key).toBe('string')
      expect(value.trim().length, key).toBeGreaterThan(0)
    }
  })

  it('ตัวแปร {{x}} ตรงกันทั้งสองภาษา', () => {
    for (const key of Object.keys(thFlat)) {
      expect(variablesOf(enFlat[key] ?? ''), key).toEqual(variablesOf(thFlat[key]))
    }
  })
})

// ข้อความของหน้า /dev อยู่แยกไฟล์ (โหลดเฉพาะตอน npm run dev → ไม่ติดไปในเว็บจริง)
describe('dev locales', () => {
  const devThFlat = flatten(devTh)
  const devEnFlat = flatten(devEn)

  it('dev.th.json และ dev.en.json มี key ชุดเดียวกัน', () => {
    expect(Object.keys(devEnFlat).sort()).toEqual(Object.keys(devThFlat).sort())
  })

  it('ข้อความ dev ไม่ปนอยู่ในไฟล์ภาษาหลัก', () => {
    for (const key of Object.keys(devThFlat)) {
      expect(thFlat[key], key).toBeUndefined()
      expect(enFlat[key], key).toBeUndefined()
    }
  })
})
