// =========================================================
// scenarioChunks.js — แบ่งบทสนทนาสุ่ม (scenarios.json) เป็นก้อนรายสถานการณ์ ให้หน้าเว็บโหลดเฉพาะที่เปิดเล่น (ขั้นที่ 28-1)
// ใช้โดย plugin "scenario-chunks" ใน vite.config.js → สร้างโมดูลเสมือน (ไม่มีไฟล์จริง):
//   virtual:scenarios                    สารบัญ: สถานการณ์แบบย่อ (ไม่มี turns/twists/slots) + ตัวโหลดรายสถานการณ์
//   virtual:scenarios/scenario-<id>      สถานการณ์เต็ม (ไฟล์ JS แยก โหลดตอนเปิดหน้าบทสนทนา / ทบทวนบรรทัดของบทนั้น)
// เขียนเนื้อหาที่ scenarios.json ไฟล์เดียวเหมือนเดิม — ไม่ต้องแบ่งไฟล์เอง
// (ฟังก์ชันล้วน ใส่ .js ใน import เพราะ vite.config.js โหลดไฟล์นี้ด้วย Node)
// =========================================================

export const SCENARIOS_INDEX_ID = 'virtual:scenarios'
export const SCENARIO_MODULE_PREFIX = 'virtual:scenarios/scenario-'

// ส่วนที่ใหญ่และใช้แค่ตอนเล่น → อยู่ในก้อนย่อยเท่านั้น
const HEAVY_FIELDS = new Set(['turns', 'twists', 'slots'])

// สถานการณ์แบบย่อ: ทุกอย่างยกเว้นบทพูด (แสดงรายการ/ปุ่มสุ่ม/สถานะล็อกได้โดยไม่ต้องโหลดบท) + จำนวนบรรทัด
export const scenarioMeta = (scenario) => ({
  ...Object.fromEntries(Object.entries(scenario).filter(([key]) => !HEAVY_FIELDS.has(key))),
  turnCount: scenario.turns.length,
})

// โค้ดของโมดูลสารบัญ (ตัวโหลดเป็น import() → Vite แยกเป็นไฟล์ JS ต่อสถานการณ์)
export function scenariosIndexCode(data) {
  const loaders = data.scenarios
    .map((scenario) => `  ${JSON.stringify(scenario.id)}: () => import(${JSON.stringify(`${SCENARIO_MODULE_PREFIX}${scenario.id}`)}),`)
    .join('\n')
  return [
    `export const scenarioList = ${JSON.stringify(data.scenarios.map(scenarioMeta))}`,
    `export const scenarioLoaders = {\n${loaders}\n}`,
    '',
  ].join('\n')
}

// โค้ดของโมดูลสถานการณ์เต็ม
export const scenarioModuleCode = (data, scenarioId) =>
  `export default ${JSON.stringify(data.scenarios.find((scenario) => scenario.id === scenarioId) ?? null)}\n`
