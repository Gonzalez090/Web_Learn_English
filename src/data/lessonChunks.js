// =========================================================
// lessonChunks.js — แบ่งข้อมูลบทเรียน (lessons.json) เป็นก้อนเล็ก ให้หน้าเว็บโหลดเฉพาะที่ต้องใช้
// ใช้โดย plugin "lesson-chunks" ใน vite.config.js → สร้างโมดูลเสมือน (ไม่มีไฟล์จริง):
//   virtual:lessons          สารบัญ: stages + รายการบทแบบย่อ (ไม่มี items) + ตัวโหลดเนื้อหาราย Stage
//   virtual:lessons/stage-N  เนื้อหาเต็มของบทใน Stage N (แยกเป็นไฟล์ JS ของตัวเอง โหลดเมื่อเข้าบทของ Stage นั้น)
// เขียนเนื้อหาที่ lessons.json ไฟล์เดียวเหมือนเดิม — ไม่ต้องแบ่งไฟล์เอง
// (ฟังก์ชันล้วน ใส่ .js ใน import เพราะ vite.config.js โหลดไฟล์นี้ด้วย Node)
// =========================================================

export const INDEX_MODULE_ID = 'virtual:lessons'
export const STAGE_MODULE_PREFIX = 'virtual:lessons/stage-'

// บทเรียนแบบย่อ: พอสำหรับแสดงรายการบท + คิดสถานะปลดล็อก (ไม่ต้องโหลด items)
export const lessonMeta = (lesson) => ({
  id: lesson.id,
  stageId: lesson.stageId,
  category: lesson.category,
  type: lesson.type,
  title: lesson.title,
  titleTh: lesson.titleTh,
  itemCount: lesson.items.length,
  image: lesson.items[0]?.image ?? null, // ภาพหน้าปกของบท
})

// Stage ที่มีบทเรียนแล้ว (เรียงน้อยไปมาก)
export const stageIdsWithLessons = (lessons) =>
  [...new Set(lessons.map((lesson) => lesson.stageId))].sort((a, b) => a - b)

export const lessonsOfStage = (lessons, stageId) => lessons.filter((lesson) => lesson.stageId === stageId)

// โค้ดของโมดูลสารบัญ (ตัวโหลดเนื้อหาเป็น import() → Vite แยกเป็นไฟล์ JS ต่อ Stage)
export function indexModuleCode(data) {
  const loaders = stageIdsWithLessons(data.lessons)
    .map((stageId) => `  ${stageId}: () => import(${JSON.stringify(`${STAGE_MODULE_PREFIX}${stageId}`)}),`)
    .join('\n')
  return [
    `export const stages = ${JSON.stringify(data.stages)}`,
    `export const lessonList = ${JSON.stringify(data.lessons.map(lessonMeta))}`,
    `export const stageLoaders = {\n${loaders}\n}`,
    '',
  ].join('\n')
}

// โค้ดของโมดูลเนื้อหาราย Stage
export const stageModuleCode = (data, stageId) =>
  `export default ${JSON.stringify(lessonsOfStage(data.lessons, stageId))}\n`
