// =========================================================
// LevelCard — การ์ดเลเวล/ฉายา + แถบ XP ถึงเลเวลถัดไป + streak + Streak Freeze
// ใช้ในหน้าแรกและหน้าโปรไฟล์ (ข้อมูลจาก progressStore — เลเวลคำนวณจาก XP)
// =========================================================
import { useTranslation } from 'react-i18next'
import { useProgressStore } from '../store/progressStore'
import { todayKey } from '../utils/date'
import { levelProgress } from '../utils/level'
import { displayStreak, refreshFreeze, studiedToday } from '../utils/streak'
import { ICONS } from '../utils/icons'
import styles from './LevelCard.module.css'

export default function LevelCard() {
  const { t } = useTranslation()
  const xp = useProgressStore((state) => state.xp)
  const streak = useProgressStore((state) => state.streak)
  const freeze = useProgressStore((state) => state.streakFreeze)

  const today = todayKey()
  const { level, titleKey, xpInLevel, xpForNext, ratio } = levelProgress(xp)
  const streakCount = displayStreak(streak, freeze, today)
  const freezeLeft = refreshFreeze(freeze, today).available
  const doneToday = studiedToday(streak, today)
  const XpIcon = ICONS.xp
  const StreakIcon = ICONS.streak
  const FreezeIcon = ICONS.freeze

  return (
    <section className={styles.card} aria-label={t('level.cardLabel')}>
      <div className={styles.levelRow}>
        <span className={styles.badge}>{t('level.short', { level })}</span>
        <span className={styles.title}>{t(`level.titles.${titleKey}`)}</span>
        <span className={styles.xp}>
          <XpIcon className={styles.xpIcon} aria-hidden="true" />
          {t('stats.xp', { count: xp })}
        </span>
      </div>

      <div
        className={styles.bar}
        role="progressbar"
        aria-label={t('level.toNext', { xp: xpForNext - xpInLevel, next: level + 1 })}
        aria-valuemin={0}
        aria-valuemax={xpForNext}
        aria-valuenow={xpInLevel}
      >
        <span className={styles.barFill} style={{ transform: `scaleX(${ratio})` }} />
      </div>
      <p className={styles.toNext}>{t('level.toNext', { xp: xpForNext - xpInLevel, next: level + 1 })}</p>

      <div className={styles.streakRow}>
        <StreakIcon className={doneToday ? `${styles.streakIcon} ${styles.lit}` : styles.streakIcon} aria-hidden="true" />
        <div className={styles.streakText}>
          <strong>{t('stats.streak', { count: streakCount })}</strong>
          <span className={styles.muted}>{doneToday ? t('streak.todayDone') : t('streak.todayPending')}</span>
        </div>
      </div>

      <p className={styles.freeze}>
        <FreezeIcon className={styles.freezeIcon} aria-hidden="true" />
        {freezeLeft > 0 ? t('streak.freezeReady') : t('streak.freezeUsed')}
      </p>
    </section>
  )
}
