// =========================================================
// ListenContextStep — ขั้น "ฟังประโยคในบริบท" (Stage 5+, ส่วนที่ 4 ขั้น 1–3)
//   เปิดขั้น → เล่นประโยคให้ฟังเลย → ดูฉาก/ภาพ + ประโยค (คำลงเสียงหนัก, ทำนองเสียง, เสียงพูดเชื่อม, แบบอื่น)
//   ฟังช้า → ฟังปกติ ได้ไม่จำกัด แล้วกด "ต่อไป"
// props: item, stage, revealed / onReveal (จำการเปิดดูคำแปลทั้งบท), onDone
// =========================================================
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import { useSpeech } from '../../hooks/useSpeech'
import { useSentenceDisplay } from '../../hooks/useSentenceDisplay'
import Picture from '../Picture'
import SpeakButton from '../SpeakButton'
import Button from '../Button'
import ContextSentence from './ContextSentence'
import styles from './Step.module.css'

export default function ListenContextStep({ item, stage, revealed, onReveal, onDone }) {
  const { t } = useTranslation()
  const { speak } = useSpeech()
  const display = useSentenceDisplay(stage, { revealed, onReveal })
  const [heard, setHeard] = useState(false)
  const speakId = `${item.id}:context`

  useEffect(() => {
    let active = true
    speak(item.target, { key: `${speakId}:normal` }).finally(() => active && setHeard(true))
    return () => {
      active = false
    }
    // เล่นใหม่เฉพาะเมื่อเปลี่ยนข้อ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id])

  return (
    <div className={styles.step}>
      <p className={styles.instruction}>{t('lesson.listenContext')}</p>
      <Picture image={item.image} size="fill" alt={item.target} className={styles.pictureSmall} />
      <ContextSentence item={item} display={display} />
      {display.canRevealMeaning && (
        <Button size="sm" variant="secondary" icon={Languages} onClick={display.revealMeaning}>
          {t('card.showMeaning')}
        </Button>
      )}
      <SpeakButton text={item.target} id={speakId} />
      <div className={styles.actions}>
        <Button block size="lg" onClick={onDone} disabled={!heard}>
          {t('lesson.next')}
        </Button>
      </div>
    </div>
  )
}
