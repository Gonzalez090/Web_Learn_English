// เลื่อนหน้ากลับไปบนสุดทุกครั้งที่เปลี่ยนหน้า
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
