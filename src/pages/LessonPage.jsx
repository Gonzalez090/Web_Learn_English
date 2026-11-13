// =========================================================
// LessonPage — หน้าบทเรียน (/lesson/:lessonId)
// ขั้นที่ 2: แสดงการ์ดคำศัพท์ทุกข้อในบท (ฟังเสียงปกติ/ช้า, ดูความหมาย)
// ตัวเล่นบทเรียนจริง (LessonPlayer) ทำในขั้นที่ 4 เป็นต้นไป
// ⚠️ Stage 1–3 ห้ามแสดงคำภาษาอังกฤษ — VocabCard จัดการให้ตาม stage.showText
// =========================================================
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getLesson, getStage } from '../data'
import { useLocalized } from '../hooks/useLocalized'
import Page from '../components/Page'
import Button from '../components/Button'
import ComingSoon from '../components/ComingSoon'
import VocabCard from '../components/VocabCard'
import NotFoundPage from './NotFoundPage'
import styles from './LessonPage.module.css'

// บทเรียนของแต่ละ Stage จะเล่นได้ในขั้นไหนของแผน
const PLAYER_STEP = { 1: 4, 2: 4, 3: 4, 4: 5, 5: 7, 6: 8, 7: 9 }

export default function LessonPage() {
  const { lessonId } = useParams()
  const { t } = useTranslation()
  const loc = useLocalized()

  const lesson = getLesson(lessonId)
  if (!lesson) return <NotFoundPage />
  const stage = getStage(lesson.stageId)

  return (
    <Page title={loc(lesson, 'title')} subtitle={t(`category.${lesson.category}`)} backTo={`/learn/${lesson.stageId}`}>
      <p className={styles.hint}>{t('lesson.previewHint')}</p>
      {/* บทที่เป็นประโยค (Stage 4 ขึ้นไป) ใช้การ์ดกว้างขึ้น อ่านผลคะแนนรายคำง่าย */}
      <div className={stage.id >= 4 ? `${styles.cards} ${styles.wide}` : styles.cards}>
        {lesson.items.map((item) => (
          <VocabCard key={item.id} item={item} stage={stage} />
        ))}
      </div>
      <ComingSoon step={PLAYER_STEP[lesson.stageId]} />
      <Button to={`/lesson/${lesson.id}/summary`} variant="secondary">
        {t('lesson.goSummary')}
      </Button>
    </Page>
  )
}
