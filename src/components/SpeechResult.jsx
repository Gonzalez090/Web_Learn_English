// =========================================================
// SpeechResult — ผลการพูดตาม
//   ผ่าน: ✓ + คำชม   |   ยังไม่ผ่าน: ↻ + คำให้กำลังใจ (ไม่ใช้คำว่า "ผิด")
//   + เปอร์เซ็นต์ความถูกต้อง
//   + คำเป้าหมายรายคำ (คำที่พูดไม่ตรงเป็นสีแดง, ใกล้เคียงเป็นสีส้ม)   ← เฉพาะ Stage ที่แสดงตัวอักษรได้
//   + "ระบบได้ยินว่า …"                                              ← เฉพาะ Stage ที่แสดงตัวอักษรได้
// Stage 1–3 ห้ามแสดงตัวอักษรภาษาอังกฤษ → showText = false จะแสดงแค่ไอคอน + คำชม + เปอร์เซ็นต์
// =========================================================
import { useTranslation } from 'react-i18next'
import { CircleCheck, RotateCcw } from 'lucide-react'
import styles from './SpeechResult.module.css'

export default function SpeechResult({ result, attempt = 0, showText = true }) {
  const { t } = useTranslation()
  if (!result) return null

  // เลือกข้อความชม/ให้กำลังใจ หมุนเวียนตามจำนวนครั้งที่ลอง (ไม่สุ่มตอน render)
  const messages = t(result.passed ? 'mic.praise' : 'mic.encourage', { returnObjects: true })
  const message = Array.isArray(messages) ? messages[attempt % messages.length] : messages
  const Icon = result.passed ? CircleCheck : RotateCcw

  return (
    <div className={`${styles.box} ${result.passed ? styles.passed : styles.retry}`} role="status">
      <p className={styles.headline}>
        <Icon className={styles.icon} aria-hidden="true" />
        <span>{message}</span>
        <span className={styles.score}>{t('mic.score', { score: result.score })}</span>
      </p>

      {showText && result.words.length > 0 && (
        <p className={styles.words} lang="en">
          {result.words.map((word, index) => (
            <span key={index} className={styles[word.status]}>
              {word.text}
            </span>
          ))}
        </p>
      )}

      {showText && result.heard && (
        <p className={styles.heard}>
          {t('mic.heard')}{' '}
          <span lang="en" className={styles.heardText}>
            {result.heard}
          </span>
        </p>
      )}
    </div>
  )
}
