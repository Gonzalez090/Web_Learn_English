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
import LessonPage from './pages/LessonPage'
import LessonSummaryPage from './pages/LessonSummaryPage'
import PlacePage from './pages/PlacePage'
import TalkPage from './pages/TalkPage'
import PhrasesPage from './pages/PhrasesPage'
import RealVsTextbookPage from './pages/RealVsTextbookPage'
import ReviewPage from './pages/ReviewPage'
import DailyPlanPage from './pages/DailyPlanPage'
import GamesPage from './pages/GamesPage'
import GamePage from './pages/GamePage'
import SoundPracticePage from './pages/SoundPracticePage'
import ProfilePage from './pages/ProfilePage'
import SpeakingCheckPage from './pages/SpeakingCheckPage'
import SettingsPage from './pages/SettingsPage'
import CreditsPage from './pages/CreditsPage'
import NotFoundPage from './pages/NotFoundPage'

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
        <Route path="talk/:scenarioId" element={<TalkPage />} />
        <Route path="phrases" element={<PhrasesPage />} />
        <Route path="phrases/real-vs-textbook" element={<RealVsTextbookPage />} />

        {/* เรียนต่อเนื่อง */}
        <Route path="review" element={<ReviewPage />} />
        <Route path="plan" element={<DailyPlanPage />} />
        <Route path="games" element={<GamesPage />} />
        <Route path="games/:gameId" element={<GamePage />} />
        <Route path="sounds" element={<SoundPracticePage />} />

        {/* โปรไฟล์ + ตั้งค่า */}
        <Route path="profile" element={<ProfilePage />} />
        <Route path="profile/speaking-check" element={<SpeakingCheckPage />} />
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
