// =========================================================
// useReturnFocus — กล่องยืนยันปิดแล้ว คืนโฟกัสไปที่ปุ่มที่เปิดกล่อง (คีย์บอร์ด/โปรแกรมอ่านหน้าจอ)
//   คืนเฉพาะเมื่อโฟกัสหลุดไปที่ body (กล่องที่โฟกัสอยู่ถูกถอดออก) — ผู้ใช้โฟกัสที่อื่นอยู่ไม่แย่ง
//   ใช้: const ref = useReturnFocus(open);  <Button ref={ref} … />
// =========================================================
import { useEffect, useRef } from 'react'

export function useReturnFocus(open) {
  const buttonRef = useRef(null)
  const wasOpen = useRef(open)

  useEffect(() => {
    if (wasOpen.current && !open && document.activeElement === document.body) buttonRef.current?.focus()
    wasOpen.current = open
  }, [open])

  return buttonRef
}
