// =========================================================
// ListenStoryStep — ขั้น "ฟังเรื่องเล่าจากภาพทั้งเรื่อง" (Stage 5 picture story, ส่วนที่ 4 ขั้น 1–3)
//   เปิดขั้น → เล่าทีละภาพอัตโนมัติ (ภาพใหญ่ + แถบภาพ 1-2-3) — ข้อความขึ้นหลังฟังภาพนั้นจบ (ฟังก่อน แล้วค่อยอ่าน)
//   ฟังครบแล้ว → แตะภาพในแถบเพื่อฟังทีละภาพ / ฟังทั้งเรื่องอีกครั้ง (ปกติ/ช้า) / ดูความหมาย → "ต่อไป"
// props: items (ภาพของเรื่อง เรียงตามลำดับ), stage, revealed / onReveal (จำการเปิดดูความหมายทั้งบท), onDone
// =========================================================
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import { useSpeech } from '../../hooks/useSpeech'
import { useSentenceDisplay } from '../../hooks/useSentenceDisplay'
import { lineSpeakKey, useLinePlayer } from '../../hooks/useLinePlayer'
import Picture from '../Picture'
import Button from '../Button'
import SentenceText from '../SentenceText'
import ThaiReading from '../ThaiReading'
import HiddenText from './HiddenText'
import LineButton from './LineButton'
import StoryStrip from './StoryStrip'
import PlayAllButtons from './PlayAllButtons'
import styles from './Step.module.css'

export default function ListenStoryStep({ items, stage, revealed, onReveal, onDone }) {
  const { t } = useTranslation()
  const { speak } = useSpeech()
  const display = useSentenceDisplay(stage, { revealed, onReveal })
  const { current, rate, playAll, stopAll } = useLinePlayer(items, { gapMs: 900 })
  const [selected, setSelected] = useState(0) // ภาพที่แสดงตอนไม่ได้เล่นอัตโนมัติ
  const [heard, setHeard] = useState(() => new Set()) // ภาพที่ฟังจบแล้ว (เห็นข้อความ)
  const [firstPassDone, setFirstPassDone] = useState(false)

  const markHeard = (index) => {
    setHeard((previous) => new Set(previous).add(index))
    setSelected(index)
  }

  // รอบแรก: เล่าทั้งเรื่องอัตโนมัติ
  useEffect(() => {
    let active = true
    playAll({ onLine: (index) => active && markHeard(index) }).finally(() => active && setFirstPassDone(true))
    return () => {
      active = false
    }
    // เล่นครั้งเดียวตอนเปิดขั้น
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const shown = current >= 0 ? current : selected
  const panel = items[shown]
  const textVisible = firstPassDone || heard.has(shown)

  // แตะภาพในแถบ → หยุดเล่าอัตโนมัติ แล้วฟังภาพนั้น
  function selectPanel(index) {
    stopAll()
    setSelected(index)
    speak(items[index].target, { key: lineSpeakKey(items[index]) }).finally(() => markHeard(index))
  }

  return (
    <div className={styles.step}>
      <p className={styles.instruction}>{t('story.listen')}</p>
      <StoryStrip items={items} current={shown} onSelect={selectPanel} />
      <Picture
        image={panel.image}
        size="fill"
        alt={t('story.panel', { n: shown + 1, total: items.length })}
        className={styles.picture}
      />
      <div className={styles.controls}>
        {textVisible ? (
          <SentenceText text={panel.target} stressWords={panel.stressWords} intonation={panel.intonation} size="lg" />
        ) : (
          <HiddenText />
        )}
        {textVisible && <LineButton text={panel.target} speakKey={lineSpeakKey(panel)} label={t('story.playPanel')} />}
      </div>
      {textVisible && display.readingVisible && <ThaiReading reading={panel.readingTh} />}
      {textVisible && display.meaningVisible && (
        <p className={styles.hint} lang="th">
          {panel.translationTh}
        </p>
      )}

      {firstPassDone ? (
        <PlayAllButtons label={t('story.playAll')} playingRate={rate} onPlay={(next) => playAll({ rate: next, onLine: markHeard })} onStop={stopAll} />
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
