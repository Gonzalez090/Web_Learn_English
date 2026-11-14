// =========================================================
// LessonPlayer — ตัวเล่นบทเรียน (ส่วนที่ 4)
// - ลำดับขั้นอ่านจาก utils/lessonSteps.js: ทีละข้อ (ฟัง → พูดตาม → สลับคำ) → มินิเกม → (Stage 4+) รอบใช้เอง
// - ได้ XP ทันทีที่ทำแต่ละขั้นสำเร็จ (ออกกลางคันก็ได้ XP ที่ทำไปแล้ว) + แจ้งเหตุการณ์ให้ภารกิจรายวัน
// - ข้อที่พูดไม่ผ่าน / เกมไม่ผ่านรอบนั้น → เข้ารายการทบทวน
// - Stage 4: กด "ดูข้อความ" ข้อไหนแล้ว จำไว้ทั้งบท (ขั้นพูดตามไม่ต้องกดซ้ำ) — รอบใช้เองปิดข้อความเสมอ
// - จบบท → บันทึกผล + ปลดล็อก Stage ถัดไป → ไปหน้าสรุป
// props:
//   lesson, stage
//   onlyItemIds = ฝึกซ้ำเฉพาะข้อเหล่านี้ (จากปุ่ม "ฝึกซ้ำข้อที่พลาด" ในหน้าสรุป)
// =========================================================
import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildLessonSteps, GAME_ROUND_XP, LESSON_FLOWS, XP } from '../../utils/lessonSteps'
import { useProgressStore } from '../../store/progressStore'
import { useReviewStore } from '../../store/reviewStore'
import LookListenStep from './LookListenStep'
import ListenSentenceStep from './ListenSentenceStep'
import SpeakStep from './SpeakStep'
import SwapStep from './SwapStep'
import ListenContextStep from './ListenContextStep'
import PlayerFrame from './PlayerFrame'
import ListenTapGame from '../games/ListenTapGame'
import ShadowKaraokeGame from '../games/ShadowKaraokeGame'
import WordSwapRaceGame from '../games/WordSwapRaceGame'

// มินิเกมที่แทรกในบทได้ (ทุกเกมรับ props ชุดเดียวกัน: items, pool, onRoundResult, onFinish)
const GAMES = { 'listen-tap': ListenTapGame, 'shadow-karaoke': ShadowKaraokeGame, 'word-swap-race': WordSwapRaceGame }

