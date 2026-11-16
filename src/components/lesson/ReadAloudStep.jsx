// =========================================================
// ReadAloudStep — ขั้น "อ่านออกเสียง" ของ Stage 6 (ส่วนที่ 3: อ่านเฉพาะคำที่พูดได้แล้วใน Stage 1–5)
//   variant 'blend' — คำ phonics: ป้ายตัวอักษร + ไล่เสียง → อ่านทั้งคำ
//                     ภาพ + ความหมายเฉลยหลังลองอ่าน (อ่านจากตัวอักษร ไม่ใช่เดาจากภาพ)
//   variant 'sight' — sight word: ดูคำ + ฟังคำ (จำทั้งคำ) → อ่านประโยคที่มีคำนั้นออกเสียง
//   variant 'page'  — หน้านิทาน: ภาพ + ประโยค → อ่านออกเสียง
//   ระหว่างพูด คำที่อ่านถึงแล้วเปลี่ยนสีไล่จากซ้ายไปขวา (ReadingText + utils/reading.js readProgress)
// - อ่านก่อน ฟังทีหลัง: ปุ่มฟังเสียงอ่าน + คำอ่าน/คำแปลไทย เปิดหลังลองอ่านครั้งแรก (ไมค์ใช้ไม่ได้ → เปิดเลย)
// - อ่านยังไม่ผ่าน → ระบบอ่านให้ฟัง (recast แบบพ่อแม่) แล้วลองใหม่ / ลองครบ 3 ครั้ง → "ไปต่อ" (เข้ารายการทบทวน)
// - เกณฑ์: คำเดี่ยว (blend) ผ่อนปรน 60% / ประโยค 70%
// props: item, stage, variant, onDone({ passed })
// =========================================================
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import phonicsData from '../../data/phonics.json'
import { useSpeech } from '../../hooks/useSpeech'
import { useSentenceDisplay } from '../../hooks/useSentenceDisplay'
import { MAX_ATTEMPTS_BEFORE_SKIP } from '../../utils/lessonSteps'
import { graphemeUnits, readingUnits, readProgress } from '../../utils/reading'
import { isBlockingMicError, isRecognitionSupported } from '../../utils/recognition'
import Picture from '../Picture'
import SpeakButton from '../SpeakButton'
import MicButton from '../MicButton'
import Button from '../Button'
import ThaiReading from '../ThaiReading'
import LineButton from './LineButton'
import BlendTiles from './BlendTiles'
import ReadingText from './ReadingText'
import stepStyles from './Step.module.css'
import styles from './ReadAloudStep.module.css'

const SOUNDS_BY_ID = Object.fromEntries(phonicsData.sounds.map((sound) => [sound.id, sound]))

export default function ReadAloudStep({ item, stage, variant = 'page', onDone }) {
  const { t } = useTranslation()
  const { speak } = useSpeech()
  const display = useSentenceDisplay(stage)
  const [attempts, setAttempts] = useState(0)
  const [passed, setPassed] = useState(false)
  const [blocked, setBlocked] = useState(!isRecognitionSupported)
  const [live, setLive] = useState('') // สิ่งที่ได้ยินระหว่างพูด
  const [lastHeard, setLastHeard] = useState('') // ครั้งล่าสุดที่พูดจบ (ไฮไลต์ค้างไว้)
  const target = item.target ?? item.word
  const isWord = variant === 'blend'
  const tried = attempts > 0 || blocked
  const canSkip = attempts >= MAX_ATTEMPTS_BEFORE_SKIP || blocked
  const wordKey = `${item.id}:word`

  // sight word: เปิดขั้นแล้วพูดคำให้ฟัง (จำทั้งหน้าตาและเสียงของคำ)
  useEffect(() => {
    if (variant === 'sight') speak(item.word, { key: wordKey })
    // พูดใหม่เฉพาะเมื่อเปลี่ยนข้อ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id, variant])

  const total = readingUnits(target).filter((unit) => unit.countable).length
  const read = passed ? total : readProgress(target, live || lastHeard)

  function handleResult(result) {
    setAttempts((count) => count + 1)
    setLastHeard(result.heard ?? '')
    if (result.passed) setPassed(true)
  }

  function handleError(error) {
    if (isBlockingMicError(error)) setBlocked(true)
    else setAttempts((count) => count + 1) // เช่น ไม่ได้ยินเสียง = นับเป็น 1 ครั้ง
  }

  return (
    <div className={stepStyles.step}>
      <p className={stepStyles.instruction}>{t(`read.${variant}Instruction`)}</p>

      {variant === 'blend' && (
        <>
          <BlendTiles units={graphemeUnits(item.graphemes, SOUNDS_BY_ID)} />
          {tried ? (
            <div className={styles.reveal}>
              <Picture image={item.image} size="fill" alt={item.word} className={stepStyles.pictureSmall} />
              <p className={styles.meaning} lang="th">
                {item.meaningTh}
              </p>
            </div>
          ) : (
            <p className={stepStyles.hint}>{t('read.pictureAfter')}</p>
          )}
        </>
      )}

      {variant === 'sight' && (
        <>
          <div className={styles.sightCard}>
            <div className={styles.sightRow}>
              <span className={styles.sightWord} lang="en">
                {item.word}
              </span>
              <LineButton text={item.word} speakKey={wordKey} label={t('read.hearWord')} />
            </div>
            <p className={styles.meaning} lang="th">
              {item.meaningTh}
            </p>
            <p className={stepStyles.hint}>{t('read.sightNote')}</p>
          </div>
          <Picture image={item.image} size="fill" alt="" className={stepStyles.pictureSmall} />
          <ReadingText text={target} read={read} focusWord={item.word} />
        </>
      )}

      {variant === 'page' && (
        <>
          <Picture image={item.image} size="fill" alt="" className={stepStyles.picture} />
          <ReadingText text={target} read={read} />
        </>
      )}

      {/* อ่านก่อน ฟังทีหลัง */}
      {tried && <SpeakButton text={target} id={`${item.id}:model`} />}
      {tried && !isWord && display.readingVisible && <ThaiReading reading={item.readingTh} />}
      {tried && !isWord && display.meaningVisible && (
        <p className={stepStyles.hint} lang="th">
          {item.translationTh}
        </p>
      )}
      {tried && !isWord && display.canRevealMeaning && (
        <Button size="sm" variant="secondary" icon={Languages} onClick={display.revealMeaning}>
          {t('card.showMeaning')}
        </Button>
      )}

      <MicButton
        target={target}
        acceptAlso={item.acceptAlso}
        lenient={isWord}
        showText
        recast={{ ...item, target }}
        speakId={`${item.id}:read`}
        label={t('read.readAloud')}
        onResult={handleResult}
        onError={handleError}
        onInterim={setLive}
      />

      <div className={stepStyles.actions}>
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
        {!passed && !canSkip && <p className={stepStyles.hint}>{t('read.hint')}</p>}
      </div>
    </div>
  )
}
