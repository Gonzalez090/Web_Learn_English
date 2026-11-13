// =========================================================
// AppLayout — โครงหลักของทุกหน้า (แบบแอปมือถือ)
//   แถบบน (TopBar) + เนื้อหาหน้า (Outlet) + แถบเมนูล่าง (BottomNav)
// =========================================================
import { Outlet } from 'react-router-dom'
import TopBar from './TopBar'
import BottomNav from './BottomNav'
import ScrollToTop from './ScrollToTop'
import styles from './AppLayout.module.css'

export default function AppLayout() {
  return (
    <div className={styles.shell}>
      <ScrollToTop />
      <TopBar />
      <main className={styles.main}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
