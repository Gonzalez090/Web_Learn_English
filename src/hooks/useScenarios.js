// =========================================================
// useScenarios — บทสนทนาสุ่มฉบับเต็ม (บทพูด/twist/ช่องสุ่ม แยกไฟล์ไว้ โหลดเมื่อเปิดเล่น) (ขั้นที่ 28-1)
// - ใช้ React use(): ระหว่างโหลด AppLayout แสดงตัวโหลด (Suspense) ให้เอง
// - โหลดครั้งเดียวต่อสถานการณ์แล้วจำไว้ / โหลดไม่สำเร็จ → ErrorBoundary แสดงข้อความเป็นมิตร
// =========================================================
import { use } from 'react'
import { loadScenario, loadScenarios } from '../data'

// สถานการณ์เดียว (ไม่มี id นี้ → null)
export function useScenario(scenarioId) {
  return use(loadScenario(scenarioId))
}

// หลายสถานการณ์ (ลำดับตาม ids, ตัดที่ไม่มีออก)
export function useScenarios(scenarioIds) {
  return use(loadScenarios(scenarioIds))
}
