// =========================================================
// MinimalPairDuelGame — มินิเกม Minimal Pair Duel (ส่วนที่ 8.2): ฟังคำ แล้วเลือกว่าได้ยินคำไหนจาก 2 คำที่คล้ายกัน
// ใช้ได้ทั้งในบท Stage 6 (sit / sat — ฝึกอ่าน + ฟัง) และโหมดฝึกเสียง (think / sink — ส่วนที่ 10.1)
// props (ชุดเดียวกับเกมอื่น):
//   items         = ข้อที่เล่น (1 ข้อ = 1 รอบ) { id, word, pairWith?, meaningTh?, pairMeaningTh? }
//   pool          = ข้อที่ใช้หาคำคู่แทนได้ ถ้าข้อไหนไม่มี pairWith
//   onRoundResult = (item, firstTry) => void  เรียกเมื่อจบแต่ละรอบ (firstTry = เลือกถูก)
//   onFinish      = () => void                เล่นครบทุกรอบ
//   showMeaning   = แสดงความหมายไทยใต้คำ (โหมดฝึกเสียง) — ในบทเรียนไม่แสดง (ฝึกอ่านคำเอง)
// กติกา: มี 2 ตัวเลือก → เลือกครั้งเดียวต่อรอบ (ไม่มีหัวใจ) — ถูก/ผิด/หมดเวลา แล้วฟังเทียบทั้งสองคำ
//        (คำที่ได้ยิน → อีกคำ) ให้หูจับความต่างได้ แล้วไปรอบถัดไป
// =========================================================
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Ear, Swords } from 'lucide-react'
import { buildDuelRounds } from '../../utils/duel'
import { useSpeech } from '../../hooks/useSpeech'
import { useStudyActivity } from '../../hooks/useStudyActivity'
import Button from '../Button'
import styles from './MinimalPairDuelGame.module.css'

const ROUND_MS = 8000 // เวลาต่อรอบ (เริ่มนับหลังพูดคำจบ)
const GAP_MS = 350 // พักระหว่างคำตอนฟังเทียบ
const PAUSE_AFTER_MS = 600 // พักหลังฟังเทียบ ก่อนไปรอบถัดไป

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export default function MinimalPairDuelGame({ items, pool = items, onRoundResult, onFinish, showMeaning = false }) {
  const { t } = useTranslation()
  const { speak, stop } = useSpeech()
  const [rounds] = useState(() => buildDuelRounds(items, { pool }))
  const [roundIndex, setRoundIndex] = useState(0)
  // phase: 'asking' (พูดคำ) → 'playing' (นับเวลา) → 'correct' | 'wrong' | 'timeup' (ฟังเทียบ)
  const [phase, setPhase] = useState('asking')
  const [chosen, setChosen] = useState(null) // คำที่เลือก
  useStudyActivity() // เล่นอยู่ → นับเวลาเรียน
  const [comparing, setComparing] = useState(null) // คำที่กำลังพูดตอนฟังเทียบ

  const round = rounds[roundIndex]
  const keyOf = (text) => `duel:${roundIndex}:${text}`

  const callbacks = useRef({ onRoundResult, onFinish })
  useEffect(() => {
    callbacks.current = { onRoundResult, onFinish }
  })

  // เริ่มรอบ → พูดคำ แล้วเริ่มนับเวลา
  useEffect(() => {
    let active = true
    speak(round.answer.text, { key: keyOf(round.answer.text) }).finally(() => {
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

  // จบรอบ → ฟังเทียบ: คำที่ได้ยิน แล้วอีกคำ → รอบถัดไป
  useEffect(() => {
    if (phase !== 'correct' && phase !== 'wrong' && phase !== 'timeup') return undefined
    let active = true
    callbacks.current.onRoundResult?.(round.item, phase === 'correct')
    const order = [round.answer, ...round.options.filter((option) => option.text !== round.answer.text)]
    ;(async () => {
      for (const option of order) {
        if (!active) return
        setComparing(option.text)
        await speak(option.text, { key: keyOf(option.text) })
        await wait(GAP_MS)
      }
      if (!active) return
      setComparing(null)
      await wait(PAUSE_AFTER_MS)
      if (!active) return
      if (roundIndex + 1 >= rounds.length) {
        callbacks.current.onFinish?.()
        return
      }
      setChosen(null)
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

  const answered = phase === 'correct' || phase === 'wrong' || phase === 'timeup'

  function choose(option) {
    if (phase !== 'playing' && phase !== 'asking') return
    setChosen(option.text)
    setPhase(option.text === round.answer.text ? 'correct' : 'wrong')
  }

  function optionClass(option) {
    const classes = [styles.option]
    if (answered && option.text === round.answer.text) classes.push(styles.right)
    else if (answered && option.text === chosen) classes.push(styles.missed)
    if (comparing === option.text) classes.push(styles.speaking)
    return classes.join(' ')
  }

  let feedback = t('game.duelQuestion')
  if (phase === 'correct') feedback = t('game.correct')
  else if (phase === 'wrong') feedback = t('game.duelWrong', { word: round.answer.text })
  else if (phase === 'timeup') feedback = t('game.timeUp')

  return (
    <div className={styles.game}>
      <div className={styles.header}>
        <span className={styles.title}>
          <Swords className={styles.titleIcon} aria-hidden="true" />
          {t('game.duelTitle')}
        </span>
        <span className={styles.round}>{t('game.round', { n: roundIndex + 1, total: rounds.length })}</span>
      </div>

      {/* แถบเวลา (key = รอบ → เริ่มแอนิเมชันใหม่ทุกรอบ) — หยุดนิ่งระหว่างพูดคำ/ฟังเทียบ */}
      <div className={styles.timer} aria-hidden="true">
        <span
          key={roundIndex}
          className={styles.timerBar}
          style={{ animationDuration: `${ROUND_MS}ms`, animationPlayState: phase === 'playing' ? 'running' : 'paused' }}
        />
      </div>

      <p className={styles.feedback} role="status" aria-live="polite">
        {feedback}
      </p>

      <div className={styles.options}>
        {round.options.map((option, index) => (
          <button
            key={`${roundIndex}-${option.text}`}
            type="button"
            className={optionClass(option)}
            disabled={answered}
            onClick={() => choose(option)}
          >
            <span className={styles.word} lang="en">
              {option.text}
            </span>
            {showMeaning && option.meaningTh && (
              <span className={styles.meaning} lang="th">
                {option.meaningTh}
              </span>
            )}
            {/* คั่นกลางระหว่าง 2 คำ */}
            {index === 0 && round.options.length > 1 && (
              <span className={styles.versus} aria-hidden="true">
                {t('game.duelOr')}
              </span>
            )}
          </button>
        ))}
      </div>

      <Button
        variant="secondary"
        icon={Ear}
        onClick={() => speak(round.answer.text, { key: keyOf(round.answer.text) })}
        disabled={answered}
      >
        {t('game.listenAgain')}
      </Button>
    </div>
  )
}
