// =========================================================
// ShadowKaraokeGame — มินิเกม Shadow Karaoke (ส่วนที่ 8.2): ประโยควิ่งแบบคาราโอเกะ พูดให้ทัน
// ใช้ได้ทั้งแทรกในบทเรียน (Stage 4) และหน้ามินิเกมแยก (ขั้นที่ 17) — รับข้อมูลทาง props
// props:
//   items         = ประโยค (1 ข้อ = 1 รอบ) ต้องมี target, image
//   lenient       = ตรวจแบบผ่อนปรน (ค่าเริ่มต้น false = เกณฑ์ 70% ของ Stage 4+)
//   ordered       = เล่นตามลำดับข้อ ไม่สุ่ม (คำคล้องจอง: ร้องตามลำดับบรรทัดของเพลง)
//   onRoundResult = (item, passed) => void   เรียกเมื่อจบแต่ละรอบ
//   onFinish      = ({ skipped }) => void     เล่นครบทุกรอบ / ข้ามเกม (ไมค์ใช้ไม่ได้)
// แต่ละรอบ:
//   1) ฟังต้นแบบ: เสียงเจ้าของภาษา + แถบสีวิ่งทีละคำตามความยาวจริงของไฟล์เสียง
//   2) นับถอยหลัง 3-2-1 (ไมค์เริ่มฟังตั้งแต่ตอนนับ → ไม่พลาดคำแรก)
//   3) ตาเรา: แถบสีวิ่งอีกรอบ (ช้ากว่าต้นแบบนิดหน่อย) พูดตามให้ทัน — คำที่ระบบได้ยินแล้วขึ้นสีเขียวทันที
//   4) แถบจบ (+ เผื่อเวลาคำสุดท้าย) → หยุดฟัง → ให้คะแนนรายคำ → รอบถัดไปอัตโนมัติ
// พูดไม่ทัน / ไม่ผ่าน ไม่มีบทลงโทษ (ไม่มีหัวใจ) แค่ได้คะแนนน้อยลง
// =========================================================
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MicVocal, SkipForward } from 'lucide-react'
import { useSpeech } from '../../hooks/useSpeech'
import { compareSpeech, scoreTranscript } from '../../utils/compareWords'
import {
  activeWordAt,
  karaokeTimings,
  karaokeWords,
  KARAOKE,
  maxListenMsFor,
  singDurationMs,
} from '../../utils/karaoke'
import {
  abortListening,
  isBlockingMicError,
  isRecognitionSupported,
  micErrorMessageKey,
  startListening,
  stopListening,
} from '../../utils/recognition'
import { playSfx } from '../../utils/sfx'
import { getSpeechDurationMs } from '../../utils/speech'
import { shuffle } from '../../utils/random'
import Picture from '../Picture'
import Button from '../Button'
import SpeechResult from '../SpeechResult'
import { useProgressStore } from '../../store/progressStore'
import styles from './ShadowKaraokeGame.module.css'

const TICK_MS = 40 // ความถี่ในการเลื่อนแถบสี

