// =========================================================
// DeleteAccountSection — ลบบัญชีและข้อมูลบนเซิร์ฟเวอร์ (ท้ายหน้าโปรไฟล์, ขั้นที่ 31) — แสดงเฉพาะตอนล็อกอิน
//   ยืนยันก่อนเสมอ ย้อนไม่ได้ — ความคืบหน้าในเครื่องนี้ยังอยู่ (กลายเป็นแบบไม่ล็อกอิน)
// =========================================================
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { deleteAccount, useAccountStore } from '../store/accountStore'
import { ICONS } from '../utils/icons'
import Section from './Section'
import Button from './Button'
import { useReturnFocus } from './settings/useReturnFocus'
import styles from './settings/DataSections.module.css'

function ConfirmDelete({ onDone, onCancel }) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)
  const boxRef = useRef(null)

  useEffect(() => {
    boxRef.current?.focus()
  }, [])

  return (
    <div ref={boxRef} className={styles.confirm} role="group" tabIndex={-1} aria-label={t('account.deleteConfirm')}>
      <p className={styles.confirmTitle}>{t('account.deleteConfirm')}</p>
      <p className={styles.note}>{t('account.deleteWarning')}</p>
      <div className={styles.actions}>
        <Button
          variant="danger"
          icon={ICONS.delete}
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            onDone(await deleteAccount())
          }}
        >
          {t('account.deleteYes')}
        </Button>
        <Button variant="ghost" disabled={busy} onClick={onCancel}>
          {t('settings.cancel')}
        </Button>
      </div>
    </div>
  )
}

export default function DeleteAccountSection() {
  const { t } = useTranslation()
  const user = useAccountStore((state) => state.user)
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState(null) // { kind: 'ok' | 'error', key }
  const startRef = useReturnFocus(open)

  // ลบเสร็จ = ไม่มีบัญชีแล้ว → เหลือแค่ข้อความบอกผล
  if (!user && !message) return null

  return (
    <Section card title={t('account.delete')} description={user ? t('account.deleteHint') : undefined}>
      {user &&
        (open ? (
          <ConfirmDelete
            onCancel={() => setOpen(false)}
            onDone={(ok) => {
              setOpen(false)
              setMessage({ kind: ok ? 'ok' : 'error', key: ok ? 'account.deleteDone' : 'account.deleteFailed' })
            }}
          />
        ) : (
          <div className={styles.actions}>
            <Button
              ref={startRef}
              variant="danger"
              icon={ICONS.delete}
              onClick={() => {
                setMessage(null)
                setOpen(true)
              }}
            >
              {t('account.delete')}
            </Button>
          </div>
        ))}
      <p role="status" className={message ? `${styles.message} ${styles[message.kind]}` : 'sr-only'}>
        {message ? t(message.key) : ''}
      </p>
    </Section>
  )
}
