// =========================================================
// LevelCard — การ์ดเลเวล/ฉายา + วงแหวน XP ถึงเลเวลถัดไป + streak + Streak Freeze
// ใช้ในหน้าแรกและหน้าโปรไฟล์ (ข้อมูลจาก progressStore — เลเวลคำนวณจาก XP)
// =========================================================
import { useTranslation } from 'react-i18next'
import { useProgressStore } from '../store/progressStore'
import { todayKey } from '../utils/date'
import { levelProgress } from '../utils/level'
import { displayStreak, refreshFreeze, studiedToday } from '../utils/streak'
import { ICONS } from '../utils/icons'
import styles from './LevelCard.module.css'

const RADIUS = 36 // วงแหวนใน viewBox 84
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

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
        <div
          className={styles.ring}
          role="progressbar"
          aria-label={t('level.toNext', { xp: xpForNext - xpInLevel, next: level + 1 })}
          aria-valuemin={0}
          aria-valuemax={xpForNext}
          aria-valuenow={xpInLevel}
        >
          <svg viewBox="0 0 84 84" aria-hidden="true">
            <circle className={styles.track} cx="42" cy="42" r={RADIUS} />
            <circle
              className={styles.fill}
              cx="42"
              cy="42"
              r={RADIUS}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - ratio)}
            />
          </svg>
          <span className={styles.badge}>{t('level.short', { level })}</span>
        </div>
        <div className={styles.levelText}>
          <span className={styles.title}>{t(`level.titles.${titleKey}`)}</span>
          <span className={styles.xp}>
            <XpIcon className={styles.xpIcon} aria-hidden="true" />
            {t('stats.xp', { count: xp })}
          </span>
          <span className={styles.toNext}>{t('level.toNext', { xp: xpForNext - xpInLevel, next: level + 1 })}</span>
        </div>
      </div>

      <div className={styles.rows}>
        <div className={doneToday ? `${styles.row} ${styles.lit}` : styles.row}>
          <StreakIcon className={styles.streakIcon} aria-hidden="true" />
          <div className={styles.streakText}>
            <strong>{t('stats.streak', { count: streakCount })}</strong>
            <span className={styles.muted}>{doneToday ? t('streak.todayDone') : t('streak.todayPending')}</span>
          </div>
        </div>
        <div className={styles.row}>
          <FreezeIcon className={styles.freezeIcon} aria-hidden="true" />
          <p className={styles.muted}>{freezeLeft > 0 ? t('streak.freezeReady') : t('streak.freezeUsed')}</p>
        </div>
      </div>
    </section>
  )
}
