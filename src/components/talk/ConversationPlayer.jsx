// =========================================================
// ConversationPlayer — เล่นบทสนทนาสุ่ม 1 รอบ (ส่วนที่ 6)
//   ตาอีกฝ่าย: กล่องแชตซ้าย + เล่นเสียงอัตโนมัติ (แบบที่สุ่มได้รอบนี้) แล้วขึ้นบรรทัดถัดไปเอง
//   ตาเรา: คำใบ้ภาษาไทย (ต้องพูดอะไร) + ตัวเลือก 2–3 แบบ (กันเอง / ทั่วไป / สุภาพ — ฟังได้) → แตะไมค์พูดแบบไหนก็ได้
//          ตรวจ: ใกล้ตัวเลือก ≥ 70% หรือมีคำสำคัญครบ (utils/conversation.js checkUserTurn) → ผ่านแล้วขึ้นกล่องแชตขวา
//          ยังไม่ผ่าน → ทวนกลับด้วยตัวเลือกแรก / ลองครบ 3 ครั้ง (หรือไมค์ใช้ไม่ได้) → "ไปต่อ" (บรรทัดนั้นเข้ารายการทบทวน)
//   จบ → onFinish({ outcomes: { [lineId]: 'passed' | 'skipped' }, said: { [lineId]: ข้อความที่พูด } })
// props: scenario, conversation (ผลจาก buildConversation), onLinePass(line), onFinish
// =========================================================
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Languages, MessageCircleQuestion } from 'lucide-react'
import { getStage } from '../../data'
import { useSpeech } from '../../hooks/useSpeech'
import { useLocalized } from '../../hooks/useLocalized'
import { useSentenceDisplay } from '../../hooks/useSentenceDisplay'
import { checkUserTurn } from '../../utils/conversation'
import { MAX_ATTEMPTS_BEFORE_SKIP } from '../../utils/lessonSteps'
import { isBlockingMicError, isRecognitionSupported } from '../../utils/recognition'
import { scrollIntoViewGently } from '../../utils/scroll'
import MicButton from '../MicButton'
import Button from '../Button'
import DialogueBubble from '../lesson/DialogueBubble'
import LineButton from '../lesson/LineButton'
import stepStyles from '../lesson/Step.module.css'
import styles from './ConversationPlayer.module.css'

const OTHER_PAUSE_MS = 500 // พักหลังอีกฝ่ายพูดจบ
const PASS_PAUSE_MS = 1400 // พูดผ่านแล้ว โชว์ผลแป๊บหนึ่งก่อนไปต่อ

const npcSpeakKey = (line) => `talk:${line.id}`

