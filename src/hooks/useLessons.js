// =========================================================
// useLessons — อ่านบทเรียน "แบบเต็ม" (มี items) ที่แยกไฟล์ไว้ โหลดเมื่อต้องใช้
// - ใช้ React use(): ระหว่างโหลด component จะ "รอ" → AppLayout แสดงตัวโหลด (Suspense) ให้เอง
// - โหลดครั้งเดียวต่อ Stage แล้วจำไว้ (เปิดบทอื่นใน Stage เดียวกันได้ทันที)
// - โหลดไม่สำเร็จ (เช่น เน็ตหลุด) → ErrorBoundary แสดงข้อความเป็นมิตร; เปลี่ยนหน้าแล้วกลับมาลองใหม่ได้
// =========================================================
import { use } from 'react'
import { getLessonMeta, loadLessonsOfStages, loadStageLessons } from '../data'

// บทเรียนเต็มจาก id (ไม่มีบทนี้ → null)
export function useLesson(lessonId) {
  const meta = getLessonMeta(lessonId)
  if (!meta) return null
  return use(loadStageLessons(meta.stageId)).find((lesson) => lesson.id === lessonId) ?? null
}

// บทเรียนเต็มของหลาย Stage รวมกัน (ส่ง stageIds ชุดเดิมทุก render — เปลี่ยนชุดแล้วจะโหลด/รอใหม่)
export function useLessonsOfStages(stageIds) {
  return use(loadLessonsOfStages(stageIds))
}