export default function ShadowKaraokeGame({ items, lenient = false, ordered = false, onRoundResult, onFinish }) {
  const { t } = useTranslation()
  const { speak, stop: stopSpeech } = useSpeech()
  // จัดลำดับรอบครั้งเดียวตอนเริ่มเกม
  const [rounds] = useState(() => (ordered ? [...items] : shuffle(items)))
  const [roundIndex, setRoundIndex] = useState(0)
  // phase: 'demo' (ฟังต้นแบบ) → 'countdown' → 'sing' (ตาเรา) → 'result' | 'blocked' (ไมค์ใช้ไม่ได้)
  const [phase, setPhase] = useState(isRecognitionSupported ? 'demo' : 'blocked')
  const [micError, setMicError] = useState(isRecognitionSupported ? null : 'unsupported')
  const [activeWord, setActiveWord] = useState(-1)
  const [beat, setBeat] = useState(KARAOKE.countdown)
  const [interim, setInterim] = useState('')
  const [result, setResult] = useState(null)
  const [points, setPoints] = useState(0)

  const item = rounds[roundIndex]
  const words = useMemo(() => karaokeWords(item.target), [item])

  // เก็บ callback ล่าสุดไว้ใน ref → effect ของรอบไม่ต้องเริ่มใหม่ทุกครั้งที่ component แม่ render
  const callbacks = useRef({ onRoundResult, onFinish })
  useEffect(() => {
    callbacks.current = { onRoundResult, onFinish }
  })

  // 1 รอบ = ฟังต้นแบบ → นับถอยหลัง → ตาเรา → ผล (ทำงานใหม่ทุกครั้งที่เปลี่ยนรอบ)
  useEffect(() => {
    if (!isRecognitionSupported) return undefined
    const run = { active: true, token: null, outcome: null }
    const timeouts = []
    const intervals = []
    const later = (ms) => new Promise((resolve) => timeouts.push(setTimeout(resolve, ms)))
    const stopSweeps = () => intervals.splice(0).forEach(clearInterval)
    // แถบสีวิ่งตามเวลาของแต่ละคำ
    const sweep = (timings) => {
      const startedAt = performance.now()
      const id = setInterval(() => {
        const index = activeWordAt(timings, performance.now() - startedAt)
        setActiveWord(index)
        if (index >= timings.length) clearInterval(id)
      }, TICK_MS)
      intervals.push(id)
    }

    ;(async () => {
      const { target } = item
      // 1) ฟังต้นแบบ
      setPhase('demo')
      setActiveWord(-1)
      setInterim('')
      setResult(null)
      const modelMs = await getSpeechDurationMs(target, 'normal')
      if (!run.active) return
      sweep(karaokeTimings(target, modelMs))
      await speak(target, { key: `karaoke:${item.id}:normal` })
      if (!run.active) return
      stopSweeps()
      setActiveWord(words.length)
      await later(400)
      if (!run.active) return

      // 2) นับถอยหลัง — เริ่มฟังไมค์ไปพร้อมกัน
      const singMs = singDurationMs(modelMs)
      const { token, promise } = startListening({
        onInterim: (text) => run.active && setInterim(text),
        maxListenMs: maxListenMsFor(singMs),
      })
      run.token = token
      promise.then((outcome) => {
        run.outcome = outcome
        // เกมนี้ใช้ไมค์ตรง (ไม่ผ่าน useRecognition) → นับนาทีที่พูดเองตรงนี้ (ขั้นที่ 18)
        if (outcome.ok) useProgressStore.getState().addSpeakingTime(outcome.speechMs)
      })
      setActiveWord(-1)
      setPhase('countdown')
      for (let count = KARAOKE.countdown; count > 0; count -= 1) {
        setBeat(count)
        await later(KARAOKE.beatMs)
        if (!run.active) return
        if (run.outcome && !run.outcome.ok) break // ไมค์ใช้ไม่ได้ตั้งแต่ตอนนับ → ไม่ต้องรอ
      }

      // 3) ตาเรา: แถบวิ่ง แล้วหยุดฟังเมื่อหมดเวลา (+ เผื่อคำสุดท้าย)
      if (!run.outcome) {
        setPhase('sing')
        sweep(karaokeTimings(target, singMs, { leadInRatio: 0 }))
        timeouts.push(setTimeout(() => stopListening(token), singMs + KARAOKE.graceMs))
      }
      const outcome = await promise
      if (!run.active) return
      stopSweeps()

      if (!outcome.ok && isBlockingMicError(outcome.error)) {
        setMicError(outcome.error)
        setPhase('blocked')
        return
      }

      // 4) ให้คะแนนรายคำ (ไม่ได้ยินเสียง = 0 คะแนน แต่ไปต่อได้)
      const options = { lenient, acceptAlso: item.acceptAlso ?? [] }
      const scored = compareSpeech(target, outcome.ok ? outcome.alternatives : [], options)
      setMicError(outcome.ok ? null : outcome.error)
      setResult(scored)
      setPhase('result')
      setPoints((total) => total + scored.score)
      if (scored.passed) playSfx('pass')
      callbacks.current.onRoundResult?.(item, scored.passed)

      await later(KARAOKE.resultMs)
      if (!run.active) return
      if (roundIndex + 1 >= rounds.length) callbacks.current.onFinish?.({ skipped: false })
      else setRoundIndex(roundIndex + 1)
    })()

    return () => {
      run.active = false
      timeouts.forEach(clearTimeout)
      stopSweeps()
      abortListening(run.token)
    }
    // เริ่มใหม่เฉพาะเมื่อเปลี่ยนรอบ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIndex])

  // ออกจากเกมกลางคัน → หยุดเสียง
  useEffect(() => () => stopSpeech(), [stopSpeech])

  // คำที่ระบบได้ยินแล้วระหว่างพูด (ขึ้นสีเขียวทันที)
  const liveStatuses = useMemo(
    () => (phase === 'sing' && interim ? scoreTranscript(item.target, interim, { lenient }).words.map((w) => w.status) : []),
    [phase, interim, item, lenient],
  )

  function wordClass(index) {
    const classes = [styles.word]
    if (phase === 'result' && result) {
      classes.push(styles[result.words[index]?.status ?? 'missed'])
    } else if (phase === 'demo' || phase === 'sing') {
      if (index < activeWord) classes.push(styles.sung)
      if (index === activeWord) classes.push(styles.active)
      if (liveStatuses[index] === 'correct') classes.push(styles.hit)
    }
    return classes.join(' ')
  }

  const STATUS_KEY = {
    demo: 'game.karaokeListen',
    countdown: 'game.karaokeReady',
    sing: 'game.karaokeGo',
    result: result?.passed ? 'game.karaokeGreat' : 'game.karaokeAlmost',
    blocked: 'game.karaokeNeedsMic',
  }

  return (
    <div className={styles.game}>
      <div className={styles.header}>
        <span className={styles.title}>
          <MicVocal className={styles.titleIcon} aria-hidden="true" />
          {t('game.karaokeTitle')}
        </span>
        <span className={styles.meta}>
          <span className={styles.round}>{t('game.round', { n: roundIndex + 1, total: rounds.length })}</span>
          <span className={styles.points}>{t('game.points', { points })}</span>
        </span>
      </div>

      <p className={`${styles.status} ${styles[`status_${phase}`] ?? ''}`} role="status" aria-live="polite">
        {t(STATUS_KEY[phase])}
      </p>

      <div className={styles.stage}>
        <Picture image={item.image} size="fill" alt={item.target} className={styles.picture} />
        {phase === 'countdown' && (
          <span className={styles.beat} aria-hidden="true">
            <span key={beat} className={styles.beatNumber}>
              {beat}
            </span>
          </span>
        )}
      </div>

      {/* บรรทัดคาราโอเกะ (เว้นวรรคระหว่างคำไว้ด้วย → โปรแกรมอ่านหน้าจอ/คัดลอกได้คำแยกกัน; ระยะบนจอใช้ gap) */}
      <p className={styles.line} lang="en">
        {words.map((word, index) => (
          <Fragment key={`${roundIndex}-${index}`}>
            {index > 0 && ' '}
            <span className={wordClass(index)}>{word}</span>
          </Fragment>
        ))}
      </p>

      {phase === 'result' && result && (
        <>
          {/* ผลรายคำระบายสีบนบรรทัดคาราโอเกะแล้ว → กล่องผลไม่ต้องแสดงคำซ้ำ */}
          <SpeechResult result={result} attempt={roundIndex} speakId={`karaoke:${item.id}`} showWords={false} />
          {micError && <p className={styles.note}>{t(micErrorMessageKey(micError))}</p>}
        </>
      )}

      {phase === 'blocked' && (
        <div className={styles.blocked}>
          <p className={styles.error} role="alert">
            {t(micErrorMessageKey(micError))}
          </p>
          <Button variant="secondary" icon={SkipForward} onClick={() => onFinish?.({ skipped: true })}>
            {t('game.skipGame')}
          </Button>
        </div>
      )}
    </div>
  )
}
