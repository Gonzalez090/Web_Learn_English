// =========================================================
// HiddenText — ข้อความยังซ่อนอยู่ → แสดงคลื่นเสียงแทนตัวอักษร (รู้ว่ามีคนพูด แต่ไม่บอกคำ)
// ใช้ในกล่องถาม-ตอบ (Stage 4) และกล่องบทสนทนาตอนฟังรอบแรก (ฟังก่อน แล้วค่อยเห็นข้อความ)
// props: label (ข้อความสำหรับโปรแกรมอ่านหน้าจอ — ค่าเริ่มต้น "ข้อความซ่อนอยู่ ฟังเสียงก่อน")
// =========================================================
import { useTranslation } from 'react-i18next'
import { AudioLines } from 'lucide-react'
import styles from './HiddenText.module.css'

export default function HiddenText({ label }) {
  const { t } = useTranslation()
  return (
    <span className={styles.hidden} role="img" aria-label={label ?? t('lesson.textHidden')}>
      <AudioLines className={styles.icon} aria-hidden="true" />
    </span>
  )
}
