// =========================================================
// StageCard — การ์ด Stage 1 ใบบนเส้นทางเรียน (หน้า /learn)
//   ซ้าย: จุดบนเส้นทาง (เลข Stage / ผ่านแล้ว ✓ / กุญแจ)   ขวา: ภาพ + ชื่อ + คำอธิบาย + แถบบทที่เรียนแล้ว
//   สีของป้ายทักษะตามลำดับเรียน: ฟัง (ฟ้า) → พูด (ม่วง) → อ่าน (ส้ม) → เขียน (ชมพู)
// =========================================================
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLocalized } from '../hooks/useLocalized'
import { ICONS } from '../utils/icons'
import Picture from './Picture'
import styles from './StageCard.module.css'

// ทักษะหลักของแต่ละ Stage (Stage 2–5 = พูด)
const SKILL = { 1: 'listen', 6: 'read', 7: 'write' }

// status: 'locked' | 'unlocked' | 'completed'   current = Stage ที่กำลังเรียน   done/total = จำนวนบท
export default function StageCard({ stage, status, done, total, current = false }) {
  const { t } = useTranslation()
  const loc = useLocalized()
  const skill = SKILL[stage.id] ?? 'speak'
  const locked = status === 'locked'
  const CheckIcon = ICONS.completed
  const LockIcon = ICONS.locked
  const NextIcon = ICONS.chevron

  return (
    <li className={[styles.stop, styles[status], current && styles.current].filter(Boolean).join(' ')}>
      <span className={styles.node} aria-hidden="true">
        {status === 'completed' ? <CheckIcon /> : locked ? <LockIcon /> : stage.id}
      </span>
      <Link to={`/learn/${stage.id}`} className={styles.card} aria-current={current ? 'step' : undefined}>
        <Picture image={stage.image} size="md" className={styles.picture} />
        <span className={styles.text}>
          <span className={styles.meta}>
            <span className={styles.stage}>{t('learn.stageN', { n: stage.id })}</span>
            <span className={`${styles.skill} ${styles[skill]}`}>{t(`welcome.skills.${skill}`)}</span>
          </span>
          <span className={styles.title}>{loc(stage, 'name')}</span>
          <span className={styles.description}>{loc(stage, 'description')}</span>
          <span className={styles.age}>{loc(stage, 'age')}</span>
          {locked ? (
            <span className={styles.lockedText}>{t('map.unlockAt', { n: stage.id - 1 })}</span>
          ) : (
            <span className={styles.progress}>
              <span className={styles.bar} aria-hidden="true">
                <span className={styles.fill} style={{ transform: `scaleX(${total ? done / total : 0})` }} />
              </span>
              <span className={styles.count}>{t('learn.lessonsDone', { done, total })}</span>
            </span>
          )}
        </span>
        <NextIcon className={styles.chevron} aria-hidden="true" />
      </Link>
    </li>
  )
}
