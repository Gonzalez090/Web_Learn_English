// =========================================================
// ListenRhymeStep — ขั้น "ฟังคำคล้องจองทั้งเพลง" (Stage 5 — ฝึกจังหวะและเสียงท้ายคำ)
//   ภาพ + ทุกบรรทัด (คำลงเสียงหนัก) — คำท้ายที่คล้องจองกันระบายสีเดียวกัน (bed – head, three – me)
//   เปิดขั้น → ร้องทีละบรรทัดอัตโนมัติ บรรทัดที่กำลังร้องมีแถบเน้น
//   → ฟังทั้งเพลงอีกครั้ง (ปกติ/ช้า) / แตะลำโพงฟังทีละบรรทัด / ดูความหมาย → "ต่อไป"
// props: lesson (title), items (บรรทัด เรียงตามเพลง — คู่ละ 2 บรรทัดแบบ AABB), stage, revealed / onReveal, onDone
// =========================================================
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import { useLocalized } from '../../hooks/useLocalized'
import { useSentenceDisplay } from '../../hooks/useSentenceDisplay'
import { lineSpeakKey, useLinePlayer } from '../../hooks/useLinePlayer'
import { coupletOf } from '../../utils/lessonItems'
import Picture from '../Picture'
import Button from '../Button'
import SentenceText from '../SentenceText'
import ThaiReading from '../ThaiReading'
import LineButton from './LineButton'
import PlayAllButtons from './PlayAllButtons'
import styles from './Step.module.css'
import rhymeStyles from './ListenRhymeStep.module.css'

export default function ListenRhymeStep({ lesson, items, stage, revealed, onReveal, onDone }) {
  const { t } = useTranslation()
  const loc = useLocalized()
  const display = useSentenceDisplay(stage, { revealed, onReveal })
  const { current, rate, playAll, stopAll } = useLinePlayer(items, { gapMs: 250 })
  const [firstPassDone, setFirstPassDone] = useState(false)

  // รอบแรก: ร้องทั้งเพลงอัตโนมัติ
  useEffect(() => {
    let active = true
    playAll().finally(() => active && setFirstPassDone(true))
    return () => {
      active = false
    }
    // เล่นครั้งเดียวตอนเปิดขั้น
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={styles.step}>
      <p className={styles.instruction}>{t('rhyme.listen')}</p>
      <Picture image={items[0]?.image} size="fill" alt={loc(lesson, 'title')} className={styles.pictureSmall} />

      <ol className={rhymeStyles.lines}>
        {items.map((line, index) => {
          const classes = [
            rhymeStyles.line,
            coupletOf(index) % 2 === 0 ? rhymeStyles.coupletA : rhymeStyles.coupletB,
            index === current && rhymeStyles.active,
          ]
          return (
            <li key={line.id} className={classes.filter(Boolean).join(' ')}>
              <LineButton text={line.target} speakKey={lineSpeakKey(line)} label={t('rhyme.playLine', { n: index + 1 })} />
              <div className={rhymeStyles.text}>
                <SentenceText
                  text={line.target}
                  stressWords={line.stressWords}
                  intonation={line.intonation}
                  lastWordClassName={rhymeStyles.rhymeWord}
                  align="start"
                />
                {display.readingVisible && <ThaiReading reading={line.readingTh} />}
                {display.meaningVisible && (
                  <p className={rhymeStyles.meaning} lang="th">
                    {line.translationTh}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
      <p className={styles.hint}>{t('rhyme.listenHint')}</p>

      {firstPassDone && (
        <PlayAllButtons label={t('rhyme.playAll')} playingRate={rate} onPlay={(next) => playAll({ rate: next })} onStop={stopAll} />
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
