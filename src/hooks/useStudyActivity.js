// =========================================================
// useStudyActivity — บอกตัวนับเวลาเรียนว่า "กำลังเรียนจริง" ระหว่างที่ component นี้ทำงาน
//   ใช้ในตัวเล่นบทเรียน/ทบทวน (PlayerFrame), บทสนทนาสุ่ม, มินิเกม, Speaking Check ตอนอัด
// active = false → ยังไม่นับ (เช่น เกมที่มีหน้าเริ่มของตัวเอง)
// =========================================================
import { useEffect } from 'react'
import { beginActivity } from '../utils/studyActivity'

export function useStudyActivity(active = true) {
  useEffect(() => (active ? beginActivity() : undefined), [active])
}
