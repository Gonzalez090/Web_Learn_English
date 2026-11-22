// ตรวจการแบ่งบทสนทนาสุ่มเป็นก้อน (สารบัญ + บทพูดรายสถานการณ์) และของที่หน้าเว็บได้รับจริง (ขั้นที่ 28-1)
import { describe, it, expect } from 'vitest'
import scenariosData from './scenarios.json'
import { scenarioMeta, scenarioModuleCode, scenariosIndexCode } from './scenarioChunks'
import { getScenarioMeta, loadScenario, loadScenarios, scenarioList } from './index.js'

describe('scenarioChunks (ฟังก์ชันแบ่งก้อน)', () => {
  it('สถานการณ์แบบย่อไม่มีบทพูด/twist/ช่องสุ่ม แต่มีจำนวนบรรทัด', () => {
    const scenario = scenariosData.scenarios[0]
    const meta = scenarioMeta(scenario)
    expect(meta.turns).toBeUndefined()
    expect(meta.twists).toBeUndefined()
    expect(meta.slots).toBeUndefined()
    expect(meta).toMatchObject({ id: scenario.id, name: scenario.name, image: scenario.image, turnCount: scenario.turns.length })
  })

  it('สารบัญมีตัวโหลดทุกสถานการณ์ และไม่มีบทพูด', () => {
    const code = scenariosIndexCode(scenariosData)
    for (const scenario of scenariosData.scenarios) {
      expect(code).toContain(`import("virtual:scenarios/scenario-${scenario.id}")`)
    }
    expect(code).not.toContain('"turns"')
    expect(scenarioModuleCode(scenariosData, scenariosData.scenarios[0].id)).toMatch(/^export default \{/)
    expect(scenarioModuleCode(scenariosData, 'nope')).toBe('export default null\n')
  })
})

describe('data/index.js (ผ่านโมดูลเสมือนของ Vite)', () => {
  it('สารบัญตรงกับ scenarios.json', () => {
    expect(scenarioList).toEqual(scenariosData.scenarios.map(scenarioMeta))
    expect(getScenarioMeta('cafe')?.id).toBe('cafe')
    expect(getScenarioMeta('nope')).toBeNull()
  })

  it('โหลดบทพูดเต็มได้ตรงกับไฟล์ / ไม่มี id → null / โหลดซ้ำได้ promise เดิม', async () => {
    const id = scenariosData.scenarios[0].id
    expect(loadScenario(id)).toBe(loadScenario(id))
    expect(await loadScenario(id)).toEqual(scenariosData.scenarios[0])
    expect(await loadScenario('nope')).toBeNull()
  })

  it('โหลดหลายสถานการณ์: ตัด id ที่ไม่มี/ซ้ำ', async () => {
    const ids = scenariosData.scenarios.slice(0, 2).map((scenario) => scenario.id)
    const list = await loadScenarios([...ids, ids[0], 'nope'])
    expect(list.map((scenario) => scenario.id).sort()).toEqual([...ids].sort())
  })
})
