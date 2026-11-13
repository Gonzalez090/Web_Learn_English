// =========================================================
// ComingSoon — กล่องบอกว่า "ส่วนนี้จะเปิดในขั้นที่ N"
// ใช้ระหว่างพัฒนาทีละขั้น จะถูกแทนด้วยของจริงในขั้นนั้น ๆ
// =========================================================
import { useTranslation } from 'react-i18next'
import { ICONS } from '../utils/icons'
import styles from './ComingSoon.module.css'

export default function ComingSoon({ step }) {
  const { t } = useTranslation()
  const Icon = ICONS.soon

  return (
    <div className={styles.box} role="note">
      <Icon className={styles.icon} aria-hidden="true" />
      <p>{t('common.comingSoon', { step })}</p>
    </div>
  )
}
