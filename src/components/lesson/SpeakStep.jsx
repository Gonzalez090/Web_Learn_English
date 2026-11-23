// =========================================================
// SpeakStep — ขั้น "พูด" ในบทเรียน
//   mode 'shadow' (ส่วนที่ 4 ขั้น 4: Shadowing) — ฟังตัวอย่าง (ปกติ/ช้า) แล้วพูดตามผ่านไมค์
//   mode 'own'    (ส่วนที่ 4 ขั้น 6: ใช้เอง)    — ปิดข้อความ ฟังคำถาม ดูภาพ แล้วตอบเอง (XP มากกว่า)
// - Stage 2–3 ตรวจแบบผ่อนปรน ไม่แสดงตัวอักษร
// - Stage 4+ (ประโยค): กล่องถาม-ตอบ + ข้อความกดดูได้ + พูดไม่ถูกแล้วระบบทวนประโยคที่ถูกกลับมา (recast)
// - ผ่าน → "ต่อไป"
// - ลองครบ 3 ครั้ง (หรือไมค์ใช้ไม่ได้) → "ไปต่อ" ได้ และข้อนี้เข้ารายการทบทวน
// - พูดได้ไม่จำกัด ไม่มีระบบหัวใจ
// props: item, stage, mode, revealed / onReveal (จำว่าเปิดดูข้อความ/คำแปลแล้วทั้งบท), onDone({ passed })
// =========================================================
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSpeech } from '../../hooks/useSpeech'
import { useSentenceDisplay } from '../../hooks/useSentenceDisplay'
import { useStepReveal } from '../../hooks/useStepReveal'
import { MAX_ATTEMPTS_BEFORE_SKIP } from '../../utils/lessonSteps'
import { isBlockingMicError, isRecognitionSupported } from '../../utils/recognition'
import Picture from '../Picture'
import SpeakButton from '../SpeakButton'
import MicButton from '../MicButton'
import Button from '../Button'
import Exchange from './Exchange'
import styles from './Step.module.css'

export default function SpeakStep({ item, stage, mode = 'shadow', revealed, onReveal, onDone }) {
  const { t } = useTranslation()
  const { speak } = useSpeech()
  const own = mode === 'own'
  const sentence = stage.id >= 4 // ประโยค (Stage 4+): มีกล่องถาม-ตอบ + recast
  // ใช้เอง = ปิดข้อความ (ไม่มีปุ่มเปิดดู)
  const display = useSentenceDisplay(stage, { revealed, onReveal, allowReveal: !own })
  const [passed, setPassed] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [blocked, setBlocked] = useState(!isRecognitionSupported)
  const target = item.target ?? item.word
  const canSkip = attempts >= MAX_ATTEMPTS_BEFORE_SKIP || blocked
  const idPrefix = `${item.id}:${mode}`
  // จอเตี้ย: เข้าขั้นแล้วเห็นปุ่มพูด / ได้ผลแล้วเห็นผล + ปุ่มไปต่อ
  const { micRef, actionsRef, showActions } = useStepReveal(item.id)

  // ใช้เอง: เปิดขั้นแล้วพ่อแม่ถามให้ฟังเลย
  useEffect(() => {
    if (own && item.question) speak(item.question, { key: `${idPrefix}:question:normal` })
    // ถามใหม่เฉพาะเมื่อเปลี่ยนข้อ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id, own])

  function handleResult(result) {
    setAttempts((count) => count + 1)
    if (result.passed) setPassed(true)
    showActions()
  }

  function handleError(error) {
    if (isBlockingMicError(error)) setBlocked(true)
    else setAttempts((count) => count + 1) // เช่น ไม่ได้ยินเสียง = นับเป็น 1 ครั้ง
    showActions()
  }

  return (
    <div className={styles.step}>
      <p className={styles.instruction}>{t(own ? 'lesson.speakOwnInstruction' : 'lesson.speakInstruction')}</p>
      <Picture
        image={item.image}
        size="fill"
        alt={display.textVisible ? target : ''}
        className={sentence ? styles.pictureSmall : styles.picture}
      />
      {sentence && <Exchange item={item} display={display} parts={own ? 'ownTurn' : 'answer'} idPrefix={idPrefix} />}
      {/* Stage 4+ ฟังตัวอย่างได้จากกล่องคำตอบ + ปุ่มนี้ (ช้า) / ใช้เอง ไม่มีตัวอย่างให้ฟังก่อน */}
      {!own && <SpeakButton text={target} id={`${item.id}:model`} />}
      <div ref={micRef} className={styles.micBox}>
        <MicButton
          target={target}
          acceptAlso={item.acceptAlso}
          lenient={stage.id <= 3}
          showText={display.textVisible}
          recast={sentence ? item : null}
          speakId={idPrefix}
          label={own ? t('mic.answer') : undefined}
          onResult={handleResult}
          onError={handleError}
        />
      </div>
      <div ref={actionsRef} className={styles.actions}>
        {passed && (
          <Button block size="lg" onClick={() => onDone({ passed: true })}>
            {t('lesson.next')}
          </Button>
        )}
        {!passed && canSkip && (
          <Button block variant="secondary" onClick={() => onDone({ passed: false })}>
            {t('lesson.skip')}
          </Button>
        )}
        {!passed && !canSkip && <p className={styles.hint}>{t(own ? 'lesson.speakOwnHint' : 'lesson.speakHint')}</p>}
      </div>
    </div>
  )
}
