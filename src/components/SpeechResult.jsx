// =========================================================
// SpeechResult — ผลการพูดตาม
//   ผ่าน: ✓ + คำชม   |   ยังไม่ผ่าน: ↻ + คำให้กำลังใจ (ไม่ใช้คำว่า "ผิด")
//   + เปอร์เซ็นต์ความถูกต้อง
//   + คำเป้าหมายรายคำ (คำที่พูดไม่ตรงเป็นสีแดง, ใกล้เคียงเป็นสีส้ม)   ← เฉพาะ Stage ที่แสดงตัวอักษรได้
//   + "ระบบได้ยินว่า …"                                              ← เฉพาะ Stage ที่แสดงตัวอักษรได้
//   + กล่องทวนกลับ (recast, Stage 4+): "Yes! He goes to school." + ปุ่มฟังซ้ำ ปกติ/ช้า
//     (ข้อความซ่อนอยู่ → บอกให้ฟังประโยคที่ถูกแทน ไม่โชว์ตัวอักษร)
// Stage 1–3 ห้ามแสดงตัวอักษรภาษาอังกฤษ → showText = false จะแสดงแค่ไอคอน + คำชม + เปอร์เซ็นต์
// =========================================================
import { useTranslation } from 'react-i18next'
import { CircleCheck, MessageCircleHeart, RotateCcw } from 'lucide-react'
import SpeakButton from './SpeakButton'
import styles from './SpeechResult.module.css'

// เลือกข้อความหมุนเวียนตามจำนวนครั้งที่ลอง (ไม่สุ่มตอน render)
const pick = (messages, attempt) => (Array.isArray(messages) ? messages[attempt % messages.length] : messages)

// showWords = false → ไม่แสดงคำเป้าหมายรายคำ (เช่น เกมคาราโอเกะระบายสีบนบรรทัดของเกมแล้ว)
// wordsLabel = ป้ายหน้าแถวคำ (เช่น "คำสำคัญ:" ตอนเล่าเรื่องเอง — แถวคำเป็นคำสำคัญ ไม่ใช่ทั้งประโยค)
export default function SpeechResult({
  result,
  attempt = 0,
  showText = true,
  showWords = true,
  speakId = 'result',
  wordsLabel,
}) {
  const { t, i18n } = useTranslation()
  if (!result) return null

  // ตรงรูปแบบผิดที่พบบ่อย = สื่อความหมายได้แล้ว → ชมก่อนแล้วชวนพูดแบบเจ้าของภาษา
  const messageKey = result.passed ? 'mic.praise' : result.recast?.kind === 'error' ? 'mic.recastPraise' : 'mic.encourage'
  const message = pick(t(messageKey, { returnObjects: true }), attempt)
  const Icon = result.passed ? CircleCheck : RotateCcw

  return (
    <div className={`${styles.box} ${result.passed ? styles.passed : styles.retry}`} role="status">
      <p className={styles.headline}>
        <Icon className={styles.icon} aria-hidden="true" />
        <span>{message}</span>
        <span className={styles.score}>{t('mic.score', { score: result.score })}</span>
      </p>

      {showText && showWords && result.words.length > 0 && (
        <p className={styles.words} lang="en">
          {wordsLabel && (
            <span className={styles.wordsLabel} lang={i18n.language}>
              {wordsLabel}
            </span>
          )}
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

      {result.recast && (
        <div className={styles.recast}>
          <p className={styles.recastLine}>
            <MessageCircleHeart className={styles.recastIcon} aria-hidden="true" />
            {showText ? (
              <span lang="en">
                <strong>{result.recast.opener}</strong> {result.recast.correct}
              </span>
            ) : (
              <span>{t('mic.recastListen')}</span>
            )}
          </p>
          <SpeakButton text={result.recast.lines} id={`${speakId}:recast`} size="sm" />
          <p className={styles.recastHint}>{t('mic.recastTryAgain')}</p>
        </div>
      )}
    </div>
  )
}
