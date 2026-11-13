// =========================================================
// ListenTapGame — มินิเกม Listen & Tap (ส่วนที่ 8.2): ฟังคำแล้วแตะภาพให้ถูกภายในเวลา
// ใช้ได้ทั้งแทรกในบทเรียน (ขั้นที่ 4) และหน้ามินิเกมแยก (ขั้นที่ 17) — รับข้อมูลทาง props
// props:
//   items         = ข้อที่เป็นคำตอบ (1 ข้อ = 1 รอบ)
//   pool          = ข้อที่ใช้เป็นภาพหลอกได้ (ค่าเริ่มต้น = items)
//   onRoundResult = (item, firstTry) => void  เรียกเมื่อจบแต่ละรอบ (firstTry = แตะถูกตั้งแต่ครั้งแรก)
//   onFinish      = () => void                เรียกเมื่อเล่นครบทุกรอบ
// กติกา: แตะผิดได้ไม่จำกัด (ไม่มีหัวใจ) — ภาพที่แตะผิดจะจางลง แล้วลองใหม่ได้
//        หมดเวลา → โชว์ภาพที่ถูก + พูดคำนั้นให้ฟัง แล้วไปรอบถัดไป
// ⚠️ ไม่แสดงตัวอักษรภาษาอังกฤษ และ aria-label ของภาพไม่บอกคำตอบ
// =========================================================
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Ear } from 'lucide-react'
import { buildListenTapRounds, listenTapPrompt } from '../../utils/listenTap'
import { useSpeech } from '../../hooks/useSpeech'
import Picture from '../Picture'
import Button from '../Button'
import styles from './ListenTapGame.module.css'

const ROUND_MS = 10000 // เวลาต่อรอบ (เริ่มนับหลังพูดคำถามจบ)
const PAUSE_AFTER_MS = 700 // พักสั้น ๆ หลังโชว์คำตอบ ก่อนไปรอบถัดไป
const MAX_OPTIONS = 4

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export default function ListenTapGame({ items, pool = items, onRoundResult, onFinish }) {
  const { t } = useTranslation()
  const { speak, stop } = useSpeech()
  // จัดรอบครั้งเดียวตอนเริ่มเกม
  const [rounds] = useState(() => buildListenTapRounds(items, { optionsPerRound: MAX_OPTIONS, pool }))
  const [roundIndex, setRoundIndex] = useState(0)
  // phase: 'asking' (กำลังพูดคำถาม) → 'playing' (นับเวลา) → 'correct' | 'timeup' (โชว์คำตอบ)
  const [phase, setPhase] = useState('asking')
  const [wrongIds, setWrongIds] = useState([])

  const round = rounds[roundIndex]
  const prompt = listenTapPrompt(round.answer)
  const speakKey = `listen-tap:${round.answer.id}`

  // เก็บ callback ล่าสุดไว้ใน ref → effect ด้านล่างไม่ต้องเริ่มใหม่ทุกครั้งที่ component แม่ render
  const callbacks = useRef({ onRoundResult, onFinish })
  useEffect(() => {
    callbacks.current = { onRoundResult, onFinish }
  })

  // เริ่มรอบ → พูดคำถาม แล้วเริ่มนับเวลา
  useEffect(() => {
    let active = true
    speak(prompt, { key: speakKey }).finally(() => {
      if (active) setPhase((current) => (current === 'asking' ? 'playing' : current))
    })
    return () => {
      active = false
    }
    // เริ่มใหม่เฉพาะเมื่อเปลี่ยนรอบ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIndex])

  // นับเวลา → หมดเวลา
  useEffect(() => {
    if (phase !== 'playing') return undefined
    const timer = setTimeout(() => setPhase('timeup'), ROUND_MS)
    return () => clearTimeout(timer)
  }, [phase, roundIndex])

  // จบรอบ (ถูก / หมดเวลา) → พูดคำนั้นอีกครั้งพร้อมโชว์ภาพที่ถูก → รอบถัดไป
  useEffect(() => {
    if (phase !== 'correct' && phase !== 'timeup') return undefined
    let active = true
    const firstTry = phase === 'correct' && wrongIds.length === 0
    callbacks.current.onRoundResult?.(round.answer, firstTry)
    ;(async () => {
      await speak(prompt, { key: speakKey })
      await wait(PAUSE_AFTER_MS)
      if (!active) return
      if (roundIndex + 1 >= rounds.length) {
        callbacks.current.onFinish?.()
        return
      }
      setWrongIds([])
      setPhase('asking')
      setRoundIndex(roundIndex + 1)
    })()
    return () => {
      active = false
    }
    // ทำงานครั้งเดียวต่อการจบรอบ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // ออกจากเกมกลางคัน → หยุดเสียง
  useEffect(() => () => stop(), [stop])

  const answered = phase === 'correct' || phase === 'timeup'

  function handleTap(option) {
    if (answered || wrongIds.includes(option.id)) return
    if (option.id === round.answer.id) setPhase('correct')
    else setWrongIds((ids) => [...ids, option.id])
  }

  function optionClass(option) {
    const isAnswer = option.id === round.answer.id
    if (answered && isAnswer) return `${styles.option} ${styles.right}`
    if (wrongIds.includes(option.id)) return `${styles.option} ${styles.dim}`
    if (answered) return `${styles.option} ${styles.dim}`
    return styles.option
  }

  let feedback = t('game.tapPicture')
  if (phase === 'correct') feedback = t('game.correct')
  else if (phase === 'timeup') feedback = t('game.timeUp')
  else if (wrongIds.length > 0) feedback = t('game.tryAgain')

  return (
    <div className={styles.game}>
      <div className={styles.header}>
        <span className={styles.title}>
          <Ear className={styles.titleIcon} aria-hidden="true" />
          {t('game.listenTapTitle')}
        </span>
        <span className={styles.round}>{t('game.round', { n: roundIndex + 1, total: rounds.length })}</span>
      </div>

      {/* แถบเวลา: เริ่มเต็ม แล้วหดลงจนหมด — หยุดนิ่งระหว่างพูดคำถาม/โชว์คำตอบ
          (key = รอบ → เริ่มแอนิเมชันใหม่ทุกรอบ) */}
      <div className={styles.timer} aria-hidden="true">
        <span
          key={roundIndex}
          className={styles.timerBar}
          style={{
            animationDuration: `${ROUND_MS}ms`,
            animationPlayState: phase === 'playing' ? 'running' : 'paused',
          }}
        />
      </div>

      <p className={styles.feedback} role="status" aria-live="polite">
        {feedback}
      </p>

      <div className={styles.options}>
        {round.options.map((option, index) => (
          <button
            key={`${roundIndex}-${option.id}`}
            type="button"
            className={optionClass(option)}
            aria-label={t('game.optionLabel', { n: index + 1 })}
            disabled={answered}
            onClick={() => handleTap(option)}
          >
            <Picture image={option.image} size="fill" />
          </button>
        ))}
      </div>

      <Button variant="secondary" icon={Ear} onClick={() => speak(prompt, { key: speakKey })} disabled={answered}>
        {t('game.listenAgain')}
      </Button>
    </div>
  )
}
