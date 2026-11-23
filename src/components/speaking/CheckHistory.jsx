// =========================================================
// CheckHistory — ผล Speaking Check ทุกครั้ง (ใหม่ → เก่า): วันที่ + สรุปสถิติ + ฟังเสียงที่อัด + ลบ
//   ลบต้องกดยืนยันอีกครั้งในแถวเดียวกัน (ไม่ใช้กล่อง confirm ของเบราว์เซอร์)
// props: checks (เรียงเก่า → ใหม่), onDelete(id)
// =========================================================
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatShortDate } from '../../utils/date'
import { ICONS } from '../../utils/icons'
import Button from '../Button'
import RecordingPlayer from './RecordingPlayer'
import styles from './Speaking.module.css'

export default function CheckHistory({ checks, onDelete }) {
  const { t, i18n } = useTranslation()
  const [confirmId, setConfirmId] = useState(null)
  const numbered = checks.map((check, index) => ({ check, number: index + 1 })).reverse()

  return (
    <ul className={styles.history}>
      {numbered.map(({ check, number }) => {
        const title = t('speakingCheck.checkNumber', { number, date: formatShortDate(check.date, i18n.language) })
        const wpm = check.stats?.wpm
        return (
          <li key={check.id} className={styles.historyItem}>
            <div className={styles.historyHead}>
              <p className={styles.historyTitle}>{title}</p>
              <p className={styles.historyMeta}>
                {wpm === null || wpm === undefined
                  ? t('speakingCheck.noTextShort')
                  : t('speakingCheck.historyMeta', { wpm, chunks: check.stats.chunks?.length ?? 0 })}
              </p>
            </div>
            <RecordingPlayer blob={check.blob} label={title} />
            {confirmId === check.id ? (
              <div className={styles.confirm} role="group" aria-label={t('speakingCheck.deleteConfirm')}>
                <span>{t('speakingCheck.deleteConfirm')}</span>
                <Button size="sm" variant="danger" onClick={() => onDelete(check.id)}>
                  {t('speakingCheck.deleteYes')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmId(null)}>
                  {t('speakingCheck.deleteNo')}
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="ghost" icon={ICONS.delete} className={styles.deleteButton} onClick={() => setConfirmId(check.id)}>
                {t('speakingCheck.delete')}
              </Button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
