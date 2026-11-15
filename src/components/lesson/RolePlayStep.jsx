// =========================================================
// RolePlayStep — เล่นบทบาทในบทสนทนา (Stage 5): เราเป็นตัวละครหนึ่ง ระบบพูดบทของอีกฝ่าย แล้วรอเราพูด
//   mode 'shadow' — เห็นบทของเรา + ฟังตัวอย่างได้ (ปกติ/ช้า) + ป้ายเสียงพูดเชื่อม
//   mode 'own'    — ซ่อนบทของเรา เห็นแค่ความหมายไทยเป็นโจทย์ (ใช้เอง) — พูดผ่าน/ข้ามแล้วค่อยเห็นประโยค
// - บทของอีกฝ่าย: เล่นเสียงอัตโนมัติ แล้วขึ้นบรรทัดถัดไปเอง
// - ตาเรา: แตะไมค์พูด → คะแนนรายคำ + ทวนกลับแบบพ่อแม่ (recast) → ผ่านแล้วไปต่อเอง
//          ลองครบ 3 ครั้ง (หรือไมค์ใช้ไม่ได้) → กด "ไปต่อ" ได้ (บรรทัดนั้นเข้ารายการทบทวน)
// - จบบทสนทนา → "ต่อไป"
// props:
//   lesson (speakers, scene), items (บรรทัดที่เตรียมแล้ว), role (id ผู้พูดที่เราเล่น), mode, stage,
//   revealed / onReveal (ความหมายที่เปิดดูแล้วทั้งบท), onLineResult(item, passed) — ครั้งเดียวต่อบรรทัดของเรา, onDone
// =========================================================
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import { useSpeech } from '../../hooks/useSpeech'
import { useLocalized } from '../../hooks/useLocalized'
import { useSentenceDisplay } from '../../hooks/useSentenceDisplay'
import { lineSpeakKey } from '../../hooks/useLinePlayer'
import { speakerOf } from '../../utils/lessonItems'
import { MAX_ATTEMPTS_BEFORE_SKIP } from '../../utils/lessonSteps'
import { isBlockingMicError, isRecognitionSupported } from '../../utils/recognition'
import { scrollIntoViewGently } from '../../utils/scroll'
import Picture from '../Picture'
import SpeakButton from '../SpeakButton'
import MicButton from '../MicButton'
import Button from '../Button'
import DialogueBubble from './DialogueBubble'
import styles from './Step.module.css'
import playStyles from './RolePlayStep.module.css'

const OTHER_PAUSE_MS = 500 // พักหลังอีกฝ่ายพูดจบ ก่อนขึ้นบรรทัดถัดไป
const PASS_PAUSE_MS = 1500 // พูดผ่านแล้ว โชว์ผลแป๊บหนึ่งก่อนไปต่อ

