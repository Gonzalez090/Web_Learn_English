// =========================================================
// SpeakStep — ขั้น "พูดตาม" (ส่วนที่ 4 ขั้น 4: Shadowing)
// - ฟังตัวอย่าง (ปกติ/ช้า) แล้วพูดตามผ่านไมค์ — Stage 2–3 ตรวจแบบผ่อนปรน
// - ผ่าน → "ต่อไป"
// - ลองครบ 3 ครั้ง (หรือไมค์ใช้ไม่ได้) → "ไปต่อ" ได้ และข้อนี้เข้ารายการทบทวน
// - พูดได้ไม่จำกัด ไม่มีระบบหัวใจ
// =========================================================
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { englishTextMode } from '../../utils/display'
import { MAX_ATTEMPTS_BEFORE_SKIP } from '../../utils/lessonSteps'
import { isRecognitionSupported } from '../../utils/recognition'
import Picture from '../Picture'
import SpeakButton from '../SpeakButton'
import MicButton from '../MicButton'
import Button from '../Button'
import styles from './Step.module.css'

// ปัญหาที่ผู้ใช้แก้เองตรงนี้ไม่ได้ → ให้ข้ามได้ทันที ไม่ติดอยู่ในบท
const BLOCKING_ERRORS = new Set(['not-allowed', 'service-not-allowed', 'audio-capture', 'network', 'unsupported'])

export default function SpeakStep({ item, stage, onDone }) {
  const { t } = useTranslation()
  const [passed, setPassed] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [blocked, setBlocked] = useState(!isRecognitionSupported)
  const target = item.target ?? item.word
  const canSkip = attempts >= MAX_ATTEMPTS_BEFORE_SKIP || blocked

  function handleResult(result) {
    setAttempts((count) => count + 1)
    if (result.passed) setPassed(true)
  }

  function handleError(error) {
    if (BLOCKING_ERRORS.has(error)) setBlocked(true)
    else setAttempts((count) => count + 1) // เช่น ไม่ได้ยินเสียง = นับเป็น 1 ครั้ง
  }

  return (
    <div className={styles.step}>
      <p className={styles.instruction}>{t('lesson.speakInstruction')}</p>
      <Picture image={item.image} size="fill" className={styles.picture} />
      <SpeakButton text={target} id={`${item.id}:model`} />
      <MicButton
        target={target}
        acceptAlso={item.acceptAlso}
        lenient={stage.id <= 3}
        showText={englishTextMode(stage.showText) === 'shown'}
        onResult={handleResult}
        onError={handleError}
      />
      <div className={styles.actions}>
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
        {!passed && !canSkip && <p className={styles.hint}>{t('lesson.speakHint')}</p>}
      </div>
    </div>
  )
}
