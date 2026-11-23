// =========================================================
// WordSwapRaceGame — มินิเกม Word Swap Race (ส่วนที่ 8.2): สลับคำในประโยคให้ได้มากที่สุดใน 60 วินาที
// ใช้แทรกในบทประโยคในบริบท (Stage 5+) และหน้ามินิเกมแยก (ขั้นที่ 17) — รับข้อมูลทาง props
// props:
//   items         = ข้อในบท (ต้องมี target, image, keywords)
//   onRoundResult = (item, passed) => void   เรียกเฉพาะรอบที่เลือกถูกตั้งแต่ครั้งแรก (passed = true)
//                   เกมแข่งเวลา เดาผิดได้เป็นเรื่องปกติ → ไม่นับเป็นข้อที่พลาด ไม่ส่งเข้ารายการทบทวน
//   onFinish      = ({ skipped }) => void     หมดเวลาแล้วกด "ต่อไป" / ข้ามเกม
// แต่ละรอบ: ประโยค + คำที่ต้องเปลี่ยน (ขีดเส้นประ) + ความหมายไทยของคำใหม่ → แตะคำภาษาอังกฤษที่ตรงความหมาย
//   ถูก → คำสลับเข้าประโยค + เล่นเสียงประโยคใหม่ → รอบถัดไป / ผิด → ลองตัวอื่นได้ (ไม่มีบทลงโทษ ไม่มีหัวใจ)
// =========================================================
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Shuffle, SkipForward, Timer } from 'lucide-react'
import { useSpeech } from '../../hooks/useSpeech'
import { splitKeywords, swapRaceRounds } from '../../utils/swap'
import Picture from '../Picture'
import Button from '../Button'
import styles from './WordSwapRaceGame.module.css'

const RACE = { seconds: 60, nextDelayMs: 900 } // เวลาเล่น / เวลาโชว์ประโยคที่สลับแล้วก่อนไปรอบถัดไป

export default function WordSwapRaceGame({ items, onRoundResult, onFinish }) {
  const { t } = useTranslation()
  const { speak, stop } = useSpeech()
  const [phase, setPhase] = useState('intro') // intro → play → done
  const [rounds, setRounds] = useState(() => swapRaceRounds(items))
  const [roundIndex, setRoundIndex] = useState(0)
  const [wrong, setWrong] = useState([]) // คำที่แตะผิดในรอบนี้
  const [solved, setSolved] = useState(false)
  const [points, setPoints] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(RACE.seconds)
  const endsAt = useRef(0)
  const nextTimer = useRef(null)
  const round = rounds[roundIndex % Math.max(rounds.length, 1)]
  const noRounds = rounds.length === 0

  // ไม่มีคำให้สลับ (ข้อไม่มี keywords) → ข้ามเกม
  useEffect(() => {
    if (noRounds) onFinish?.({ skipped: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noRounds])

  // นาฬิกานับถอยหลัง
  useEffect(() => {
    if (phase !== 'play') return undefined
    const timer = setInterval(() => {
      const left = Math.max(0, Math.ceil((endsAt.current - Date.now()) / 1000))
      setSecondsLeft(left)
      if (left === 0) {
        clearTimeout(nextTimer.current)
        setPhase('done')
      }
    }, 250)
    return () => clearInterval(timer)
  }, [phase])

  // ออกจากเกมกลางคัน → หยุดเสียง + ล้างตัวจับเวลา
  useEffect(
    () => () => {
      clearTimeout(nextTimer.current)
      stop()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const parts = useMemo(() => {
    if (!round) return []
    const shown = solved ? round.answer.word : round.keyword
    return splitKeywords(solved ? round.text : round.item.target, [{ word: shown, key: round.keyword }])
  }, [round, solved])

  function start() {
    endsAt.current = Date.now() + RACE.seconds * 1000
    setSecondsLeft(RACE.seconds)
    setPhase('play')
  }

  function choose(option) {
    if (solved || phase !== 'play') return
    if (option.word !== round.answer.word) {
      setWrong((list) => [...list, option.word])
      return
    }
    setSolved(true)
    setPoints((count) => count + 1)
    if (wrong.length === 0) onRoundResult?.(round.item, true)
    speak(round.text, { rate: 'normal', key: `race:${round.item.id}:normal` }) // แข่งเวลา → ความเร็วปกติเสมอ
    nextTimer.current = setTimeout(() => {
      // วนครบทุกรอบแล้ว → สับใหม่เล่นต่อจนหมดเวลา
      if (roundIndex + 1 >= rounds.length) {
        setRounds(swapRaceRounds(items))
        setRoundIndex(0)
      } else {
        setRoundIndex(roundIndex + 1)
      }
      setWrong([])
      setSolved(false)
    }, RACE.nextDelayMs)
  }

  if (noRounds) return null

  return (
    <div className={styles.game}>
      <div className={styles.header}>
        <span className={styles.title}>
          <Shuffle className={styles.titleIcon} aria-hidden="true" />
          {t('game.swapRaceTitle')}
        </span>
        <span className={styles.meta}>
          <span className={styles.timer} role="timer" aria-label={t('game.timeLeft', { seconds: secondsLeft })}>
            <Timer className={styles.timerIcon} aria-hidden="true" />
            {secondsLeft}
          </span>
          <span className={styles.points}>{t('game.swapCount', { count: points })}</span>
        </span>
      </div>

      {phase === 'intro' && (
        <div className={styles.intro}>
          <p className={styles.introText}>{t('game.swapRaceIntro', { seconds: RACE.seconds })}</p>
          <Button block size="lg" onClick={start}>
            {t('game.start')}
          </Button>
          <Button variant="ghost" icon={SkipForward} onClick={() => onFinish?.({ skipped: true })}>
            {t('game.skipGame')}
          </Button>
        </div>
      )}

      {phase === 'play' && round && (
        <>
          <Picture image={round.item.image} size="fill" alt={round.item.target} className={styles.picture} />
          <p className={styles.sentence} lang="en">
            {parts.map((part, index) =>
              part.key ? (
                <span key={index} className={solved ? `${styles.slot} ${styles.slotDone}` : styles.slot}>
                  {part.text}
                </span>
              ) : (
                <span key={index}>{part.text}</span>
              ),
            )}
          </p>
          <p className={styles.prompt}>
            {t('game.swapTo')} <strong lang="th">{round.answer.meaningTh}</strong>
          </p>
          <div className={styles.options}>
            {round.options.map((option) => {
              const isWrong = wrong.includes(option.word)
              const isRight = solved && option.word === round.answer.word
              return (
                <button
                  key={option.word}
                  type="button"
                  lang="en"
                  className={[styles.option, isWrong ? styles.wrong : '', isRight ? styles.right : ''].join(' ')}
                  disabled={isWrong || solved}
                  onClick={() => choose(option)}
                >
                  {option.word}
                </button>
              )
            })}
          </div>
        </>
      )}

      {phase === 'done' && (
        <div className={styles.intro} role="status">
          <p className={styles.doneText}>{t('game.swapRaceDone', { count: points })}</p>
          <Button block size="lg" onClick={() => onFinish?.({ skipped: false })}>
            {t('lesson.next')}
          </Button>
        </div>
      )}
    </div>
  )
}
