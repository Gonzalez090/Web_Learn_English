// =========================================================
// phraseChunks.js — แบ่งคลังวลี (phrases.json ~1,000 วลี) เป็นก้อนรายสถานการณ์ ให้หน้าเว็บโหลดเฉพาะที่เปิดดู
// ใช้โดย plugin "phrase-chunks" ใน vite.config.js → สร้างโมดูลเสมือน (ไม่มีไฟล์จริง):
//   virtual:phrases                      สารบัญ: สถานการณ์ (+ หมวดย่อย + จำนวนวลี) + คู่ "ในตำรา vs ใช้จริง" + ตัวโหลดรายสถานการณ์
//   virtual:phrases/situation-<id>       วลีเต็มของสถานการณ์นั้น (ไฟล์ JS แยก โหลดตอนเปิดหน้าสถานการณ์)
// เขียนเนื้อหาที่ phrases.json ไฟล์เดียวเหมือนเดิม — ไม่ต้องแบ่งไฟล์เอง
// (ฟังก์ชันล้วน ใส่ .js ใน import เพราะ vite.config.js โหลดไฟล์นี้ด้วย Node)
// =========================================================

export const PHRASES_INDEX_ID = 'virtual:phrases'
export const SITUATION_MODULE_PREFIX = 'virtual:phrases/situation-'

export const phrasesOfSituation = (phrases, situationId) => phrases.filter((phrase) => phrase.situation === situationId)

// สถานการณ์แบบย่อ: ข้อมูลเดิม + จำนวนวลี (แสดงในรายการ โดยไม่ต้องโหลดวลี)
export const situationMeta = (situation, phrases) => ({
  ...situation,
  phraseCount: phrasesOfSituation(phrases, situation.id).length,
})

// โค้ดของโมดูลสารบัญ (ตัวโหลดเป็น import() → Vite แยกเป็นไฟล์ JS ต่อสถานการณ์)
export function phrasesIndexCode(data) {
  const loaders = data.situations
    .map((situation) => `  ${JSON.stringify(situation.id)}: () => import(${JSON.stringify(`${SITUATION_MODULE_PREFIX}${situation.id}`)}),`)
    .join('\n')
  return [
    `export const situations = ${JSON.stringify(data.situations.map((situation) => situationMeta(situation, data.phrases)))}`,
    `export const textbookVsReal = ${JSON.stringify(data.textbookVsReal)}`,
    `export const situationLoaders = {\n${loaders}\n}`,
    '',
  ].join('\n')
}

// โค้ดของโมดูลวลีรายสถานการณ์
export const situationModuleCode = (data, situationId) =>
  `export default ${JSON.stringify(phrasesOfSituation(data.phrases, situationId))}\n`
