// =========================================================
// LessonPlayer — ตัวเล่นบทเรียน (ส่วนที่ 4)
// - ลำดับขั้นอ่านจาก utils/lessonSteps.js: ขั้นทั้งบท (ฟังทั้งบท/เลือกบท/เล่นบทบาท) → ทีละข้อ (ฟัง → พูดตาม → สลับคำ)
//   → มินิเกม → (Stage 4+) รอบใช้เอง / Stage 7 = แบบฝึกเขียนทีละข้อ (WriteStep)
// - ข้อของบทสนทนา/คำคล้องจองเตรียมก่อนเล่น (บรรทัดก่อนหน้าเป็นตัวนำ, ขั้นเติมคำ) — utils/lessonItems.js
// - ได้ XP ทันทีที่ทำแต่ละขั้นสำเร็จ (ออกกลางคันก็ได้ XP ที่ทำไปแล้ว) + แจ้งเหตุการณ์ให้ภารกิจรายวัน
// - ข้อที่พูดไม่ผ่าน / เกมไม่ผ่านรอบนั้น → เข้ารายการทบทวน
// - Stage 4: กด "ดูข้อความ" ข้อไหนแล้ว จำไว้ทั้งบท (ขั้นพูดตามไม่ต้องกดซ้ำ) — รอบใช้เองปิดข้อความเสมอ
//   ขั้นทั้งบท (บทสนทนา/เรื่องเล่า/คำคล้องจอง) จำการเปิดดูความหมายไว้ที่ id ของบท
// - จบบท → บันทึกผล + ปลดล็อก Stage ถัดไป → ไปหน้าสรุป (แสดงเฉพาะข้อที่ได้ตรวจจริง เช่น บทสนทนา = บรรทัดของเรา)
// props:
//   lesson, stage
//   onlyItemIds = ฝึกซ้ำเฉพาะข้อเหล่านี้ (จากปุ่ม "ฝึกซ้ำข้อที่พลาด" ในหน้าสรุป)
// =========================================================
import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildLessonSteps, GAME_ROUND_XP, LESSON_FLOWS, READ_VARIANTS, writeXp, XP } from '../../utils/lessonSteps'
import { prepareLessonItems, readAloudItems } from '../../utils/lessonItems'
import { useProgressStore } from '../../store/progressStore'
import { useReviewStore } from '../../store/reviewStore'
import LookListenStep from './LookListenStep'
import ListenSentenceStep from './ListenSentenceStep'
import SpeakStep from './SpeakStep'
import SwapStep from './SwapStep'
import ListenContextStep from './ListenContextStep'
import ListenDialogueStep from './ListenDialogueStep'
import ChooseRoleStep from './ChooseRoleStep'
import RolePlayStep from './RolePlayStep'
import ListenStoryStep from './ListenStoryStep'
import TellStoryStep from './TellStoryStep'
import ListenRhymeStep from './ListenRhymeStep'
import RhymeFillStep from './RhymeFillStep'
import PhonicsIntroStep from './PhonicsIntroStep'
import ReadAloudStep from './ReadAloudStep'
import WriteStep from './WriteStep'
import PlayerFrame from './PlayerFrame'
import ListenTapGame from '../games/ListenTapGame'
import ShadowKaraokeGame from '../games/ShadowKaraokeGame'
import WordSwapRaceGame from '../games/WordSwapRaceGame'
import MinimalPairDuelGame from '../games/MinimalPairDuelGame'

// Read & Tap (Stage 6) = Listen & Tap แบบอ่านเอง
function ReadTapGame(props) {
  return <ListenTapGame {...props} mode="read" />
}

// มินิเกมที่แทรกในบทได้ (ทุกเกมรับ props ชุดเดียวกัน: items, pool, onRoundResult, onFinish)
const GAMES = {
  'listen-tap': ListenTapGame,
  'shadow-karaoke': ShadowKaraokeGame,
  'word-swap-race': WordSwapRaceGame,
  'minimal-pair-duel': MinimalPairDuelGame,
  'read-tap': ReadTapGame,
}