export default function RolePlayStep({
  lesson,
  items,
  role,
  mode = 'shadow',
  stage,
  revealed,
  onReveal,
  onLineResult,
  onDone,
}) {
  const { t } = useTranslation()
  const loc = useLocalized()
  const { speak } = useSpeech()
  const display = useSentenceDisplay(stage, { revealed, onReveal })
  const own = mode === 'own'
  // กันพลาด: ยังไม่ได้เลือกบท → เล่นเป็นผู้พูดคนสุดท้าย
  const myRole = role ?? lesson.speakers?.at(-1)?.id

  const [turn, setTurn] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [passed, setPassed] = useState(false)
  const [blocked, setBlocked] = useState(!isRecognitionSupported)
  const [outcomes, setOutcomes] = useState({}) // { [lineId]: 'passed' | 'skipped' }
  const activeRef = useRef(null)
  const panelRef = useRef(null)
  // เก็บ callback ล่าสุดไว้ใน ref → เรียกจาก timer/effect ได้โดยไม่ต้องเริ่ม effect ใหม่
  const onLineResultRef = useRef(onLineResult)
  useEffect(() => {
    onLineResultRef.current = onLineResult
  })

  const line = items[turn]
  const finished = turn >= items.length
  const myTurn = Boolean(line) && line.speaker === myRole
  const canSkip = attempts >= MAX_ATTEMPTS_BEFORE_SKIP || blocked
  const nameOf = (entry) => loc(speakerOf(lesson, entry), 'name')

  function advance() {
    setTurn((value) => value + 1)
    setAttempts(0)
    setPassed(false)
  }

  // ตาอีกฝ่าย: พูดบรรทัดนั้น แล้วขึ้นบรรทัดถัดไปเอง (เล่นเสียงไม่ได้ก็ไปต่อ ไม่ค้าง)
  useEffect(() => {
    if (!line || myTurn) return undefined
    let active = true
    let timer
    speak(line.target, { key: lineSpeakKey(line) }).finally(() => {
      if (active) timer = setTimeout(advance, OTHER_PAUSE_MS)
    })
    return () => {
      active = false
      clearTimeout(timer)
    }
    // ทำใหม่เฉพาะเมื่อเปลี่ยนบรรทัด
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn])

  // พูดผ่านแล้ว → โชว์ผลแป๊บหนึ่ง แล้วไปบรรทัดถัดไปเอง
  useEffect(() => {
    if (!passed) return undefined
    const timer = setTimeout(advance, PASS_PAUSE_MS)
    return () => clearTimeout(timer)
  }, [passed])

  // เลื่อนจอ: ตาเรา/จบแล้ว → ให้เห็นช่องไมค์/ปุ่ม / ตาอีกฝ่าย → ให้เห็นบรรทัดที่กำลังพูด
  useEffect(() => {
    scrollIntoViewGently(myTurn || finished ? panelRef.current : activeRef.current)
  }, [turn, myTurn, finished])

  // ได้ผลแล้ว → เลื่อนจอให้เห็นผล/คำทวนกลับ (กล่องผลอยู่ใต้ไมค์ บนมือถือมักตกขอบจอ)
  function showPanel() {
    setTimeout(() => scrollIntoViewGently(panelRef.current), 60)
  }

  function handleResult(result) {
    setAttempts((count) => count + 1)
    showPanel()
    if (!result.passed || passed) return
    setPassed(true)
    setOutcomes((current) => ({ ...current, [line.id]: 'passed' }))
    onLineResultRef.current?.(line, true)
  }

  function handleError(error) {
    showPanel()
    if (isBlockingMicError(error)) setBlocked(true)
    else setAttempts((count) => count + 1) // เช่น ไม่ได้ยินเสียง = นับเป็น 1 ครั้ง
  }

  function skip() {
    setOutcomes((current) => ({ ...current, [line.id]: 'skipped' }))
    onLineResultRef.current?.(line, false)
    advance()
  }

  const visible = finished ? items : items.slice(0, turn + 1)
  const scene = loc(lesson, 'scene')

  return (
    <div className={styles.step}>
      <p className={styles.instruction}>
        {t(own ? 'dialogue.rolePlayOwn' : 'dialogue.rolePlay', { name: loc(lesson.speakers?.find((s) => s.id === myRole), 'name') })}
      </p>
      <div className={styles.sceneRow}>
        <Picture image={items[0]?.image} size="sm" alt={scene} />
        <p className={playStyles.sceneText}>{scene}</p>
      </div>

      <div className={styles.chat}>
        {visible.map((entry, index) => {
          const mine = entry.speaker === myRole
          const current = index === turn
          const hideMine = own && mine && !outcomes[entry.id]
          return (
            <DialogueBubble
              key={entry.id}
              ref={current ? activeRef : undefined}
              line={entry}
              speakerName={mine ? t('dialogue.you', { name: nameOf(entry) }) : nameOf(entry)}
              side={mine ? 'right' : 'left'}
              active={current}
              status={outcomes[entry.id]}
              cue={hideMine ? entry.translationTh : null}
              display={display}
              details={current && mine && !own}
              speakKey={lineSpeakKey(entry)}
              canReplay={!(current && mine)}
            />
          )
        })}
      </div>

      {display.canRevealMeaning && (
        <Button size="sm" variant="secondary" icon={Languages} onClick={display.revealMeaning}>
          {t('card.showMeaning')}
        </Button>
      )}

      <div ref={panelRef} className={styles.actions}>
        {myTurn && (
          <div className={playStyles.turn}>
            {!own && <SpeakButton text={line.target} id={`${line.id}:roleplay`} />}
            <MicButton
              key={`${line.id}:${mode}`}
              target={line.target}
              acceptAlso={line.acceptAlso}
              recast={line}
              speakId={`${line.id}:roleplay:${mode}`}
              label={own ? t('mic.answer') : undefined}
              onResult={handleResult}
              onError={handleError}
            />
            {!passed && canSkip && (
              <Button block variant="secondary" onClick={skip}>
                {t('lesson.skip')}
              </Button>
            )}
            {!passed && !canSkip && (
              <p className={styles.hint}>{t(own ? 'dialogue.rolePlayOwnHint' : 'dialogue.rolePlayHint')}</p>
            )}
          </div>
        )}
        {!myTurn && !finished && <p className={styles.hint}>{t('dialogue.otherSpeaking', { name: nameOf(line) })}</p>}
        {finished && (
          <>
            <p className={playStyles.done}>{t('dialogue.done')}</p>
            <Button block size="lg" onClick={onDone}>
              {t('lesson.next')}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
