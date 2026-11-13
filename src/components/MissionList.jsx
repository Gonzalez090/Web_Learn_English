// =========================================================
// MissionList — ภารกิจวันนี้ 3 ข้อ (ส่วนที่ 8.3) พร้อมแถบความคืบหน้าและ XP รางวัล
// เปิดหน้าครั้งแรกของวัน → สุ่มภารกิจของวันนี้ (refreshDailyMissions)
// =========================================================
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { dailyMissionPool } from '../data'
import { useProgressStore } from '../store/progressStore'
import { useLocalized } from '../hooks/useLocalized'
import { todayKey } from '../utils/date'
import { ICONS } from '../utils/icons'
import styles from './MissionList.module.css'

export default function MissionList() {
  const { t } = useTranslation()
  const loc = useLocalized()
  const daily = useProgressStore((state) => state.dailyMissions)
  const refreshDailyMissions = useProgressStore((state) => state.refreshDailyMissions)

  useEffect(() => {
    refreshDailyMissions()
  }, [refreshDailyMissions])

  // ยังเป็นภารกิจของเมื่อวาน → รอสุ่มของวันนี้ (effect ด้านบน)
  if (daily.date !== todayKey()) return null

  const entries = daily.missions
    .map((entry) => ({ ...entry, mission: dailyMissionPool.find((mission) => mission.id === entry.id) }))
    .filter((entry) => entry.mission)
  const allDone = entries.length > 0 && entries.every((entry) => entry.done)
  const TodoIcon = ICONS.missions
  const DoneIcon = ICONS.completed

  return (
    <div className={styles.wrap}>
      <ul className={styles.list}>
        {entries.map(({ id, progress, done, mission }) => {
          const Icon = done ? DoneIcon : TodoIcon
          return (
            <li key={id} className={done ? `${styles.item} ${styles.done}` : styles.item}>
              <Icon className={styles.icon} aria-hidden="true" />
              <div className={styles.body}>
                <span className={styles.title}>{loc(mission, 'title')}</span>
                <span className={styles.bar} aria-hidden="true">
                  <span className={styles.barFill} style={{ transform: `scaleX(${progress / mission.target})` }} />
                </span>
              </div>
              <div className={styles.meta}>
                <span className={styles.count}>
                  {done ? t('missions.done') : t('missions.progress', { progress, target: mission.target })}
                </span>
                <span className={styles.reward}>{t('missions.reward', { xp: mission.xp })}</span>
              </div>
            </li>
          )
        })}
      </ul>
      <p className={styles.note}>{allDone ? t('missions.allDone') : t('missions.newDaily')}</p>
    </div>
  )
}
