// =========================================================
// RealOrTextbookGame — มินิเกม "Real or Textbook?" (ส่วนที่ 8.2): อ่านสถานการณ์ แล้วเลือกประโยคที่เจ้าของภาษาพูดจริง
//   2 ตัวเลือก: แบบในตำรา (ถูกไวยากรณ์แต่แข็ง/ทางการเกิน) vs แบบที่พูดจริง
//   เลือกแล้ว → ป้าย "ใช้จริง" / "ในตำรา" + เหตุผลภาษาไทย + เล่นเสียงประโยคที่พูดจริง → กด "ต่อไป" (อ่านเหตุผลได้ไม่รีบ)
//   เลือกครั้งเดียวต่อรอบ ไม่มีหัวใจ / ไม่ใช้คำว่า "ผิด" — ประโยคในตำราไม่ได้ผิด แค่ไม่ค่อยมีใครพูด
// props (ชุดเดียวกับเกมอื่น):
//   items         = คู่หลักที่เล่นก่อน (textbookVsReal[] ของสถานการณ์นั้น)
//   pool          = คู่ที่ใช้เติมให้ครบ 5 รอบ
//   onRoundResult = (item, firstTry) => void
//   onFinish      = () => void
// ใช้ในหน้าคลังวลี (ทั้งชุด / รายสถานการณ์) — บท Stage 5+ จะใช้เมื่อข้อในบทมีประโยค "แบบตำรา" คู่กัน (ขั้นที่ 27)
// =========================================================
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen, CircleHelp, MessageCircle } from 'lucide-react'
import { buildRotRounds } from '../../utils/realOrTextbook'
import { useSpeech } from '../../hooks/useSpeech'
import Button from '../Button'
import styles from './RealOrTextbookGame.module.css'

export default function RealOrTextbookGame({ items, pool = items, onRoundResult, onFinish }) {
  const { t } = useTranslation()
  const { speak, stop } = useSpeech()
  const [rounds] = useState(() => buildRotRounds(items, { extra: pool }))
  const [roundIndex, setRoundIndex] = useState(0)
  const [chosen, setChosen] = useState(null) // ตัวเลือกที่แตะ (null = ยังไม่เลือก)
  const nextRef = useRef(null)
  const round = rounds[roundIndex]
  const answered = chosen !== null
  const correct = answered && chosen.kind === 'real'
  const last = roundIndex + 1 >= rounds.length

  // ออกจากเกมกลางคัน → หยุดเสียง
  useEffect(() => () => stop(), [stop])

  function choose(option) {
    if (answered) return
    setChosen(option)
    onRoundResult?.(round.item, option.kind === 'real')
    speak(round.answer, { key: `rot:${roundIndex}` })
    setTimeout(() => nextRef.current?.focus(), 0)
  }

  function next() {
    if (last) {
      onFinish?.()
      return
    }
    setChosen(null)
    setRoundIndex(roundIndex + 1)
  }

  function optionClass(option) {
    if (!answered) return styles.option
    return `${styles.option} ${option.kind === 'real' ? styles.real : styles.textbook}`
  }

  return (
    <div className={styles.game}>
      <div className={styles.header}>
        <span className={styles.title}>
          <CircleHelp className={styles.titleIcon} aria-hidden="true" />
          {t('game.rotTitle')}
        </span>
        <span className={styles.round}>{t('game.round', { n: roundIndex + 1, total: rounds.length })}</span>
      </div>

      <div className={styles.prompt}>
        <span className={styles.promptLabel}>{t('game.rotSituation')}</span>
        <span className={styles.promptText} lang="th">
          {round.prompt}
        </span>
      </div>
      <p className={styles.question}>{t('game.rotQuestion')}</p>

      <div className={styles.options}>
        {round.options.map((option) => (
          <button
            key={`${roundIndex}-${option.kind}`}
            type="button"
            className={optionClass(option)}
            disabled={answered}
            aria-pressed={chosen?.kind === option.kind}
            onClick={() => choose(option)}
          >
            <span className={styles.optionText} lang="en">
              {option.text}
            </span>
            {answered && (
              <span className={styles.badge}>
                {option.kind === 'real' ? (
                  <MessageCircle className={styles.badgeIcon} aria-hidden="true" />
                ) : (
                  <BookOpen className={styles.badgeIcon} aria-hidden="true" />
                )}
                {t(option.kind === 'real' ? 'game.rotReal' : 'game.rotTextbook')}
              </span>
            )}
          </button>
        ))}
      </div>

      {answered && (
        <div className={`${styles.feedback} ${correct ? styles.feedbackGood : styles.feedbackRetry}`} role="status">
          <p className={styles.feedbackTitle}>
            {correct ? t('game.rotCorrect') : t('game.rotTextbookPicked', { real: round.answer })}
          </p>
          <p className={styles.note} lang="th">
            {round.noteTh}
          </p>
        </div>
      )}

      {answered && (
        <Button block size="lg" ref={nextRef} onClick={next}>
          {last ? t('game.rotSeeResult') : t('lesson.next')}
        </Button>
      )}
    </div>
  )
}
