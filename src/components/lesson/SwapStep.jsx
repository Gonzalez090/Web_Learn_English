// =========================================================
// SwapStep — ขั้น "สลับคำในบริบท" (ส่วนที่ 4 ขั้น 5) ใช้กับ Stage 4 (ประโยคสั้น) และประโยคในบริบท (Stage 5+)
//   1) แตะคำที่ขีดเส้นประ → เลือกคำแทน → ฟังประโยคใหม่ (เปลี่ยนกี่ครั้งก็ได้)
//   2) (ไม่บังคับ) พูดประโยคใหม่ผ่านไมค์ → ผ่านได้ XP พูดตามเพิ่ม
//   3) สลับแล้วอย่างน้อย 1 ครั้ง → "ต่อไป"
// - ขั้นนี้เรียนรู้คำ → แสดงข้อความเสมอ (Stage 4 ที่ปกติซ่อนข้อความ ก็เห็นในขั้นนี้)
// - คำแปลไทยของประโยคเดิมกดดูได้ / ตอนสลับแล้วแสดงความหมายของคำใหม่แทน
// props: item, stage, revealed / onReveal (จำการเปิดดูคำแปลทั้งบท), onDone({ spoke })
// =========================================================
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import { useSentenceDisplay } from '../../hooks/useSentenceDisplay'
import Picture from '../Picture'
import SpeakButton from '../SpeakButton'
import MicButton from '../MicButton'
import Button from '../Button'
import { currentSentence } from '../../utils/swap'
import SwapSentence from './SwapSentence'
import styles from './Step.module.css'
import swapStyles from './SwapSentence.module.css'

export default function SwapStep({ item, stage, revealed, onReveal, onDone }) {
  const { t } = useTranslation()
  const display = useSentenceDisplay(stage, { revealed, onReveal })
  const [choice, setChoice] = useState(null)
  const [swaps, setSwaps] = useState(0)
  const [spoke, setSpoke] = useState(false)
  const text = currentSentence(item, choice)
  const speakId = `${item.id}:swap`
  const chosen = choice
    ? item.keywords.find((keyword) => keyword.word === choice.keyword)?.alternatives.find(
        (alternative) => alternative.word === choice.alternative,
      )
    : null

  function handleChoose(next) {
    setChoice(next)
    if (next) setSwaps((count) => count + 1)
  }

  return (
    <div className={styles.step}>
      <p className={styles.instruction}>{t('lesson.swapInstruction')}</p>
      <Picture image={item.image} size="fill" alt={item.target} className={styles.pictureSmall} />
      <SwapSentence item={item} choice={choice} onChoose={handleChoose} speakKey={`${speakId}:normal`} />

      {chosen ? (
        <p className={swapStyles.meaning} lang="th">
          {t('swap.meaning', { word: chosen.word, meaning: chosen.meaningTh })}
        </p>
      ) : display.meaningVisible ? (
        <p className={swapStyles.meaning} lang="th">
          {item.translationTh}
        </p>
      ) : (
        display.canRevealMeaning && (
          <Button size="sm" variant="secondary" icon={Languages} onClick={display.revealMeaning}>
            {t('card.showMeaning')}
          </Button>
        )
      )}

      <SpeakButton text={text} id={speakId} />
      {/* key = ประโยค → เปลี่ยนคำแล้วผลพูดเดิมหายไป ให้พูดประโยคใหม่ */}
      <MicButton
        key={text}
        target={text}
        acceptAlso={choice ? [] : item.acceptAlso}
        recast={{ target: text, commonErrors: choice ? [] : (item.commonErrors ?? []) }}
        speakId={`${speakId}:mic`}
        label={t('swap.speakNew')}
        onResult={(result) => result.passed && setSpoke(true)}
      />

      <div className={styles.actions}>
        {swaps > 0 ? (
          <Button block size="lg" onClick={() => onDone({ spoke })}>
            {t('lesson.next')}
          </Button>
        ) : (
          <p className={styles.hint}>{t('lesson.swapHint')}</p>
        )}
      </div>
    </div>
  )
}
