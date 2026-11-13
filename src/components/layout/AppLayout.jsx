// =========================================================
// AppLayout — โครงหลักของทุกหน้า (แบบแอปมือถือ)
//   แถบบน (TopBar) + เนื้อหาหน้า (Outlet) + แถบเมนูล่าง (BottomNav)
//   เนื้อหาหน้าครอบด้วย ErrorBoundary: หน้าไหนพัง แถบบน/ล่างยังใช้ได้ และไม่โชว์รายละเอียด error
// =========================================================
import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { stop as stopSpeech } from '../../utils/speech'
import TopBar from './TopBar'
import BottomNav from './BottomNav'
import ScrollToTop from './ScrollToTop'
import ErrorBoundary from '../ErrorBoundary'
import styles from './AppLayout.module.css'

export default function AppLayout() {
  const { pathname } = useLocation()

  // เปลี่ยนหน้า → หยุดเสียงที่กำลังพูดอยู่ (ไม่ให้เสียงจากหน้าเก่าพูดค้าง)
  useEffect(() => {
    stopSpeech()
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
