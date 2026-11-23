// =========================================================
// DictationStep — แบบฝึกเขียนแบบที่ 1 "ฟังแล้วพิมพ์" (Stage 7)
//   เปิดขั้น → พูดคำ/ประโยคให้ฟัง (ฟังซ้ำ ปกติ/ช้า ได้ไม่จำกัด) → พิมพ์ตาม → ตรวจตัวสะกดรายคำ
//   ภาพ + ความหมายเฉลยหลังลองพิมพ์ครั้งแรก (ให้เขียนจากเสียง ไม่ใช่เดาจากภาพ)
//   ยังไม่ผ่าน → โชว์คำที่ถูก (ทวนกลับแบบงานเขียน) แล้วแก้ได้ไม่จำกัด / ลองครบ 3 ครั้ง → "ไปต่อ" (เข้ารายการทบทวน)
// props: item ({ id, target, image, meaningTh | translationTh, acceptAlso }), stage, mode ('sound' | 'exact'), onDone({ passed })
// =========================================================
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import { useSpeech } from '../../hooks/useSpeech'
import { useSentenceDisplay } from '../../hooks/useSentenceDisplay'
import { MAX_ATTEMPTS_BEFORE_SKIP } from '../../utils/lessonSteps'
import { compareSpelling, writtenWords } from '../../utils/spelling'
import { scrollIntoViewGently } from '../../utils/scroll'
import Picture from '../Picture'
import SpeakButton from '../SpeakButton'
import Button from '../Button'
import WritingInput from './WritingInput'
import SpellingResult from './SpellingResult'
import { ModeNote, WriteActions } from './WriteParts'
import stepStyles from './Step.module.css'
import styles from './WriteStep.module.css'

export default function DictationStep({ item, stage, mode, onDone }) {
  const { t } = useTranslation()
  const { speak, defaultRate } = useSpeech()
  const display = useSentenceDisplay(stage)
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [attempts, setAttempts] = useState(0)
  const actionsRef = useRef(null)
  const audioId = `${item.id}:dictation`
  const wordCount = writtenWords(item.target).length
  const isWord = wordCount === 1
  const passed = Boolean(result?.passed)
  const tried = attempts > 0

  // เปิดขั้น → พูดให้ฟังเลย (ปุ่ม "ฟัง" ขึ้นสถานะกำลังเล่น)
  useEffect(() => {
    speak(item.target, { key: `${audioId}:${defaultRate}` })
    // พูดใหม่เฉพาะเมื่อเปลี่ยนข้อ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id])

  function check() {
    if (!text.trim() || passed) return
    setResult(compareSpelling(item.target, text, { mode, acceptAlso: item.acceptAlso }))
    setAttempts((count) => count + 1)
    setTimeout(() => scrollIntoViewGently(actionsRef.current), 60)
  }

  return (
    <div className={stepStyles.step}>
      <p className={stepStyles.instruction}>{t('write.dictationInstruction')}</p>
      <ModeNote mode={mode} />
      <SpeakButton text={item.target} id={audioId} />
      <p className={stepStyles.hint}>
        {isWord ? t('write.letters', { count: item.target.trim().length }) : t('write.words', { count: wordCount })}
      </p>

      <WritingInput
        value={text}
        onChange={setText}
        onSubmit={check}
        label={t('write.inputLabel')}
        placeholder={t(isWord ? 'write.placeholderWord' : 'write.placeholderSentence')}
        disabled={passed}
      />

      {tried ? (
        <div className={styles.reveal}>
          <Picture image={item.image} size="fill" alt="" className={stepStyles.pictureSmall} />
          {display.meaningVisible && (
            <p className={styles.meaning} lang="th">
              {item.meaningTh ?? item.translationTh}
            </p>
          )}
          {display.canRevealMeaning && (
            <Button size="sm" variant="secondary" icon={Languages} onClick={display.revealMeaning}>
              {t('card.showMeaning')}
            </Button>
          )}
        </div>
      ) : (
        <p className={stepStyles.hint}>{t('write.pictureAfter')}</p>
      )}

      <SpellingResult
        result={result}
        answer={item.target}
        highlight={(result?.words ?? []).filter((word) => word.status !== 'correct').map((word) => word.text)}
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