export default function LessonPlayer({ lesson, stage, onlyItemIds }) {
  const navigate = useNavigate()
  const addXp = useProgressStore((state) => state.addXp)
  const trackEvent = useProgressStore((state) => state.trackEvent)
  const completeLesson = useProgressStore((state) => state.completeLesson)
  const addMissed = useReviewStore((state) => state.addMissed)

  const flow = LESSON_FLOWS[lesson.type]
  const items = useMemo(() => {
    const selected = onlyItemIds?.length ? lesson.items.filter((item) => onlyItemIds.includes(item.id)) : []
    return selected.length ? selected : lesson.items
  }, [lesson, onlyItemIds])
  const steps = useMemo(() => buildLessonSteps(flow, items), [flow, items])

  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState({}) // { [itemId]: { text, meaning } } ข้อที่กดเปิดดูแล้ว
  // ผลระหว่างเล่น (ใช้ ref เพราะไม่ต้อง render ใหม่ทุกครั้งที่เปลี่ยน)
  const xpRef = useRef(0)
  const missedRef = useRef(new Set())
  const checksRef = useRef({ total: 0, passed: 0 }) // ใช้คิดคะแนนท้ายบท
  const gameCheckedRef = useRef(new Set()) // ข้อที่เกมรายงานผลแล้ว (นับคะแนนครั้งเดียว)

  function earn(amount) {
    xpRef.current += amount
    addXp(amount)
  }

  function check(item, passed) {
    checksRef.current.total += 1
    if (passed) checksRef.current.passed += 1
    else missedRef.current.add(item.id)
  }

  // กด "ดูข้อความ" ('text') / "ดูความหมาย" ('meaning') ของข้อไหนแล้ว → ขั้นต่อ ๆ ไปของข้อนั้นเปิดไว้เลย
  function reveal(itemId, kind) {
    setRevealed((current) => ({ ...current, [itemId]: { ...current[itemId], [kind]: true } }))
  }

  function finish() {
    const { total, passed } = checksRef.current
    const score = total === 0 ? 100 : Math.round((passed / total) * 100)
    const missedIds = items.filter((item) => missedRef.current.has(item.id)).map((item) => item.id)
    const newlyUnlocked = completeLesson(lesson.id, score)
    addMissed(lesson.id, missedIds)
    trackEvent('lessonComplete')
    if (score === 100) trackEvent('perfectLesson')
    navigate(`/lesson/${lesson.id}/summary`, {
      replace: true,
      state: { xp: xpRef.current, score, missedIds, itemIds: items.map((item) => item.id), newlyUnlocked },
    })
  }

  function next() {
    if (index + 1 >= steps.length) finish()
    else setIndex(index + 1)
  }

  // ผลของขั้นพูด (พูดตาม / ใช้เอง)
  function speakDone(item, passed, xp) {
    if (passed) {
      earn(xp)
      trackEvent('speakPass')
    }
    check(item, passed)
    next()
  }

  const step = steps[index]
  const Game = step.kind === 'game' ? GAMES[step.game] : null

  return (
    <PlayerFrame exitTo={`/learn/${stage.id}`} index={index} total={steps.length} stepKey={`step-${index}`}>
      {step.kind === 'lookListen' && (
        <LookListenStep
          item={step.item}
          onDone={() => {
            earn(XP.listen)
            trackEvent('listen')
            next()
          }}
        />
      )}
      {step.kind === 'listenSentence' && (
        <ListenSentenceStep
          item={step.item}
          stage={stage}
          revealed={revealed[step.item.id]}
          onReveal={(kind) => reveal(step.item.id, kind)}
          onDone={() => {
            earn(XP.listen)
            trackEvent('listen')
            next()
          }}
        />
      )}
      {step.kind === 'listenContext' && (
        <ListenContextStep
          item={step.item}
          stage={stage}
          revealed={revealed[step.item.id]}
          onReveal={(kind) => reveal(step.item.id, kind)}
          onDone={() => {
            earn(XP.listen)
            trackEvent('listen')
            next()
          }}
        />
      )}
      {step.kind === 'swap' && (
        // สลับคำ: ไม่นับเป็นข้อสอบ (ไม่มีผ่าน/ไม่ผ่าน) — ลองสลับได้ XP ฟัง / พูดประโยคใหม่ผ่านได้ XP พูดตามเพิ่ม
        <SwapStep
          item={step.item}
          stage={stage}
          revealed={revealed[step.item.id]}
          onReveal={(kind) => reveal(step.item.id, kind)}
          onDone={({ spoke }) => {
            earn(XP.swap)
            trackEvent('listen')
            if (spoke) {
              earn(XP.speak)
              trackEvent('speakPass')
            }
            next()
          }}
        />
      )}
      {step.kind === 'speak' && (
        <SpeakStep
          item={step.item}
          stage={stage}
          revealed={revealed[step.item.id]}
          onReveal={(kind) => reveal(step.item.id, kind)}
          onDone={({ passed }) => speakDone(step.item, passed, XP.speak)}
        />
      )}
      {step.kind === 'speakOwn' && (
        <SpeakStep
          item={step.item}
          stage={stage}
          mode="own"
          onDone={({ passed }) => speakDone(step.item, passed, XP.speakOwn)}
        />
      )}
      {Game && (
        <Game
          items={items}
          pool={lesson.items}
          onRoundResult={(item, passed) => {
            if (passed) {
              earn(GAME_ROUND_XP[step.game])
              trackEvent('gameCorrect')
            }
            // นับคะแนนท้ายบทข้อละครั้งต่อเกม (Word Swap Race เล่นข้อเดิมได้หลายรอบ)
            if (gameCheckedRef.current.has(item.id)) return
            gameCheckedRef.current.add(item.id)
            check(item, passed)
          }}
          onFinish={(outcome) => {
            if (!outcome?.skipped) trackEvent('gamePlay')
            next()
          }}
        />
      )}
    </PlayerFrame>
  )
}
