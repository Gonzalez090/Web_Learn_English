// =========================================================
// LockedNotice — แจ้งว่า Stage นี้ยังล็อกอยู่ (ต้องเรียน Stage ก่อนหน้าให้จบก่อน)
// =========================================================
import { useTranslation } from 'react-i18next'
import { ICONS } from '../utils/icons'
import Button from './Button'
import styles from './LockedNotice.module.css'

export default function LockedNotice({ stageId }) {
  const { t } = useTranslation()
  const LockIcon = ICONS.locked

  return (
    <div className={styles.box} role="note">
      <LockIcon className={styles.icon} aria-hidden="true" />
      <p className={styles.title}>{t('locked.title')}</p>
      <p className={styles.text}>{t('locked.text', { n: stageId - 1 })}</p>
      <Button to="/learn" variant="secondary">
        {t('locked.back')}
      </Button>
    </div>
  )
}
