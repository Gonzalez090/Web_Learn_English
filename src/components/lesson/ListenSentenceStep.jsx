// =========================================================
// ListenSentenceStep — ขั้น "ฟังประโยค" ของ Stage 4 (ส่วนที่ 4 ขั้น 1–3)
//   1) เปิดขั้น → เล่นคำถาม + คำตอบให้ฟังเลย (ยังไม่โชว์ข้อความ) ให้เดาความหมายจากภาพ
//   2) แตะ "ดูข้อความ" → โชว์ข้อความ (+ คำอ่าน/คำแปลไทย ตามตั้งค่า)
//   3) ฟังช้า → ฟังปกติ ได้ไม่จำกัด แล้วกด "ต่อไป"
// props:
//   item, stage
//   revealed      ข้อนี้เคยกดเปิดอะไรไปแล้ว { text, meaning } (จำไว้ทั้งบท)
//   onReveal      เรียกเมื่อกด "ดูข้อความ" ('text') / "ดูความหมาย" ('meaning')
//   onDone        ไปขั้นถัดไป
// =========================================================
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSpeech } from '../../hooks/useSpeech'
import { useSentenceDisplay } from '../../hooks/useSentenceDisplay'
import Picture from '../Picture'
import SpeakButton from '../SpeakButton'
import Button from '../Button'
import Exchange from './Exchange'
import styles from './Step.module.css'

export default function ListenSentenceStep({ item, stage, revealed, onReveal, onDone }) {
  const { t } = useTranslation()
  const { speak } = useSpeech()
  const display = useSentenceDisplay(stage, { revealed, onReveal })
  const [heard, setHeard] = useState(false)
  const idPrefix = `${item.id}:listen`

  // เปิดขั้น → พ่อแม่ถาม แล้วตอบให้ฟัง (ถ้าเบราว์เซอร์ไม่ยอมเล่นอัตโนมัติ ผู้ใช้กดปุ่มฟังเองได้)
  useEffect(() => {
    let active = true
    const lines = [item.question, item.target].filter(Boolean)
    speak(lines, { key: `${idPrefix}:exchange:normal` }).finally(() => active && setHeard(true))
    return () => {
      active = false
    }
    // เล่นใหม่เฉพาะเมื่อเปลี่ยนข้อ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id])

  return (
    <div className={styles.step}>
      <p className={styles.instruction}>{t('lesson.listenGuess')}</p>
      <Picture image={item.image} size="fill" alt={display.textVisible ? item.target : ''} className={styles.pictureSmall} />
      <Exchange item={item} display={display} idPrefix={idPrefix} />
      <SpeakButton text={item.target} id={`${idPrefix}:target`} />
      <div className={styles.actions}>
        <Button block size="lg" onClick={onDone} disabled={!heard}>
          {t('lesson.next')}
        </Button>
      </div>
    </div>
  )
}