export default function ConversationPlayer({ scenario, conversation, onLinePass, onFinish }) {
  const { t } = useTranslation()
  const loc = useLocalized()
  const { speak } = useSpeech()
  // บทสนทนาสุ่มเป็นภาษาผู้ใหญ่ → แสดงข้อความเลยแบบ Stage 5 (ความหมายไทยตามการตั้งค่า)
  const display = useSentenceDisplay(useMemo(() => getStage(5), []))
  const { lines } = conversation
  const [turn, setTurn] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [passed, setPassed] = useState(false)
  const [blocked, setBlocked] = useState(!isRecognitionSupported)
  const [outcomes, setOutcomes] = useState({})
  const [said, setSaid] = useState({})
  const activeRef = useRef(null)
  const panelRef = useRef(null)
  const callbacks = useRef({ onLinePass, onFinish })
  useEffect(() => {
    callbacks.current = { onLinePass, onFinish }
  })

  const line = lines[turn]
  const finished = turn >= lines.length
  const myTurn = line?.speaker === 'user'
  const canSkip = attempts >= MAX_ATTEMPTS_BEFORE_SKIP || blocked
  const partner = loc(scenario.partner, 'name')

  function advance() {
    setTurn((value) => value + 1)
    setAttempts(0)
    setPassed(false)
  }

  // ตาอีกฝ่าย: พูด แล้วไปบรรทัดถัดไปเอง (เล่นเสียงไม่ได้ก็ไปต่อ ไม่ค้าง)
  useEffect(() => {
    if (!line || myTurn) return undefined
    let active = true
    let timer
    speak(line.target, { key: npcSpeakKey(line) }).finally(() => {
      if (active) timer = setTimeout(advance, OTHER_PAUSE_MS)
    })
    return () => {
      active = false
      clearTimeout(timer)
    }
    // ทำใหม่เฉพาะเมื่อเปลี่ยนบรรทัด
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn])

  useEffect(() => {
    if (!passed) return undefined
    const timer = setTimeout(advance, PASS_PAUSE_MS)
    return () => clearTimeout(timer)
  }, [passed])

  // จบบทสนทนา → แจ้งผล (ครั้งเดียว)
  useEffect(() => {
    if (finished) callbacks.current.onFinish?.({ outcomes, said })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished])

  useEffect(() => {
    scrollIntoViewGently(myTurn ? panelRef.current : activeRef.current)
  }, [turn, myTurn])

  function handleResult(result) {
    setAttempts((count) => count + 1)
    setTimeout(() => scrollIntoViewGently(panelRef.current), 60)
    if (!result.passed || passed) return
    setPassed(true)
    // กล่องแชตของเรา: freeAnswer (บอกชื่อตัวเอง) ใช้สิ่งที่ได้ยิน / ที่เหลือใช้ตัวเลือกที่ใกล้ที่สุด
    const text = line.freeAnswer ? result.heard : (result.matched ?? line.options[0].text)
    setSaid((current) => ({ ...current, [line.id]: text }))
    setOutcomes((current) => ({ ...current, [line.id]: 'passed' }))
    callbacks.current.onLinePass?.(line)
  }

  function handleError(error) {
    setTimeout(() => scrollIntoViewGently(panelRef.current), 60)
    if (isBlockingMicError(error)) setBlocked(true)
    else setAttempts((count) => count + 1)
  }

  function skip() {
    setSaid((current) => ({ ...current, [line.id]: line.options[0].text }))
    setOutcomes((current) => ({ ...current, [line.id]: 'skipped' }))
    advance()
  }

  const visible = lines.slice(0, Math.min(turn + 1, lines.length))

  return (
    <div className={stepStyles.step}>
      <div className={stepStyles.chat}>
        {visible.map((entry, index) => {
          const mine = entry.speaker === 'user'
          if (mine && !said[entry.id]) return null // ตาเรายังไม่ได้พูด → ยังไม่มีกล่องแชต
          return (
            <DialogueBubble
              key={entry.id}
              ref={index === turn ? activeRef : undefined}
              line={mine ? { id: entry.id, target: said[entry.id] } : entry}
              speakerName={mine ? t('talk.you') : partner}
              side={mine ? 'right' : 'left'}
              active={index === turn && !mine}
              status={outcomes[entry.id]}
              display={mine ? undefined : display}
              speakKey={mine ? `talk:${entry.id}:me` : npcSpeakKey(entry)}
            />
          )
        })}
      </div>

      {display.canRevealMeaning && (
        <Button size="sm" variant="secondary" icon={Languages} onClick={display.revealMeaning}>
          {t('card.showMeaning')}
        </Button>
      )}

      <div ref={panelRef} className={stepStyles.actions}>
        {myTurn && (
          <div className={styles.turn}>
            <p className={styles.hint} lang="th">
              <MessageCircleQuestion className={styles.hintIcon} aria-hidden="true" />
              <span>
                <span className={styles.hintLabel}>{t('talk.yourTurn')}</span> {line.hintTh}
              </span>
            </p>
            <p className={styles.optionsLabel}>{t('talk.options')}</p>
            <ul className={styles.options}>
              {line.options.map((option, index) => (
                <li key={option.text} className={styles.option}>
                  <span className={styles.optionText} lang="en">
                    {option.text}
                  </span>
                  <span className={styles.register}>{t(`register.${option.register}`)}</span>
                  <LineButton text={option.text} speakKey={`talk:${line.id}:opt${index}`} label={t('talk.hearOption')} />
                </li>
              ))}
            </ul>
            <MicButton
              key={line.id}
              target={line.options[0].text}
              evaluate={(alternatives, attempt) => checkUserTurn(line, alternatives, { attempt })}
              speakId={`talk:${line.id}:mic`}
              label={t('talk.speak')}
              onResult={handleResult}
              onError={handleError}
            />
            {!passed && canSkip && (
              <Button block variant="secondary" onClick={skip}>
                {t('lesson.skip')}
              </Button>
            )}
            {!passed && !canSkip && <p className={stepStyles.hint}>{t('talk.speakHint')}</p>}
          </div>
        )}
        {!myTurn && !finished && <p className={stepStyles.hint}>{t('talk.otherSpeaking', { name: partner })}</p>}
      </div>
    </div>
  )
}
