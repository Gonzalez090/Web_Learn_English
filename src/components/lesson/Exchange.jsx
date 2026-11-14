// =========================================================
// Exchange — บทถาม-ตอบสั้น ๆ ของ Stage 4 แบบกล่องแชต: พ่อแม่ถาม (ซ้าย) → เราตอบ (ขวา)
//   - ข้อความภาษาอังกฤษแสดงตาม display.textVisible (Stage 4 ซ่อนไว้ กด "ดูข้อความ")
//     ซ่อนอยู่ → แสดงไอคอนคลื่นเสียงแทน (รู้ว่ามีคนพูด แต่ไม่บอกคำ)
//   - คำตอบ: เน้นคำที่ลงเสียงหนัก + ลูกศรทำนองเสียง (SentenceText) + คำอ่านไทย (ตามตั้งค่า)
//   - คำแปลไทยแสดงเมื่อเปิดดู (หรือตั้งค่าให้แสดงเลย)
//   - ปุ่มลำโพงในกล่องคำถาม ฟังคำถามซ้ำ (คำตอบมีปุ่มฟัง ปกติ/ช้า ใต้กล่องในแต่ละขั้นอยู่แล้ว)
// props:
//   item     ข้อในบทเรียน (question, questionTh, target, translationTh, readingTh, stressWords, intonation)
//   display  ผลจาก useSentenceDisplay
//   parts    'both' (ถาม + ตอบ) | 'answer' (ตอบอย่างเดียว) | 'ownTurn' (ถาม + กล่อง "ตาเรา" ไม่บอกคำตอบ)
//   idPrefix รหัสของปุ่มเสียง (ไม่ซ้ำกันในหน้า)
// =========================================================
import { useTranslation } from 'react-i18next'
import { AudioLines, Eye, Languages, Mic, Square, Volume2 } from 'lucide-react'
import { useSpeech } from '../../hooks/useSpeech'
import { abortListening } from '../../utils/recognition'
import SentenceText from '../SentenceText'
import ThaiReading from '../ThaiReading'
import styles from './Exchange.module.css'

// ปุ่มลำโพงเล็ก ๆ ฟังบรรทัดเดียว (กดซ้ำตอนเล่นอยู่ = หยุด)
function LineButton({ text, speakKey, label }) {
  const { t } = useTranslation()
  const { speak, stop, speakingKey } = useSpeech()
  const playing = speakingKey === speakKey
  const Icon = playing ? Square : Volume2
  return (
    <button
      type="button"
      className={playing ? `${styles.lineButton} ${styles.playing}` : styles.lineButton}
      aria-label={playing ? t('speech.stop') : label}
      aria-pressed={playing}
      onClick={() => {
        if (playing) return stop()
        abortListening() // กำลังฟังไมค์อยู่ → หยุดก่อน ไม่ให้ไมค์ได้ยินเสียงตัวอย่าง
        return speak(text, { key: speakKey })
      }}
    >
      <Icon className={styles.lineIcon} aria-hidden="true" />
    </button>
  )
}

// ข้อความถูกซ่อน → คลื่นเสียงแทนตัวอักษร
function HiddenText() {
  const { t } = useTranslation()
  return (
    <span className={styles.hidden} role="img" aria-label={t('lesson.textHidden')}>
      <AudioLines className={styles.hiddenIcon} aria-hidden="true" />
    </span>
  )
}

export default function Exchange({ item, display, parts = 'both', idPrefix }) {
  const { t } = useTranslation()
  const showQuestion = parts !== 'answer' && Boolean(item.question)

  return (
    <div className={styles.exchange}>
      {showQuestion && (
        <div className={`${styles.row} ${styles.questionRow}`} role="group" aria-label={t('lesson.question')}>
          <LineButton text={item.question} speakKey={`${idPrefix}:question:normal`} label={t('lesson.playQuestion')} />
          <div className={`${styles.bubble} ${styles.question}`}>
            {display.textVisible ? (
              <p className={styles.questionText} lang="en">
                {item.question}
              </p>
            ) : (
              <HiddenText />
            )}
            {display.meaningVisible && item.questionTh && (
              <p className={styles.meaning} lang="th">
                {item.questionTh}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ประโยคในบริบท (ไม่มีคำถามของพ่อแม่) รอบใช้เอง → บอกความหมายไทยเป็นโจทย์ ให้พูดเป็นภาษาอังกฤษเอง */}
      {parts === 'ownTurn' && !item.question && item.translationTh && (
        <div className={`${styles.row} ${styles.questionRow}`} role="group" aria-label={t('lesson.sayInEnglish')}>
          <div className={`${styles.bubble} ${styles.question}`}>
            <p className={styles.meaning}>{t('lesson.sayInEnglish')}</p>
            <p className={styles.questionText} lang="th">
              {item.translationTh}
            </p>
          </div>
        </div>
      )}

      <div className={`${styles.row} ${styles.answerRow}`} role="group" aria-label={t('lesson.answer')}>
        {parts === 'ownTurn' ? (
          <div className={`${styles.bubble} ${styles.answer} ${styles.yourTurn}`}>
            <Mic className={styles.yourTurnIcon} aria-hidden="true" />
            <span>{t('lesson.yourTurn')}</span>
          </div>
        ) : (
          // ปุ่มฟังคำตอบ (ปกติ/ช้า) อยู่ใต้กล่องนี้ในแต่ละขั้นแล้ว
          <div className={`${styles.bubble} ${styles.answer}`}>
            {display.textVisible ? (
              <SentenceText text={item.target} stressWords={item.stressWords} intonation={item.intonation} />
            ) : (
              <HiddenText />
            )}
            {display.readingVisible && <ThaiReading reading={item.readingTh} />}
            {display.meaningVisible && (
              <p className={styles.meaning} lang="th">
                {item.translationTh}
              </p>
            )}
          </div>
        )}
      </div>

      {(display.canRevealText || display.canRevealMeaning) && (
        <div className={styles.reveals}>
          {display.canRevealText && (
            <button type="button" className={styles.reveal} onClick={display.revealText}>
              <Eye className={styles.revealIcon} aria-hidden="true" />
              {t('lesson.showText')}
            </button>
          )}
          {display.canRevealMeaning && (
            <button type="button" className={styles.reveal} onClick={display.revealMeaning}>
              <Languages className={styles.revealIcon} aria-hidden="true" />
              {t('card.showMeaning')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
