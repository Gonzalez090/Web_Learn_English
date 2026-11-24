// =========================================================
// AppLayout — โครงหลักของทุกหน้า (แบบแอปมือถือ)
//   แถบบน (TopBar) + เนื้อหาหน้า (Outlet) + เมนู: มือถือแถบล่าง (BottomNav) / จอกว้างแถบซ้าย (SideNav) + ข้อความแจ้งเตือน (Toaster)
//   เนื้อหาหน้าครอบด้วย ErrorBoundary: หน้าไหนพัง แถบบน/ล่างยังใช้ได้ และไม่โชว์รายละเอียด error
//   + Suspense: หน้าที่ "รอ" ข้อมูลแยกไฟล์ (hooks/useLessons.js) แสดงตัวโหลด แถบบน/ล่างยังอยู่
// =========================================================
import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import PageLoading from '../PageLoading'
import { stop as stopSpeech } from '../../utils/speech'
import { abortListening } from '../../utils/recognition'
import TopBar from './TopBar'
import BottomNav from './BottomNav'
import SideNav from './SideNav'
import ScrollToTop from './ScrollToTop'
import ErrorBoundary from '../ErrorBoundary'
import Toaster from '../Toaster'
import { useProgressStore } from '../../store/progressStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useStudyTimer } from '../../hooks/useStudyTimer'
import styles from './AppLayout.module.css'

export default function AppLayout() {
  const { pathname } = useLocation()

  const recordVisit = useProgressStore((state) => state.recordVisit)
  const animations = useSettingsStore((state) => state.animations)

  useStudyTimer(pathname) // นับเวลาเรียนของวัน + ชวนพักเมื่อเรียนต่อเนื่อง 20 นาที

  // ปิดแอนิเมชันในหน้าตั้งค่า → CSS ใน global.css หยุดแอนิเมชันทั้งเว็บ (ขั้นที่ 20)
  useEffect(() => {
    if (animations) delete document.documentElement.dataset.motion
    else document.documentElement.dataset.motion = 'off'
  }, [animations])

  // เปลี่ยนหน้า → หยุดเสียงที่กำลังพูด และหยุดไมค์ที่กำลังฟัง (ไม่ให้ค้างจากหน้าเก่า)
  // + บันทึกวันที่เข้าเว็บ (ขั้นที่ 15: หายไป ≥ 3 วัน → NPC ทัก "Long time no see!" — วันเดิมไม่ทำอะไร)
  useEffect(() => {
    stopSpeech()
    abortListening()
    recordVisit()
  }, [pathname, recordVisit])

  return (
    <div className={styles.shell}>
      <ScrollToTop />
      <SideNav />
      <TopBar />
      <main className={styles.main}>
        <ErrorBoundary resetKey={pathname}>
          {/* หน้าที่ต้องโหลดเนื้อหาแยกไฟล์ (บทเรียนราย Stage / หน้าเครดิต) → แสดงตัวโหลดระหว่างรอ */}
          <Suspense fallback={<PageLoading />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <Toaster />
      <BottomNav />
    </div>
  )
}
