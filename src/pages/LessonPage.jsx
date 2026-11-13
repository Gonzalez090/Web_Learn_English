// =========================================================
// LessonPage — หน้าบทเรียน (/lesson/:lessonId)
// - Stage ยังล็อก → แจ้งให้เรียน Stage ก่อนหน้าให้จบก่อน
// - บทที่มีตัวเล่นแล้ว (utils/lessonSteps.js) → LessonPlayer
// - บทที่ยังไม่มีตัวเล่น → แสดงการ์ดคำศัพท์ให้ฟังไปก่อน + บอกว่าจะเปิดในขั้นไหน
// ⚠️ Stage 1–3 ห้ามแสดงคำภาษาอังกฤษ — ตัวเล่น/VocabCard จัดการให้ตาม stage.showText
// =========================================================
import { useLocation, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getLesson, getStage } from '../data'
import { useLocalized } from '../hooks/useLocalized'
import { useProgressStore } from '../store/progressStore'
import { isPlayable } from '../utils/lessonSteps'
import Page from '../components/Page'
import ComingSoon from '../components/ComingSoon'
import LockedNotice from '../components/LockedNotice'
import VocabCard from '../components/VocabCard'
import LessonPlayer from '../components/lesson/LessonPlayer'
import NotFoundPage from './NotFoundPage'
import styles from './LessonPage.module.css'

// บทเรียนของแต่ละ Stage จะเล่นได้ในขั้นไหนของแผน
const PLAYER_STEP = { 4: 5, 5: 7, 6: 8, 7: 9 }

// รับเฉพาะรายการ id ที่เป็นข้อความ (state มาจากปุ่ม "ฝึกซ้ำข้อที่พลาด")
const readItemIds = (state) =>
  Array.isArray(state?.onlyItemIds) ? state.onlyItemIds.filter((id) => typeof id === 'string') : undefined

export default function LessonPage() {
  const { lessonId } = useParams()
  const location = useLocation()
  const { t } = useTranslation()
  const loc = useLocalized()
  const unlockedStages = useProgressStore((state) => state.unlockedStages)

  const lesson = getLesson(lessonId)
  if (!lesson) return <NotFoundPage />
  const stage = getStage(lesson.stageId)
  const title = loc(lesson, 'title')
  const subtitle = t(`category.${lesson.category}`)

  if (!unlockedStages.includes(stage.id)) {
    return (
      <Page title={title} subtitle={subtitle} backTo={`/learn/${stage.id}`}>
        <LockedNotice stageId={stage.id} />
      </Page>
    )
  }

  if (isPlayable(lesson)) {
    return (
      <Page title={title} subtitle={subtitle}>
        {/* key = รายการประวัติ → กด "เล่นอีกครั้ง" / "ฝึกซ้ำ" แล้วเริ่มบทใหม่ทั้งหมด */}
        <LessonPlayer
          key={location.key}
          lesson={lesson}
          stage={stage}
          onlyItemIds={readItemIds(location.state)}
        />
      </Page>
    )
  }

  return (
    <Page title={title} subtitle={subtitle} backTo={`/learn/${stage.id}`}>
      <p className={styles.hint}>{t('lesson.previewHint')}</p>
      {/* บทที่เป็นประโยค (Stage 4 ขึ้นไป) ใช้การ์ดกว้างขึ้น อ่านผลคะแนนรายคำง่าย */}
      <div className={stage.id >= 4 ? `${styles.cards} ${styles.wide}` : styles.cards}>
        {lesson.items.map((item) => (
          <VocabCard key={item.id} item={item} stage={stage} />
        ))}
      </div>
      <ComingSoon step={PLAYER_STEP[stage.id]} />
    </Page>
  )
}
