// =========================================================
// LearnPage — หน้าเรียนพื้นฐาน: เส้นทาง Stage 1–7 พร้อมสถานะ + แถบบทที่เรียนแล้ว (StageCard)
// (Stage ที่ล็อก กดเข้าไปได้ แต่จะเจอข้อความให้เรียน Stage ก่อนหน้าให้จบก่อน — StagePage)
// =========================================================
import { useTranslation } from 'react-i18next'
import { stages, getLessonsByStage, lessonList } from '../data'
import { useProgressStore } from '../store/progressStore'
import { getStageStatus, nextLesson } from '../utils/progress'
import Page from '../components/Page'
import StageCard from '../components/StageCard'
import styles from './LearnPage.module.css'

export default function LearnPage() {
  const { t } = useTranslation()
  const unlockedStages = useProgressStore((state) => state.unlockedStages)
  const lessonProgress = useProgressStore((state) => state.lessonProgress)
  const currentStageId = nextLesson(lessonList, unlockedStages, lessonProgress)?.stageId

  return (
    <Page title={t('learn.title')} subtitle={t('learn.subtitle')}>
      <ol className={styles.path}>
        {stages.map((stage) => {
          const lessons = getLessonsByStage(stage.id)
          return (
            <StageCard
              key={stage.id}
              stage={stage}
              status={getStageStatus(stage.id, lessons, unlockedStages, lessonProgress)}
              done={lessons.filter((lesson) => lessonProgress[lesson.id]?.completed).length}
              total={lessons.length}
              current={stage.id === currentStageId}
            />
          )
        })}
      </ol>
    </Page>
  )
}
