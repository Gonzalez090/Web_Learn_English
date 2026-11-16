// =========================================================
// StatusBadge — ป้ายสถานะ: ล็อกอยู่ / เรียนได้ / ผ่านแล้ว / บทต่อไป
// status: 'locked' | 'unlocked' | 'completed' | 'next'
// =========================================================
import { useTranslation } from 'react-i18next'
import { ICONS } from '../utils/icons'
import styles from './StatusBadge.module.css'

const STATUS_ICON = {
  locked: ICONS.locked,
  unlocked: ICONS.unlocked,
  completed: ICONS.completed,
  next: ICONS.unlocked,
}

export default function StatusBadge({ status }) {
  const { t } = useTranslation()
  const Icon = STATUS_ICON[status]

  return (
    <span className={`${styles.badge} ${styles[status]}`}>
      <Icon className={styles.icon} aria-hidden="true" />
      {t(`status.${status}`)}
    </span>
  )
}
