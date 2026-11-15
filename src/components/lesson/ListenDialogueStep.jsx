// =========================================================
// ListenDialogueStep — ขั้น "ฟังบทสนทนาทั้งบท" (Stage 5, ส่วนที่ 4 ขั้น 1–3)
//   เปิดขั้น → เล่นทีละบรรทัดอัตโนมัติ: กล่องแชตขึ้นทีละกล่อง ระหว่างพูดเป็นคลื่นเสียง พูดจบแล้วค่อยเห็นข้อความ
//   (ฟังก่อน + เดาจากภาพ แล้วค่อยอ่าน) — ไม่อยากรอ กด "ดูข้อความทั้งหมด" ได้
//   ฟังรอบแรกจบ → ฟังทั้งบทอีกครั้ง (ปกติ/ช้า) หรือแตะลำโพงฟังทีละบรรทัด + ดูความหมาย → "ต่อไป"
// props: lesson (speakers, scene), items (บรรทัด), stage, revealed / onReveal (จำการเปิดดูความหมายทั้งบท), onDone
// =========================================================
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import { useLocalized } from '../../hooks/useLocalized'
import { useSentenceDisplay } from '../../hooks/useSentenceDisplay'
import { lineSpeakKey, useLinePlayer } from '../../hooks/useLinePlayer'
import { speakerOf } from '../../utils/lessonItems'
import { scrollIntoViewGently } from '../../utils/scroll'
import Picture from '../Picture'
import Button from '../Button'
import DialogueBubble from './DialogueBubble'
import PlayAllButtons from './PlayAllButtons'
import styles from './Step.module.css'

export default function ListenDialogueStep({ lesson, items, stage, revealed, onReveal, onDone }) {
  const { t } = useTranslation()
  const loc = useLocalized()
  const display = useSentenceDisplay(stage, { revealed, onReveal })
  const { current, rate, playAll, stopAll } = useLinePlayer(items)
  const [heardCount, setHeardCount] = useState(0) // ฟังจบแล้วกี่บรรทัด (ข้อความขึ้นเมื่อฟังจบ)
  const [firstPassDone, setFirstPassDone] = useState(false) // ฟังรอบแรกจบ (หรือข้าม/เล่นไม่ได้) → เห็นทุกบรรทัด
  const activeRef = useRef(null)
  const scene = loc(lesson, 'scene')
  const leftSpeaker = lesson.speakers?.[0]?.id

  // รอบแรก: เล่นทั้งบทอัตโนมัติ
  useEffect(() => {
    let active = true
    playAll({ onLine: (index) => active && setHeardCount(index + 1) }).finally(() => active && setFirstPassDone(true))
    return () => {
      active = false
    }
    // เล่นครั้งเดียวตอนเปิดขั้น
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // เลื่อนจอตามบรรทัดที่กำลังพูด
  useEffect(() => {
    if (current >= 0) scrollIntoViewGently(activeRef.current)
  }, [current])

  const visible = firstPassDone ? items.length : Math.max(1, heardCount, current + 1)

  return (
    <div className={styles.step}>
      <p className={styles.instruction}>{t('dialogue.listen')}</p>
      <Picture image={items[0]?.image} size="fill" alt={scene} className={styles.pictureSmall} />
      {scene && <p className={styles.sceneName}>{scene}</p>}

      <div className={styles.chat}>
        {items.slice(0, visible).map((line, index) => (
          <DialogueBubble
            key={line.id}
            ref={index === current ? activeRef : undefined}
            line={line}
            speakerName={loc(speakerOf(lesson, line), 'name')}
            side={line.speaker === leftSpeaker ? 'left' : 'right'}
            active={index === current}
            textHidden={!firstPassDone && index >= heardCount}
            display={display}
            details
            speakKey={lineSpeakKey(line)}
            canReplay={firstPassDone}
          />
        ))}
      </div>

      {firstPassDone ? (
        <PlayAllButtons label={t('dialogue.playAll')} playingRate={rate} onPlay={(next) => playAll({ rate: next })} onStop={stopAll} />
      ) : (
        <Button size="sm" variant="ghost" onClick={stopAll}>
          {t('dialogue.showAll')}
        </Button>
      )}
      {display.canRevealMeaning && (
        <Button size="sm" variant="secondary" icon={Languages} onClick={display.revealMeaning}>
          {t('card.showMeaning')}
        </Button>
      )}
      <div className={styles.actions}>
        <Button block size="lg" onClick={onDone} disabled={!firstPassDone}>
          {t('lesson.next')}
        </Button>
      </div>
    </div>
  )
}
