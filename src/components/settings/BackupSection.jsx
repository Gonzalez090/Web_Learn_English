// =========================================================
// BackupSection — สำรอง / กู้คืนความคืบหน้าเป็นไฟล์ (หน้าตั้งค่า, ขั้นที่ 21ข)
//   สำรอง: ดาวน์โหลดไฟล์ JSON (utils/backup.js) — ไม่ส่งไปไหน อยู่ในเครื่องผู้ใช้
//   กู้คืน: เลือกไฟล์ → ตรวจ → แสดงของในไฟล์เทียบกับตอนนี้ → กดยืนยันอีกครั้งจึงแทนที่
// props: notice / onNotice = ข้อความล่าสุดของหน้า { section, kind: 'ok' | 'error', key } (ใช้ร่วมกับ ResetSection
//        → ข้อความของอีกส่วนไม่ค้าง เช่น "กู้คืนเรียบร้อย" หลังกดรีเซ็ต)
//        open / onOpen / onClose = กล่องยืนยันกู้คืน (เปิดได้ทีละกล่องทั้งหน้า)
// =========================================================
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { INITIAL_PROGRESS, useProgressStore } from '../../store/progressStore'
import { useReviewStore } from '../../store/reviewStore'
import { backupFileName, createBackup, MAX_BACKUP_BYTES, parseBackup, summarize } from '../../utils/backup'
import { formatShortDate, toDateKey, todayKey } from '../../utils/date'
import { ICONS } from '../../utils/icons'
import Section from '../Section'
import Button from '../Button'
import { useReturnFocus } from './useReturnFocus'
import styles from './DataSections.module.css'

// ดาวน์โหลดข้อความเป็นไฟล์
function downloadText(text, fileName) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  // บางเบราว์เซอร์เริ่มโหลดช้ากว่าคำสั่งคลิก → คืนหน่วยความจำทีหลัง
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

const SUMMARY_KEYS = ['xp', 'lessons', 'cards', 'review']

function ConfirmRestore({ candidate, now, onConfirm, onCancel }) {
  const { t, i18n } = useTranslation()
  const boxRef = useRef(null)

  // ได้ไฟล์ (ใหม่) → ย้ายโฟกัสมาที่กล่อง (คีย์บอร์ด/โปรแกรมอ่านหน้าจอ)
  useEffect(() => {
    boxRef.current?.focus()
  }, [candidate])

  return (
    <div ref={boxRef} className={styles.confirm} role="group" tabIndex={-1} aria-label={t('settings.restoreConfirm')}>
      <p className={styles.confirmTitle}>{t('settings.restoreConfirm')}</p>
      <p className={styles.note}>
        {candidate.createdAt
          ? t('settings.restoreFrom', { date: formatShortDate(toDateKey(candidate.createdAt), i18n.language) })
          : t('settings.restoreNoDate')}
      </p>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">
              <span className="sr-only">{t('settings.restoreItem')}</span>
            </th>
            <th scope="col">{t('settings.restoreNow')}</th>
            <th scope="col">{t('settings.restoreFile')}</th>
          </tr>
        </thead>
        <tbody>
          {SUMMARY_KEYS.map((key) => (
            <tr key={key}>
              <th scope="row">{t(`settings.restoreRow.${key}`)}</th>
              <td>{now[key]}</td>
              <td>{candidate.summary[key]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.actions}>
        <Button variant="danger" onClick={onConfirm}>
          {t('settings.restoreYes')}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          {t('settings.cancel')}
        </Button>
      </div>
    </div>
  )
}

export default function BackupSection({ notice, onNotice, open, onOpen, onClose }) {
  const { t } = useTranslation()
  const progress = useProgressStore()
  const reviewQueue = useReviewStore((state) => state.reviewQueue)
  const inputRef = useRef(null)
  const chooseRef = useReturnFocus(open)
  const [candidate, setCandidate] = useState(null) // ไฟล์ที่ตรวจผ่าน รอยืนยัน (แสดงเมื่อ open)
  const message = notice?.section === 'backup' ? notice : null
  const setMessage = (kind, key) => onNotice({ section: 'backup', kind, key })

  function save() {
    onClose()
    downloadText(JSON.stringify(createBackup(progress, reviewQueue), null, 2), backupFileName(todayKey()))
    setMessage('ok', 'settings.backupSaved')
  }

  async function readFile(event) {
    const file = event.target.files?.[0]
    event.target.value = '' // เลือกไฟล์เดิมซ้ำได้
    if (!file) return
    onClose()
    onNotice(null)
    if (file.size > MAX_BACKUP_BYTES) return setMessage('error', 'settings.restoreInvalid')
    let text
    try {
      text = await file.text()
    } catch {
      return setMessage('error', 'settings.restoreInvalid')
    }
    const result = parseBackup(text, INITIAL_PROGRESS, todayKey())
    if (!result.ok) return setMessage('error', result.error === 'newer' ? 'settings.restoreNewer' : 'settings.restoreInvalid')
    setCandidate(result)
    return onOpen()
  }

  function restore() {
    progress.restoreProgress(candidate.progress)
    useReviewStore.getState().restoreReview(candidate.reviewQueue)
    onClose()
    setMessage('ok', 'settings.restoreDone')
  }

  return (
    <Section card title={t('settings.backup')} description={t('settings.backupHint')}>
      <div className={styles.actions}>
        <Button variant="secondary" icon={ICONS.download} onClick={save}>
          {t('settings.backupSave')}
        </Button>
        <Button ref={chooseRef} variant="secondary" icon={ICONS.upload} onClick={() => inputRef.current?.click()}>
          {t('settings.restoreChoose')}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          className={styles.file}
          aria-label={t('settings.restoreChoose')}
          tabIndex={-1}
          onChange={readFile}
        />
      </div>

      {open && candidate && (
        <ConfirmRestore candidate={candidate} now={summarize(progress, reviewQueue)} onConfirm={restore} onCancel={onClose} />
      )}

      <p role="status" className={message ? `${styles.message} ${styles[message.kind]}` : 'sr-only'}>
        {message ? t(message.key) : ''}
      </p>
    </Section>
  )
}
