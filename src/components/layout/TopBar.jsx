// =========================================================
// TopBar — แถบบนของทุกหน้า
//   ซ้าย: โลโก้ + ชื่อแอป (กดแล้วกลับหน้าแรก)
//   ขวา: streak + XP แบบย่อ + ปุ่มสลับภาษา TH | EN + บัญชี (เข้าสู่ระบบ / วงกลมชื่อ)
// (แถบเลเวลเต็มอยู่ในการ์ด LevelCard หน้าแรก/โปรไฟล์)
// =========================================================
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAccountStore } from '../../store/accountStore'
import { useProgressStore } from '../../store/progressStore'
import { ICONS } from '../../utils/icons'
import { todayKey } from '../../utils/date'
import { displayStreak } from '../../utils/streak'
import LanguageToggle from '../LanguageToggle'
import AccountButton from './AccountButton'
import styles from './TopBar.module.css'

export default function TopBar() {
  const { t } = useTranslation()
  const xp = useProgressStore((state) => state.xp)
  const streakState = useProgressStore((state) => state.streak)
  const freeze = useProgressStore((state) => state.streakFreeze)
  // หายไปจน streak ขาดแล้ว → แสดง 0 (ยังต่อได้ด้วย Freeze → แสดงตัวเลขเดิม)
  const streak = displayStreak(streakState, freeze, todayKey())
  const hasAccount = useAccountStore((state) => state.status !== 'off')
  const StreakIcon = ICONS.streak
  const XpIcon = ICONS.xp

  return (
    <header className={styles.bar}>
      <div className={hasAccount ? `${styles.inner} ${styles.withAccount}` : styles.inner}>
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
            {/* key = xp → ได้ XP แล้วตัวเลขเด้ง (ขั้นที่ 20 — ปิดได้ในตั้งค่า "แอนิเมชัน") */}
            <span key={xp} className={styles.bump} aria-hidden="true">
              {xp}
            </span>
            <span className="sr-only">{t('stats.xp', { count: xp })}</span>
          </span>
          <LanguageToggle />
          <AccountButton />
        </div>
      </div>
    </header>
  )
}
