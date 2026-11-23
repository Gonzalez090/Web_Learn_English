// =========================================================
// useStepReveal — ขั้นพูด/อ่านบนจอเตี้ย: ปุ่มพูดและปุ่มไปต่อต้องไม่อยู่ใต้แถบเมนูล่าง
//   const { micRef, actionsRef, showActions } = useStepReveal(item.id)
//   - เข้าขั้น (เปลี่ยนข้อ) → เลื่อนให้เห็นกล่องปุ่มพูด (micRef — คลาส Step.module.css .micBox)
//   - ได้ผลพูดแล้วเรียก showActions() → เลื่อนให้เห็นผล + ปุ่มไปต่อ (actionsRef — คลาส .actions)
//   เห็นอยู่แล้วไม่ขยับ (scrollIntoViewGently block: 'nearest' + scroll-margin เผื่อเมนูล่าง)
// =========================================================
import { useCallback, useEffect, useRef } from 'react'
import { scrollIntoViewGently } from '../utils/scroll'

const ENTER_DELAY_MS = 250 // รอแอนิเมชันเข้าขั้น + เปลี่ยนหน้าเลื่อนขึ้นบนก่อน
const RESULT_DELAY_MS = 60 // รอวาดกล่องผล

export function useStepReveal(itemId) {
  const micRef = useRef(null)
  const actionsRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => scrollIntoViewGently(micRef.current), ENTER_DELAY_MS)
    return () => clearTimeout(timer)
  }, [itemId])

  const showActions = useCallback(() => {
    setTimeout(() => scrollIntoViewGently(actionsRef.current), RESULT_DELAY_MS)
  }, [])

  return { micRef, actionsRef, showActions }
}
