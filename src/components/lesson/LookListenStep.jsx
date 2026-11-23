// =========================================================
// LookListenStep — ขั้น "ดูภาพแล้วฟัง" (ส่วนที่ 4 ขั้น 1 + 3)
// - เปิดขั้นนี้ → เล่นประโยคแบบพ่อแม่คุยกับลูก (parentese) ให้อัตโนมัติ
// - ฟังซ้ำได้ ทั้งปกติและช้า แล้วกด "ต่อไป"
// - ไม่แสดงตัวอักษรภาษาอังกฤษ (Stage 1–3)
// =========================================================
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSpeech } from '../../hooks/useSpeech'
import Picture from '../Picture'
import SpeakButton from '../SpeakButton'
import Button from '../Button'
import styles from './Step.module.css'

export default function LookListenStep({ item, onDone }) {
  const { t } = useTranslation()
  const { speak, defaultRate } = useSpeech()
  const [heard, setHeard] = useState(false)
  const lines = item.parentese?.length ? item.parentese : [item.target ?? item.word]
  const buttonId = `${item.id}:look`

  // เปิดขั้น → เล่นเสียงให้เลย (ถ้าเบราว์เซอร์ไม่ยอมเล่นอัตโนมัติ ผู้ใช้กดปุ่มฟังเองได้)
  useEffect(() => {
    let active = true
    speak(lines, { key: `${buttonId}:${defaultRate}` }).finally(() => active && setHeard(true))
    return () => {
      active = false
    }
    // เล่นใหม่เฉพาะเมื่อเปลี่ยนข้อ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id])

  return (
    <div className={styles.step}>
      <p className={styles.instruction}>{t('lesson.lookListen')}</p>
      <Picture image={item.image} size="fill" className={styles.picture} />
      <SpeakButton text={lines} id={buttonId} />
      <div className={styles.actions}>
        <Button block size="lg" onClick={onDone} disabled={!heard}>
          {t('lesson.next')}
        </Button>
      </div>
    </div>
  )
}
