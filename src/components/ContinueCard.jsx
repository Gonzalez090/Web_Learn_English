// =========================================================
// ContinueCard — การ์ดใหญ่ "เรียนต่อ" บนหน้าแรก: ภาพบทถัดไป + ชื่อบท + เรียนไปกี่บทใน Stage นี้ + ปุ่มเหลือง
//   ทั้งการ์ดกดได้ (ลิงก์เดียว) — เรียนครบทุกบทที่เปิดแล้ว → พาไปหน้ารายการ Stage
// =========================================================
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getLessonsByStage, getStage, lessonList } from '../data'
import { useLocalized } from '../hooks/useLocalized'
import { useProgressStore } from '../store/progressStore'
import { nextLesson } from '../utils/progress'
import { ICONS } from '../utils/icons'
import Picture from './Picture'
import styles from './ContinueCard.module.css'

export default function ContinueCard() {
  const { t } = useTranslation()
  const loc = useLocalized()
  const unlockedStages = useProgressStore((state) => state.unlockedStages)
  const lessonProgress = useProgressStore((state) => state.lessonProgress)
  const lesson = nextLesson(lessonList, unlockedStages, lessonProgress)
  const PlayIcon = ICONS.unlocked

  if (!lesson) {
    return (
      <Link to="/learn" className={`${styles.card} ${styles.solo}`}>
        <span className={styles.text}>
          <span className={styles.title}>{t('home.allDone')}</span>
          <span className={styles.cta}>
            <ICONS.learn className={styles.ctaIcon} aria-hidden="true" />
            {t('home.learnBasics')}
          </span>
        </span>
      </Link>
    )
  }

  const stage = getStage(lesson.stageId)
  const stageLessons = getLessonsByStage(stage.id)
  const done = stageLessons.filter((entry) => lessonProgress[entry.id]?.completed).length

  return (
    <Link to={`/lesson/${lesson.id}`} className={styles.card}>
      <span className={styles.text}>
        <span className={styles.stage}>
          {t('learn.stageN', { n: stage.id })} · {loc(stage, 'name')}
        </span>
        <span className={styles.title}>{loc(lesson, 'title')}</span>
        <span className={styles.progress}>
          <span className={styles.bar} aria-hidden="true">
            <span className={styles.fill} style={{ transform: `scaleX(${done / stageLessons.length})` }} />
          </span>
          <span className={styles.count}>{t('learn.lessonsDone', { done, total: stageLessons.length })}</span>
        </span>
        <span className={styles.cta}>
          <PlayIcon className={styles.ctaIcon} aria-hidden="true" />
          {t('home.continue')}
        </span>
      </span>
      <Picture image={lesson.image} size="fill" className={styles.picture} />
    </Link>
  )
}
