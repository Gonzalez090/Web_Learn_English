// =========================================================
// AppLayout — โครงหลักของทุกหน้า (แบบแอปมือถือ)
//   แถบบน (TopBar) + เนื้อหาหน้า (Outlet) + แถบเมนูล่าง (BottomNav)
//   เนื้อหาหน้าครอบด้วย ErrorBoundary: หน้าไหนพัง แถบบน/ล่างยังใช้ได้ และไม่โชว์รายละเอียด error
// =========================================================
import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { stop as stopSpeech } from '../../utils/speech'
import { abortListening } from '../../utils/recognition'
import TopBar from './TopBar'
import BottomNav from './BottomNav'
import ScrollToTop from './ScrollToTop'
import ErrorBoundary from '../ErrorBoundary'
import styles from './AppLayout.module.css'

export default function AppLayout() {
  const { pathname } = useLocation()

  // เปลี่ยนหน้า → หยุดเสียงที่กำลังพูด และหยุดไมค์ที่กำลังฟัง (ไม่ให้ค้างจากหน้าเก่า)
  useEffect(() => {
    stopSpeech()
    abortListening()
  }, [pathname])

  return (
    <div className={styles.shell}>
      <ScrollToTop />
      <TopBar />
      <main className={styles.main}>
        <ErrorBoundary resetKey={pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
      <BottomNav />
    </div>
  )
}
