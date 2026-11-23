// =========================================================
// CheckStats — สถิติของการอัด 1 ครั้ง: คำต่อนาที / คำทั้งหมด / คำไม่ซ้ำ / วลีที่ใช้ / หยุดนาน
//   ส่ง compare (ผลของ compareStats) → แต่ละช่องมีป้าย +/− เทียบกับครั้งก่อน (ดีขึ้น = สีเขียว)
//   ไม่บอกว่า "แย่ลง" ด้วยสีแดง — ใช้สีเทา (ไม่ตำหนิผู้เรียน)
// props: stats, compare?, compareLabel? (เช่น "เทียบกับครั้งก่อน"), showChunks (แสดงรายการวลีที่ใช้)
// =========================================================
import { useTranslation } from 'react-i18next'
import { STAT_KEYS, statValue } from '../../utils/speakingCheck'
import styles from './Speaking.module.css'

const formatDelta = (delta) => (delta > 0 ? `+${delta}` : `−${Math.abs(delta)}`)

export default function CheckStats({ stats, compare = null, compareLabel = '', showChunks = true }) {
  const { t } = useTranslation()

  return (
    <div className={styles.statsBlock}>
      {compare && compareLabel && <p className={styles.compareLabel}>{compareLabel}</p>}
      <dl className={styles.stats}>
        {STAT_KEYS.map((key) => {
          const value = statValue(stats, key)
          const change = compare?.[key]
          return (
            <div key={key} className={styles.stat}>
              <dt className={styles.statLabel}>{t(`speakingCheck.stat.${key}`)}</dt>
              <dd className={styles.statValue}>
                {value ?? '—'}
                {change?.delta ? (
                  <span className={change.better ? styles.deltaBetter : styles.delta}>{formatDelta(change.delta)}</span>
                ) : null}
              </dd>
            </div>
          )
        })}
      </dl>
      {showChunks && stats?.chunks?.length > 0 && (
        <ul className={styles.chunks} aria-label={t('speakingCheck.stat.chunks')}>
          {stats.chunks.map((chunk) => (
            <li key={chunk} className={styles.chunk} lang="en">
              {chunk}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
