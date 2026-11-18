// ตรวจการแบ่งคลังวลีเป็นก้อน (สารบัญ + วลีรายสถานการณ์) และของที่หน้าเว็บได้รับจริง
import { describe, it, expect } from 'vitest'
import phrasesData from './phrases.json'
import { phrasesIndexCode, phrasesOfSituation, situationMeta, situationModuleCode } from './phraseChunks'
import { getPhraseSituation, loadSituationPhrases, phraseSituations, textbookPairsOf, textbookVsReal } from './index.js'

describe('phraseChunks (ฟังก์ชันแบ่งก้อน)', () => {
  it('สถานการณ์แบบย่อ = ข้อมูลเดิม + จำนวนวลี (ไม่มีวลี)', () => {
    const situation = phrasesData.situations[0]
    const meta = situationMeta(situation, phrasesData.phrases)
    expect(meta).toEqual({ ...situation, phraseCount: phrasesOfSituation(phrasesData.phrases, situation.id).length })
    expect(meta.phraseCount).toBeGreaterThan(0)
  })

  it('ทุกวลีอยู่ในก้อนของสถานการณ์ตัวเองเพียงก้อนเดียว', () => {
    const chunks = phrasesData.situations.flatMap((situation) => phrasesOfSituation(phrasesData.phrases, situation.id))
    expect(chunks.map((phrase) => phrase.id).sort()).toEqual(phrasesData.phrases.map((phrase) => phrase.id).sort())
  })

  it('โค้ดสารบัญมีตัวโหลดทุกสถานการณ์ แต่ไม่มีวลี', () => {
    const code = phrasesIndexCode(phrasesData)
    for (const situation of phrasesData.situations) {
      expect(code).toContain(`import("virtual:phrases/situation-${situation.id}")`)
    }
    expect(code).not.toContain('"examples"')
    expect(situationModuleCode(phrasesData, phrasesData.situations[0].id)).toMatch(/^export default \[/)
  })
})

describe('data/index.js คลังวลี (ผ่านโมดูลเสมือนของ Vite)', () => {
  it('สารบัญตรงกับ phrases.json', () => {
    expect(phraseSituations).toEqual(phrasesData.situations.map((situation) => situationMeta(situation, phrasesData.phrases)))
    expect(textbookVsReal).toEqual(phrasesData.textbookVsReal)
    const first = phrasesData.situations[0]
    expect(getPhraseSituation(first.id)?.id).toBe(first.id)
    expect(textbookPairsOf(first.id).every((pair) => pair.situation === first.id)).toBe(true)
  })

  it('โหลดวลีรายสถานการณ์ได้ (promise เดิมทุกครั้ง → ใช้กับ React use() ได้)', async () => {
    const id = phrasesData.situations[0].id
    expect(loadSituationPhrases(id)).toBe(loadSituationPhrases(id))
    expect(await loadSituationPhrases(id)).toEqual(phrasesOfSituation(phrasesData.phrases, id))
    expect(await loadSituationPhrases('ไม่มีสถานการณ์นี้')).toEqual([])
  })
})
