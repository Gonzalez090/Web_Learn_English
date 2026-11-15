// =========================================================
// RhymeFillStep — ขั้น "เติมคำท้ายที่คล้องจอง" (Stage 5 คำคล้องจอง — ฝึกฟังเสียงท้ายคำ)
//   เหมือนพ่อแม่ร้องเพลงแล้วเว้นคำท้ายให้ลูกต่อ: ได้ยินบรรทัดแรกของคู่ → เห็นบรรทัดที่สองแบบเว้นคำท้าย
//   → แตะคำที่คล้องจอง (เสียงท้ายเหมือนคำท้ายบรรทัดแรก) — ตัวเลือกอื่นเป็นคำท้ายของคู่อื่นในเพลงเดียวกัน
//   ถูก → คำเติมลงช่อง + ร้องทั้งคู่ให้ฟัง / แตะคำอื่นได้ไม่จำกัด (คำที่ไม่ใช่จะจางลง) — ถูกตั้งแต่ครั้งแรก = ผ่าน
// props: item (บรรทัดที่ 2 ของคู่ ที่เตรียมแล้ว: question = บรรทัดแรก, rhymeFill), onDone({ firstTry })
// =========================================================
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CircleCheck } from 'lucide-react'
import { useSpeech } from '../../hooks/useSpeech'
import { sameWord, splitLastWord } from '../../utils/lessonItems'
import Picture from '../Picture'
import Button from '../Button'
import LineButton from './LineButton'
import styles from './Step.module.css'
import fillStyles from './RhymeFillStep.module.css'

export default function RhymeFillStep({ item, onDone }) {
  const { t } = useTranslation()
  const { speak } = useSpeech()
  const fill = item.rhymeFill
  const prompt = splitLastWord(item.question) ?? { before: item.question ?? '', word: '', after: '' }
  // สีคำคล้องจองตามคู่ (เหมือนขั้นฟังทั้งเพลง): คู่ที่ 1, 3, … เหลือง / คู่ที่ 2, 4, … เขียว
  const rhymeClass = `${fillStyles.rhyme} ${fill.couplet % 2 ? fillStyles.coupletB : ''}`
  const [wrong, setWrong] = useState([])
  const [solved, setSolved] = useState(false)
  const promptKey = `${item.id}:rhyme-prompt:normal`
  const lineKey = `${item.id}:rhyme-line:normal`

  // เปิดขั้น → ร้องบรรทัดแรกของคู่ให้ฟัง
  useEffect(() => {
    speak(item.question, { key: promptKey })
    // ร้องใหม่เฉพาะเมื่อเปลี่ยนข้อ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id])

  function choose(choice) {
    if (solved) return
    if (sameWord(choice, fill.word)) {
      setSolved(true)
      speak([item.question, item.target], { key: lineKey }) // ร้องทั้งคู่ → ได้ยินเสียงท้ายที่เหมือนกัน
    } else if (!wrong.includes(choice)) {
      setWrong((current) => [...current, choice])
    }
  }

  return (
    <div className={styles.step}>
      <p className={styles.instruction}>{t('rhyme.fill', { word: fill.rhymesWith })}</p>
      <Picture image={item.image} size="fill" alt="" className={styles.pictureSmall} />

      <div className={fillStyles.couplet}>
        <div className={fillStyles.line}>
          <LineButton text={item.question} speakKey={promptKey} label={t('rhyme.playPrompt')} />
          <p className={fillStyles.text} lang="en">
            {prompt.before}{' '}
            <mark className={rhymeClass}>{prompt.word}</mark>
            {prompt.after}
          </p>
        </div>
        <div className={fillStyles.line}>
          {solved ? (
            <LineButton text={[item.question, item.target]} speakKey={lineKey} label={t('rhyme.playCouplet')} />
          ) : (
            <span className={fillStyles.spacer} aria-hidden="true" />
          )}
          <p className={fillStyles.text} lang="en">
            {fill.before}{' '}
            {solved ? (
              <mark className={rhymeClass}>{fill.word}</mark>
            ) : (
              <span className={fillStyles.blank} role="img" aria-label={t('rhyme.blank')} />
            )}
            {fill.after}
          </p>
        </div>
      </div>

      <div className={fillStyles.choices} role="group" aria-label={t('rhyme.choices')}>
        {fill.choices.map((choice) => {
          const isAnswer = solved && sameWord(choice, fill.word)
          return (
            <button
              key={choice}
              type="button"
              lang="en"
              className={isAnswer ? `${fillStyles.choice} ${fillStyles.correct}` : fillStyles.choice}
              disabled={solved || wrong.includes(choice)}
              onClick={() => choose(choice)}
            >
              {isAnswer && <CircleCheck className={fillStyles.icon} aria-hidden="true" />}
              {choice}
            </button>
          )
        })}
      </div>

      <p className={solved ? fillStyles.praise : styles.hint} role="status">
        {solved
          ? t('rhyme.correct', { a: prompt.word, b: fill.word })
          : wrong.length > 0
            ? t('rhyme.tryAgain')
            : t('rhyme.fillHint')}
      </p>

      <div className={styles.actions}>
        {solved && (
          <Button block size="lg" onClick={() => onDone({ firstTry: wrong.length === 0 })}>
            {t('lesson.next')}
          </Button>
        )}
      </div>
    </div>
  )
}
