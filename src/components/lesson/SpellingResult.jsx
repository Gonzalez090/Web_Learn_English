// =========================================================
// SpellingResult — ผลตรวจงานเขียนแบบมีคำตอบตายตัว (ฟังแล้วพิมพ์ / เติมคำ / เรียงคำ)
//   ผ่าน: ✓ + คำชม  |  ผ่านแบบสะกดตามเสียง: ✓ + "ใกล้แล้ว!"  |  ยังไม่ผ่าน: ↻ + คำให้กำลังใจ (ไม่ใช้คำว่า "ผิด")
//   "คุณเขียน:" คำที่เขียนระบายสีรายคำ (ถูก = เขียว / ใกล้แล้ว = ส้มเส้นหยัก / ยังไม่ใช่ = แดงขีดเส้นใต้ / คำเกิน = ขีดฆ่า)
//   "ที่ถูก:" คำตอบที่ถูก (คำที่ต้องแก้เป็นตัวหนา) + ปุ่มฟัง = ทวนกลับแบบงานเขียน (recast)
//   + คำแนะนำเบา ๆ: ตัวพิมพ์ใหญ่ต้นประโยค / จุดท้ายประโยค / ' ในรูปย่อ
// props: result ({ passed, close, written: [{ text, status }], tips }), answer (คำ/ประโยคที่ถูก),
//        highlight (คำในคำตอบที่ต้องเน้น — ตามที่เขียนในคำตอบ), attempt, speakId, showWritten
// =========================================================
import { useTranslation } from 'react-i18next'
import { CircleCheck, MessageCircleHeart, RotateCcw } from 'lucide-react'
import { cleanWord } from '../../utils/spelling'
import LineButton from './LineButton'
import styles from './SpellingResult.module.css'

const pick = (messages, attempt) => (Array.isArray(messages) ? messages[attempt % messages.length] : messages)

function headlineKey(result) {
  if (result.passed) return result.close ? 'write.closePass' : 'write.praise'
  return result.close ? 'write.closeRetry' : 'write.encourage'
}

export default function SpellingResult({ result, answer, highlight = [], attempt = 0, speakId, showWritten = true }) {
  const { t } = useTranslation()
  if (!result) return null

  const Icon = result.passed ? CircleCheck : RotateCcw
  const message = pick(t(headlineKey(result), { returnObjects: true }), attempt)
  const marked = new Set(highlight.map(cleanWord))
  const perfect = result.passed && !result.close

  return (
    <div className={`${styles.box} ${result.passed ? styles.passed : styles.retry}`} role="status">
      <p className={styles.headline}>
        <Icon className={styles.icon} aria-hidden="true" />
        <span>{message}</span>
      </p>

      {showWritten && !perfect && result.written?.length > 0 && (
        <p className={styles.row}>
          <span className={styles.label}>{t('write.youWrote')}</span>
          <span className={styles.words} lang="en">
            {result.written.map((word, index) => (
              <span key={index} className={styles[word.status]}>
                {word.text}
              </span>
            ))}
          </span>
        </p>
      )}

      <div className={styles.answer}>
        {!perfect && <MessageCircleHeart className={styles.answerIcon} aria-hidden="true" />}
        <p className={styles.row}>
          {!perfect && <span className={styles.label}>{t('write.answer')}</span>}
          <span className={styles.words} lang="en">
            {String(answer)
              .split(/\s+/)
              .filter(Boolean)
              .map((word, index) => (
                <span key={index} className={marked.has(cleanWord(word)) ? styles.fix : undefined}>
                  {word}
                </span>
              ))}
          </span>
        </p>
        <LineButton text={answer} speakKey={`${speakId}:answer`} label={t('write.hearAnswer')} />
      </div>

      {result.tips?.length > 0 && (
        <ul className={styles.tips}>
          {result.tips.map((tip) => (
            <li key={tip}>{t(`write.tip.${tip}`)}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
