// =========================================================
// TopBar — แถบบนของทุกหน้า
//   ซ้าย: โลโก้ + ชื่อแอป (กดแล้วกลับหน้าแรก)
//   ขวา: streak 🔥 + XP ⭐ แบบย่อ + ปุ่มสลับภาษา TH | EN
// (แถบ XP/เลเวลเต็มรูปแบบทำในขั้นที่ 13)
// =========================================================
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useProgressStore } from '../../store/progressStore'
import { ICONS } from '../../utils/icons'
import LanguageToggle from '../LanguageToggle'
import styles from './TopBar.module.css'

export default function TopBar() {
  const { t } = useTranslation()
  const xp = useProgressStore((state) => state.xp)
  const streak = useProgressStore((state) => state.streak.count)
  const StreakIcon = ICONS.streak
  const XpIcon = ICONS.xp

  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand}>
          <img src="/favicon.svg" alt="" className={styles.logo} width="32" height="32" />
          <span className={styles.name}>{t('app.name')}</span>
        </Link>

        <div className={styles.right}>
          <span className={styles.stat}>
            <StreakIcon className={`${styles.statIcon} ${styles.streak}`} aria-hidden="true" />
            <span aria-hidden="true">{streak}</span>
            <span className="sr-only">{t('stats.streak', { count: streak })}</span>
          </span>
          <span className={styles.stat}>
            <XpIcon className={`${styles.statIcon} ${styles.xp}`} aria-hidden="true" />
            <span aria-hidden="true">{xp}</span>
            <span className="sr-only">{t('stats.xp', { count: xp })}</span>
          </span>
          <LanguageToggle />
        </div>
      </div>
    </header>
  )
}
