// =========================================================
// App — กำหนดเส้นทาง (routes) ทั้งหมดของเว็บ
// ทุกหน้าอยู่ใต้ AppLayout (แถบบน + เนื้อหา + แถบเมนูล่าง)
// =========================================================
import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import HomePage from './pages/HomePage'
import LearnPage from './pages/LearnPage'
import StagePage from './pages/StagePage'
import LessonSummaryPage from './pages/LessonSummaryPage'
import PlacePage from './pages/PlacePage'
import TalkPage from './pages/TalkPage'
import TalkListPage from './pages/TalkListPage'
import PhrasesPage from './pages/PhrasesPage'
import PhraseSituationPage from './pages/PhraseSituationPage'
import RealVsTextbookPage from './pages/RealVsTextbookPage'
import DailyPlanPage from './pages/DailyPlanPage'
import GamesPage from './pages/GamesPage'
import GamePage from './pages/GamePage'
import SoundPracticePage from './pages/SoundPracticePage'
import SoundDrillPage from './pages/SoundDrillPage'
import WelcomePage from './pages/WelcomePage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import NotFoundPage from './pages/NotFoundPage'

// หน้าเครดิตมีรายชื่อช่างภาพหลายร้อยรายการ → แยกไฟล์ โหลดเฉพาะตอนเปิดหน้า (Suspense อยู่ใน AppLayout)
const CreditsPage = lazy(() => import('./pages/CreditsPage'))

// หน้าบทเรียน = ตัวเล่นบท + ทุกขั้น + มินิเกม (โค้ดก้อนใหญ่ที่สุด) → แยกไฟล์ โหลดเมื่อเข้าบทเรียน
// เปิดเว็บครั้งแรกจึงเร็วขึ้น (ระหว่างโหลดแสดงตัวโหลดของ AppLayout เหมือนตอนรอเนื้อหาบท)
const LessonPage = lazy(() => import('./pages/LessonPage'))
// หน้าทบทวนใช้ขั้นต่าง ๆ ของบทเรียนชุดเดียวกัน (พูด / อ่าน / เขียน / เกมแตะภาพ) → แยกไฟล์ด้วย ใช้โค้ดร่วมกับหน้าบทเรียน
const ReviewPage = lazy(() => import('./pages/ReviewPage'))
// Speaking Check (อัดเสียง + IndexedDB + สถิติ) เปิดเดือนละครั้ง → แยกไฟล์ (ขั้นที่ 19)
const SpeakingCheckPage = lazy(() => import('./pages/SpeakingCheckPage'))
// Collection การ์ดวลี: โหลดวลีทุกสถานการณ์ → แยกไฟล์ (ขั้นที่ 20)
const CollectionPage = lazy(() => import('./pages/CollectionPage'))
// ห้องของตัวละคร (ขั้นที่ 20-2)
const RoomPage = lazy(() => import('./pages/RoomPage'))

// หน้าทดสอบ /dev โหลดเฉพาะตอน npm run dev (ตอน build จริงโค้ดส่วนนี้ถูกตัดทิ้ง)
const DevPage = import.meta.env.DEV ? lazy(() => import('./pages/DevPage')) : null

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* หน้าแรก + เรียนพื้นฐาน */}
        <Route index element={<HomePage />} />
        <Route path="learn" element={<LearnPage />} />
        <Route path="learn/:stageId" element={<StagePage />} />
        <Route path="lesson/:lessonId" element={<LessonPage />} />
        <Route path="lesson/:lessonId/summary" element={<LessonSummaryPage />} />

        {/* เมือง + ภาษาชีวิตจริง */}
        <Route path="place/:placeId" element={<PlacePage />} />
        <Route path="talk" element={<TalkListPage />} />
        <Route path="talk/:scenarioId" element={<TalkPage />} />
        <Route path="phrases" element={<PhrasesPage />} />
        <Route path="phrases/real-vs-textbook" element={<RealVsTextbookPage />} />
        <Route path="phrases/:situationId" element={<PhraseSituationPage />} />

        {/* เรียนต่อเนื่อง */}
        <Route path="review" element={<ReviewPage />} />
        <Route path="plan" element={<DailyPlanPage />} />
        <Route path="games" element={<GamesPage />} />
        <Route path="games/:gameId" element={<GamePage />} />
        <Route path="welcome" element={<WelcomePage />} />
        <Route path="sounds" element={<SoundPracticePage />} />
        <Route path="sounds/:soundId" element={<SoundDrillPage />} />

        {/* โปรไฟล์ + ตั้งค่า */}
        <Route path="profile" element={<ProfilePage />} />
        <Route path="profile/speaking-check" element={<SpeakingCheckPage />} />
        <Route path="profile/collection" element={<CollectionPage />} />
        <Route path="profile/room" element={<RoomPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="credits" element={<CreditsPage />} />

        {DevPage && (
          <Route
            path="dev"
            element={
              <Suspense fallback={null}>
                <DevPage />
              </Suspense>
            }
          />
        )}

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
