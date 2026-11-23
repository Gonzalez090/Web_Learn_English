// =========================================================
// ResetSection — รีเซ็ตความคืบหน้า (หน้าตั้งค่า, ขั้นที่ 21ข) — ยืนยันก่อนเสมอ ย้อนไม่ได้
//   ล้าง: ความคืบหน้าทั้งหมด + รายการทบทวน / เก็บไว้: การตั้งค่า
//   เสียง Speaking Check เก็บไว้ ยกเว้นติ๊ก "ลบด้วย" — เปิดกล่องทุกครั้งเริ่มจากไม่ติ๊ก (ConfirmReset ถูกสร้างใหม่)
// props: notice / onNotice (ใช้ร่วมกับ BackupSection), open / onOpen / onClose (เปิดกล่องยืนยันได้ทีละกล่องทั้งหน้า)
// =========================================================
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useProgressStore } from '../../store/progressStore'
import { useReviewStore } from '../../store/reviewStore'
import { clearChecks, isCheckStoreSupported } from '../../utils/checkStore'
import { ICONS } from '../../utils/icons'
import Section from '../Section'
import Button from '../Button'
import styles from './DataSections.module.css'

function ConfirmReset({ onDone, onCancel }) {
  const { t } = useTranslation()
  const [withRecordings, setWithRecordings] = useState(false)
  const [busy, setBusy] = useState(false)
  const boxRef = useRef(null)

  // เปิดกล่อง → ย้ายโฟกัสมาที่กล่อง (คีย์บอร์ด/โปรแกรมอ่านหน้าจอ)
  useEffect(() => {
    boxRef.current?.focus()
  }, [])

  async function reset() {
    setBusy(true)
    let result = { kind: 'ok', key: 'settings.resetDone' }
    if (withRecordings) {
      try {
        await clearChecks()
      } catch {
        result = { kind: 'error', key: 'settings.resetRecordingsFailed' }
      }
    }
    useProgressStore.getState().resetProgress()
    useReviewStore.getState().resetReview()
    onDone(result)
  }

  return (
    <div ref={boxRef} className={styles.confirm} role="group" tabIndex={-1} aria-label={t('settings.resetConfirm')}>
      <p className={styles.confirmTitle}>{t('settings.resetConfirm')}</p>
      <p className={styles.note}>{t('settings.resetWarning')}</p>
      {isCheckStoreSupported && (
        <label className={styles.check}>
          <input type="checkbox" checked={withRecordings} onChange={(event) => setWithRecordings(event.target.checked)} />
          <span>{t('settings.resetRecordings')}</span>
        </label>
      )}
      <div className={styles.actions}>
        <Button variant="danger" icon={ICONS.delete} disabled={busy} onClick={reset}>
          {t('settings.resetYes')}
        </Button>
        <Button variant="ghost" disabled={busy} onClick={onCancel}>
          {t('settings.cancel')}
        </Button>
      </div>
    </div>
  )
}

export default function ResetSection({ notice, onNotice, open, onOpen, onClose }) {
  const { t } = useTranslation()
  const message = notice?.section === 'reset' ? notice : null

  return (
    <Section title={t('settings.reset')} description={t('settings.resetHint')}>
      {open ? (
        <ConfirmReset
          onCancel={onClose}
          onDone={(result) => {
            onClose()
            onNotice({ ...result, section: 'reset' })
          }}
        />
      ) : (
        <div className={styles.actions}>
          <Button
            variant="danger"
            icon={ICONS.delete}
            onClick={() => {
              onNotice(null)
              onOpen()
            }}
          >
            {t('settings.resetStart')}
          </Button>
        </div>
      )}
      <p role="status" className={message ? `${styles.message} ${styles[message.kind]}` : 'sr-only'}>
        {message ? t(message.key) : ''}
      </p>
    </Section>
  )
}
