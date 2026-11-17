// =========================================================
// FillBlankStep — แบบฝึกเขียนแบบที่ 2 "เติมคำในประโยค" (Stage 7)
//   ภาพ + ประโยคที่มีช่องว่าง 1 ช่อง (กว้างตามความยาวคำ + บอกจำนวนตัวอักษร) + ฟังทั้งประโยคได้ (ฟังก่อนเขียน)
//   พิมพ์คำในช่อง → ตรวจตัวสะกด → ยังไม่ผ่าน: โชว์ประโยคที่ถูก (คำที่เติมเป็นตัวหนา) แล้วแก้ได้ไม่จำกัด
// props: item ({ id, target, blank, image, translationTh, acceptAlso }), stage, mode, onDone({ passed })
// =========================================================
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import { useSentenceDisplay } from '../../hooks/useSentenceDisplay'
import { MAX_ATTEMPTS_BEFORE_SKIP } from '../../utils/lessonSteps'
import { compareSpelling, splitBlank } from '../../utils/spelling'
import { scrollIntoViewGently } from '../../utils/scroll'
import Picture from '../Picture'
import SpeakButton from '../SpeakButton'
import Button from '../Button'
import WritingInput from './WritingInput'
import SpellingResult from './SpellingResult'
import { ModeNote, WriteActions } from './WriteParts'
import stepStyles from './Step.module.css'
import styles from './WriteStep.module.css'

export default function FillBlankStep({ item, stage, mode, onDone }) {
  const { t } = useTranslation()
  const display = useSentenceDisplay(stage)
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [attempts, setAttempts] = useState(0)
  const actionsRef = useRef(null)
  const { before, after } = splitBlank(item.target, item.blank)
  const passed = Boolean(result?.passed)

  function check() {
    if (!text.trim() || passed) return
    // คำเดียว → ไม่ต้องเตือนเรื่องตัวใหญ่/จุดท้ายประโยค (ประโยคมีให้แล้ว)
    setResult(compareSpelling(item.blank, text, { mode, acceptAlso: item.acceptAlso }))
    setAttempts((count) => count + 1)
    setTimeout(() => scrollIntoViewGently(actionsRef.current), 60)
  }

  return (
    <div className={stepStyles.step}>
      <p className={stepStyles.instruction}>{t('write.fillInstruction')}</p>
      <ModeNote mode={mode} />
      <Picture image={item.image} size="fill" alt="" className={stepStyles.pictureSmall} />
      <SpeakButton text={item.target} id={`${item.id}:fill`} />

      <p className={styles.sentence} lang="en">
        {before && `${before} `}
        <WritingInput
          inline
          size={item.blank.length}
          value={text}
          onChange={setText}
          onSubmit={check}
          label={t('write.blankLabel')}
          disabled={passed}
        />
        {after}
      </p>
      <p className={stepStyles.hint}>{t('write.letters', { count: item.blank.length })}</p>

      {display.meaningVisible && (
        <p className={styles.meaning} lang="th">
          {item.translationTh}
        </p>
      )}
      {display.canRevealMeaning && (
        <Button size="sm" variant="secondary" icon={Languages} onClick={display.revealMeaning}>
          {t('card.showMeaning')}
        </Button>
      )}

      <SpellingResult
        result={result}
        answer={item.target}
        highlight={[item.blank]}
        attempt={Math.max(0, attempts - 1)}
        speakId={item.id}
      />

      <WriteActions
        ref={actionsRef}
        passed={passed}
        canSkip={attempts >= MAX_ATTEMPTS_BEFORE_SKIP}
        canCheck={Boolean(text.trim())}
        onCheck={check}
        onNext={() => onDone({ passed: true })}
        onSkip={() => onDone({ passed: false })}
      />
    </div>
  )
}
