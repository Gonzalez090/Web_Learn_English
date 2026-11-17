// =========================================================
// PhraseCard — การ์ดวลีในคลังวลีใช้งานจริง (ส่วนที่ 5)
//   วลี + ปุ่มฟัง ปกติ/ช้า → คำอ่านไทย (ปิดได้ในตั้งค่า) → ความหมายไทย → ป้าย register / frequency
//   → หมายเหตุว่าใช้กับใคร (สแลง) → ประโยคตัวอย่าง 2 ประโยค (ฟังทีละประโยค + คำแปล)
//   → "คนไทยมักพูดว่า …" แล้วบอกแบบที่เจ้าของภาษาพูด (ไม่ใช้คำว่า "ผิด" / ไม่เล่นเสียงประโยคที่ผิด)
//   → ปุ่มพูดตาม: ผ่านครั้งแรกในการ์ดนี้ → onSpeakPass (ได้ XP + ภารกิจ "ฝึกวลี")
// คลังวลีเป็นภาษาของผู้ใหญ่ (โหมดเมือง) → แสดงข้อความ/ความหมายเลย ไม่ต้องกดเปิด
// props: phrase, onSpeakPass(phrase)
// =========================================================
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Lightbulb, MessageCircleWarning } from 'lucide-react'
import { useSettingsStore } from '../store/settingsStore'
import SpeakButton from './SpeakButton'
import MicButton from './MicButton'
import ThaiReading from './ThaiReading'
import LineButton from './lesson/LineButton'
import styles from './PhraseCard.module.css'

export default function PhraseCard({ phrase, onSpeakPass }) {
  const { t } = useTranslation()
  const thaiReading = useSettingsStore((state) => state.thaiReading)
  const passedRef = useRef(false)

  function handleResult(result) {
    if (!result.passed || passedRef.current) return
    passedRef.current = true
    onSpeakPass?.(phrase)
  }

  return (
    <article className={styles.card}>
      <p className={styles.text} lang="en">
        {phrase.text}
      </p>
      {thaiReading !== 'off' && <ThaiReading reading={phrase.readingTh} />}
      <p className={styles.meaning} lang="th">
        {phrase.meaningTh}
      </p>
      <p className={styles.tags}>
        <span className={styles.tag}>{t(`register.${phrase.register}`)}</span>
        <span className={styles.tag}>{t(`frequency.${phrase.frequency}`)}</span>
      </p>

      <div className={styles.actions}>
        <SpeakButton text={phrase.text} id={phrase.id} size="sm" />
        <MicButton target={phrase.text} speakId={`${phrase.id}:mic`} onResult={handleResult} size="sm" />
      </div>

      {phrase.noteTh && (
        <p className={styles.note} lang="th">
          <Lightbulb className={styles.noteIcon} aria-hidden="true" />
          {phrase.noteTh}
        </p>
      )}

      <div className={styles.examples}>
        <p className={styles.label}>{t('phrases.examples')}</p>
        <ul className={styles.exampleList}>
          {phrase.examples.map((example, index) => (
            <li key={example.text} className={styles.example}>
              <span className={styles.exampleText}>
                <span lang="en">{example.text}</span>
                <span className={styles.exampleMeaning} lang="th">
                  {example.translationTh}
                </span>
              </span>
              <LineButton text={example.text} speakKey={`${phrase.id}:ex${index}`} label={t('phrases.hearExample')} />
            </li>
          ))}
        </ul>
      </div>

      {phrase.thaiMistake && (
        <div className={styles.mistake}>
          <p className={styles.label}>
            <MessageCircleWarning className={styles.noteIcon} aria-hidden="true" />
            {t('phrases.thaiMistake')}
          </p>
          <p className={styles.mistakeRow}>
            <span className={styles.wrong} lang="en">
              {phrase.thaiMistake.wrong}
            </span>
            <ArrowRight className={styles.arrow} aria-label={t('phrases.saySo')} />
            <span className={styles.right} lang="en">
              {phrase.thaiMistake.right}
            </span>
          </p>
          <p className={styles.mistakeNote} lang="th">
            {phrase.thaiMistake.noteTh}
          </p>
        </div>
      )}
    </article>
  )
}
