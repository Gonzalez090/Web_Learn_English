// =========================================================
// LessonPage — หน้าบทเรียน (/lesson/:lessonId)
// ขั้นที่ 1: แสดงภาพของแต่ละข้อ เพื่อเช็กว่าข้อมูลโหลดได้
// ตัวเล่นบทเรียนจริง (LessonPlayer) ทำในขั้นที่ 4 เป็นต้นไป
// ⚠️ Stage 1–3 ห้ามแสดงคำภาษาอังกฤษ จึงโชว์แค่ภาพ (alt ว่าง)
// =========================================================
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getLesson } from '../data'
import { useLocalized } from '../hooks/useLocalized'
import Page from '../components/Page'
import Button from '../components/Button'
import ComingSoon from '../components/ComingSoon'
import Picture from '../components/Picture'
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

  return (
    <Page title={loc(lesson, 'title')} subtitle={t(`category.${lesson.category}`)} backTo={`/learn/${lesson.stageId}`}>
      <div className={styles.preview}>
        {lesson.items.map((item) => (
          <Picture key={item.id} image={item.image} size="fill" />
        ))}
      </div>
      <ComingSoon step={PLAYER_STEP[lesson.stageId]} />
      <Button to={`/lesson/${lesson.id}/summary`} variant="secondary">
        {t('lesson.goSummary')}
      </Button>
    </Page>
  )
}