export default function LessonPlayer({ lesson, stage, onlyItemIds }) {
  const navigate = useNavigate()
  const addXp = useProgressStore((state) => state.addXp)
  const trackEvent = useProgressStore((state) => state.trackEvent)
  const completeLesson = useProgressStore((state) => state.completeLesson)
  const addMissed = useReviewStore((state) => state.addMissed)

  const flow = LESSON_FLOWS[lesson.type]
  // ทุกข้อของบท (เตรียมแล้ว) — ขั้นทั้งบท (ฟังทั้งบท/เล่นบทบาท) ใช้ชุดนี้เสมอ แม้ฝึกซ้ำเฉพาะข้อที่พลาด
  const allItems = useMemo(() => prepareLessonItems(lesson), [lesson])
  const { items, retry } = useMemo(() => {
    const selected = onlyItemIds?.length ? allItems.filter((item) => onlyItemIds.includes(item.id)) : []
    return selected.length ? { items: selected, retry: true } : { items: allItems, retry: false }
  }, [allItems, onlyItemIds])
  const steps = useMemo(() => buildLessonSteps(flow, items, { retry }), [flow, items, retry])

  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState({}) // { [itemId | lessonId]: { text, meaning } } ที่กดเปิดดูแล้ว
  const [role, setRole] = useState(null) // บทสนทนา: id ผู้พูดที่เราเล่น
  // ผลระหว่างเล่น (ใช้ ref เพราะไม่ต้อง render ใหม่ทุกครั้งที่เปลี่ยน)
  const xpRef = useRef(0)
  const missedRef = useRef(new Set())
  const checkedRef = useRef(new Set()) // ข้อที่ได้ตรวจจริง (หน้าสรุปแสดงเฉพาะข้อเหล่านี้)
  const checksRef = useRef({ total: 0, passed: 0 }) // ใช้คิดคะแนนท้ายบท
  const gameCheckedRef = useRef(new Set()) // `${เกม}:${ข้อ}` ที่เกมรายงานผลแล้ว (นับคะแนนครั้งเดียวต่อเกม)

  function earn(amount) {
    xpRef.current += amount
    addXp(amount)
  }

  function check(item, passed) {
    checkedRef.current.add(item.id)
    checksRef.current.total += 1
    if (passed) checksRef.current.passed += 1
    else missedRef.current.add(item.id)
  }

  // ฟังทั้งบทจบ (บทสนทนา/เรื่องเล่า/คำคล้องจอง) = ฟัง 1 ครั้งต่อบรรทัด/ภาพ
  function listenedWhole() {
    earn(XP.listen * allItems.length)
    trackEvent('listen', allItems.length)
    next()
  }

  // กด "ดูข้อความ" ('text') / "ดูความหมาย" ('meaning') ของข้อไหนแล้ว → ขั้นต่อ ๆ ไปของข้อนั้นเปิดไว้เลย
  function reveal(itemId, kind) {
    setRevealed((current) => ({ ...current, [itemId]: { ...current[itemId], [kind]: true } }))
  }

  function finish() {
    const { total, passed } = checksRef.current
    const score = total === 0 ? 100 : Math.round((passed / total) * 100)
    const missedIds = allItems.filter((item) => missedRef.current.has(item.id)).map((item) => item.id)
    // หน้าสรุปแสดงเฉพาะข้อที่ได้ตรวจจริง (บทสนทนา = บรรทัดของเรา) — ไม่มีการตรวจเลย → ทุกข้อที่เล่น
    const checked = allItems.filter((item) => checkedRef.current.has(item.id))
    const itemIds = (checked.length ? checked : items).map((item) => item.id)
    const newlyUnlocked = completeLesson(lesson.id, score)
    addMissed(lesson.id, missedIds)
    trackEvent('lessonComplete')
    if (score === 100) trackEvent('perfectLesson')
    navigate(`/lesson/${lesson.id}/summary`, {
      replace: true,
      state: { xp: xpRef.current, score, missedIds, itemIds, newlyUnlocked },
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
  // ขั้นทั้งบท: จำการเปิดดูความหมายไว้ที่ id ของบท (ฟังทั้งบทแล้วเปิด → ตอนเล่นบทบาทเปิดไว้ด้วย)
  const wholeReveal = { revealed: revealed[lesson.id], onReveal: (kind) => reveal(lesson.id, kind) }

  return (
    <PlayerFrame exitTo={`/learn/${stage.id}`} index={index} total={steps.length} stepKey={`step-${index}`}>
      {/* ---------- บทสนทนา ---------- */}
      {step.kind === 'listenDialogue' && (
        <ListenDialogueStep lesson={lesson} items={allItems} stage={stage} {...wholeReveal} onDone={listenedWhole} />
      )}
      {step.kind === 'chooseRole' && (
        <ChooseRoleStep
          lesson={lesson}
          items={allItems}
          onChoose={(speakerId) => {
            setRole(speakerId)
            next()
          }}
        />
      )}
      {(step.kind === 'rolePlay' || step.kind === 'rolePlayOwn') && (
        <RolePlayStep
          lesson={lesson}
          items={allItems}
          role={role}
          mode={step.kind === 'rolePlayOwn' ? 'own' : 'shadow'}
          stage={stage}
          {...wholeReveal}
          onLineResult={(item, passed) => {
            if (passed) {
              earn(step.kind === 'rolePlayOwn' ? XP.speakOwn : XP.speak)
              trackEvent('speakPass')
            }
            check(item, passed)
          }}
          onDone={next}
        />
      )}

      {/* ---------- เรื่องเล่าจากภาพ ---------- */}
      {step.kind === 'listenStory' && (
        // นิทาน Stage 6: ฟังฉบับ "พ่อแม่อ่านให้ฟัง" ก่อน แล้วค่อยอ่านฉบับง่ายเอง
        <ListenStoryStep
          items={lesson.type === 'reading' ? readAloudItems(allItems) : allItems}
          stage={stage}
          instructionKey={lesson.type === 'reading' ? 'read.listenFirst' : undefined}
          {...wholeReveal}
          onDone={listenedWhole}
        />
      )}
      {step.kind === 'tellStory' && (
        <TellStoryStep
          item={step.item}
          story={allItems}
          onDone={({ passed }) => speakDone(step.item, passed, XP.speakOwn)}
        />
      )}

      {/* ---------- คำคล้องจอง ---------- */}
      {step.kind === 'listenRhyme' && (
        <ListenRhymeStep lesson={lesson} items={allItems} stage={stage} {...wholeReveal} onDone={listenedWhole} />
      )}
      {step.kind === 'rhymeFill' && (
        <RhymeFillStep
          item={step.item}
          onDone={({ firstTry }) => {
            if (firstTry) earn(XP.rhymeFill)
            trackEvent('listen')
            check(step.item, firstTry)
            next()
          }}
        />
      )}

      {/* ---------- Stage 6 อ่าน ---------- */}
      {step.kind === 'phonicsIntro' && (
        <PhonicsIntroStep
          lesson={lesson}
          onDone={() => {
            const count = lesson.sounds?.length ?? 0
            earn(XP.listen * count)
            trackEvent('listen', count)
            next()
          }}
        />
      )}
      {READ_VARIANTS[step.kind] && (
        <ReadAloudStep
          item={step.item}
          stage={stage}
          variant={READ_VARIANTS[step.kind]}
          onDone={({ passed }) => speakDone(step.item, passed, XP.speak)}
        />
      )}

      {/* ---------- Stage 7 เขียน ---------- */}
      {step.kind === 'write' && (
        <WriteStep
          item={step.item}
          stage={stage}
          mode={lesson.spelling}
          onDone={({ passed }) => {
            if (passed) {
              earn(writeXp(step.item))
              trackEvent('writePass')
            }
            check(step.item, passed)
            next()
          }}
        />
      )}

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
          pool={allItems}
          ordered={flow.keepOrder}
          onRoundResult={(item, passed) => {
            if (passed) {
              earn(GAME_ROUND_XP[step.game])
              trackEvent('gameCorrect')
            }
            // นับคะแนนท้ายบทข้อละครั้งต่อเกม (Word Swap Race เล่นข้อเดิมได้หลายรอบ / phonics มี 2 เกมต่อกัน)
            const checkKey = `${step.game}:${item.id}`
            if (gameCheckedRef.current.has(checkKey)) return
            gameCheckedRef.current.add(checkKey)
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
