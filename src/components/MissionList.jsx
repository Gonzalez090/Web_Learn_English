// =========================================================
// MissionList — ภารกิจวันนี้ 3 ข้อ (ส่วนที่ 8.3) พร้อมแถบความคืบหน้าและ XP รางวัล
// เปิดหน้า → สุ่มภารกิจของวันนี้ เฉพาะข้อที่ทำได้จากสิ่งที่เรียนแล้ว (refreshDailyMissions)
// ข้อที่ยังไม่สำเร็จแตะได้ทั้งแถว → หน้าที่ทำภารกิจนั้น (utils/missions.js missionPath)
// =========================================================
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { dailyMissionPool } from '../data'
import { useProgressStore } from '../store/progressStore'
import { useReviewStore } from '../store/reviewStore'
import { useLocalized } from '../hooks/useLocalized'
import { todayKey } from '../utils/date'
import { ICONS } from '../utils/icons'
import { missionContext } from '../utils/missionContext'
import { missionPath } from '../utils/missions'
import { dueEntries } from '../utils/review'
import styles from './MissionList.module.css'

export default function MissionList() {
  const { t } = useTranslation()
  const loc = useLocalized()
  const daily = useProgressStore((state) => state.dailyMissions)
  const refreshDailyMissions = useProgressStore((state) => state.refreshDailyMissions)

  const unlockedStages = useProgressStore((state) => state.unlockedStages)
  const lessonProgress = useProgressStore((state) => state.lessonProgress)
  const npcFriendship = useProgressStore((state) => state.npcFriendship)
  const reviewQueue = useReviewStore((state) => state.reviewQueue)
  const today = todayKey()
  const reviewDue = dueEntries(reviewQueue, today).length

  useEffect(() => {
    refreshDailyMissions(reviewDue)
  }, [refreshDailyMissions, reviewDue, today, unlockedStages, lessonProgress, npcFriendship])

  // ยังเป็นภารกิจของเมื่อวาน → รอสุ่มของวันนี้ (effect ด้านบน)
  if (daily.date !== today) return null

  const context = missionContext({ unlockedStages, lessonProgress, npcFriendship }, reviewDue)
  const entries = daily.missions
    .map((entry) => ({ ...entry, mission: dailyMissionPool.find((mission) => mission.id === entry.id) }))
    .filter((entry) => entry.mission)
    .map((entry) => ({ ...entry, path: entry.done ? null : missionPath(entry.mission, context, entry.progress) }))
    // ยังไม่สำเร็จและทำไม่ได้ → กำลังจะถูกเปลี่ยน (effect ด้านบน)
    .filter((entry) => entry.done || entry.path)
  const allDone = entries.length > 0 && entries.every((entry) => entry.done)
  const TodoIcon = ICONS.missions
  const DoneIcon = ICONS.completed
  const GoIcon = ICONS.chevron

  return (
    <div className={styles.wrap}>
      <ul className={styles.list}>
        {entries.map(({ id, progress, done, mission, path }) => {
          const Icon = done ? DoneIcon : TodoIcon
          const content = (
            <>
              <Icon className={styles.icon} aria-hidden="true" />
              <span className={styles.body}>
                <span className={styles.title}>{loc(mission, 'title')}</span>
                <span className={styles.bar} aria-hidden="true">
                  <span className={styles.barFill} style={{ transform: `scaleX(${progress / mission.target})` }} />
                </span>
              </span>
              <span className={styles.meta}>
                <span className={styles.count}>
                  {done ? t('missions.done') : t('missions.progress', { progress, target: mission.target })}
                </span>
                <span className={styles.reward}>{t('missions.reward', { xp: mission.xp })}</span>
              </span>
            </>
          )
          return (
            <li key={id} className={done ? `${styles.item} ${styles.done}` : styles.item}>
              {path ? (
                <Link to={path} className={`${styles.row} ${styles.link}`}>
                  {content}
                  <GoIcon className={styles.go} aria-hidden="true" />
                </Link>
              ) : (
                <div className={styles.row}>{content}</div>
              )}
            </li>
          )
        })}
      </ul>
      <p className={styles.note}>{allDone ? t('missions.allDone') : t('missions.newDaily')}</p>
    </div>
  )
}
