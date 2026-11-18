// =========================================================
// usePhrases — วลีเต็มของสถานการณ์หนึ่งในคลังวลี (แยกไฟล์ไว้ โหลดเมื่อเปิดหน้าสถานการณ์)
// - ใช้ React use(): ระหว่างโหลด AppLayout แสดงตัวโหลด (Suspense) ให้เอง
// - โหลดครั้งเดียวต่อสถานการณ์แล้วจำไว้ / โหลดไม่สำเร็จ → ErrorBoundary แสดงข้อความเป็นมิตร
// =========================================================
import { use } from 'react'
import { loadSituationPhrases } from '../data'

export function useSituationPhrases(situationId) {
  return use(loadSituationPhrases(situationId))
}
