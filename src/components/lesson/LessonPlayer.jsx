// =========================================================
// LessonPlayer — ตัวเล่นบทเรียน (ส่วนที่ 4)
// - ลำดับขั้นอ่านจาก utils/lessonSteps.js: ทีละข้อ (ดูภาพ+ฟัง → พูดตาม) แล้วจบด้วยมินิเกม
// - ได้ XP ทันทีที่ทำแต่ละขั้นสำเร็จ (ออกกลางคันก็ได้ XP ที่ทำไปแล้ว) + แจ้งเหตุการณ์ให้ภารกิจรายวัน
// - ข้อที่พูดไม่ผ่าน / เกมไม่ถูกตั้งแต่ครั้งแรก → เข้ารายการทบทวน
// - จบบท → บันทึกผล + ปลดล็อก Stage ถัดไป → ไปหน้าสรุป
// props:
//   lesson, stage
//   onlyItemIds = ฝึกซ้ำเฉพาะข้อเหล่านี้ (จากปุ่ม "ฝึกซ้ำข้อที่พลาด" ในหน้าสรุป)
// =========================================================
import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { LESSON_FLOWS, XP } from '../../utils/lessonSteps'
import { useProgressStore } from '../../store/progressStore'
import { useReviewStore } from '../../store/reviewStore'
import LookListenStep from './LookListenStep'
import SpeakStep from './SpeakStep'
import ListenTapGame from '../games/ListenTapGame'
import Button from '../Button'
import styles from './LessonPlayer.module.css'

// สร้างรายการขั้นของบท: [{ kind: 'lookListen' | 'speak', item } ..., { kind: 'game', game }]
function buildSteps(flow, items) {
  const steps = items.flatMap((item) => flow.itemSteps.map((kind) => ({ kind, item })))
  if (flow.game) steps.push({ kind: 'game', game: flow.game })
  return steps
}

export default function LessonPlayer({ lesson, stage, onlyItemIds }) {
  const { t } = useTranslation()
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
  const steps = useMemo(() => buildSteps(flow, items), [flow, items])

  const [index, setIndex] = useState(0)
  // ผลระหว่างเล่น (ใช้ ref เพราะไม่ต้อง render ใหม่ทุกครั้งที่เปลี่ยน)
  const xpRef = useRef(0)
  const missedRef = useRef(new Set())
  const checksRef = useRef({ total: 0, passed: 0 }) // ใช้คิดคะแนนท้ายบท

  function earn(amount) {
    xpRef.current += amount
    addXp(amount)
  }

  function check(item, passed) {
    checksRef.current.total += 1
    if (passed) checksRef.current.passed += 1
    else missedRef.current.add(item.id)
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

  const step = steps[index]
  const progress = Math.round((index / steps.length) * 100)

  return (
    <div className={styles.player}>
      <div className={styles.top}>
        <Button
          to={`/learn/${stage.id}`}
          variant="ghost"
          size="sm"
          icon={X}
          className={styles.exit}
        >
          {t('lesson.exit')}
        </Button>
        <div
          className={styles.progress}
          role="progressbar"
          aria-label={t('lesson.progress')}
          aria-valuemin={0}
          aria-valuemax={steps.length}
          aria-valuenow={index}
        >
          <span className={styles.progressBar} style={{ transform: `scaleX(${progress / 100})` }} />
        </div>
      </div>

      {/* key = ลำดับขั้น → เปลี่ยนขั้นแล้วเริ่ม component ใหม่ (สถานะไม่ค้างจากข้อก่อน) */}
      <div key={`step-${index}`} className={styles.stage}>
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
        {step.kind === 'speak' && (
          <SpeakStep
            item={step.item}
            stage={stage}
            onDone={({ passed }) => {
              if (passed) {
                earn(XP.speak)
                trackEvent('speakPass')
              }
              check(step.item, passed)
              next()
            }}
          />
        )}
        {step.kind === 'game' && (
          <ListenTapGame
            items={items}
            pool={lesson.items}
            onRoundResult={(item, firstTry) => {
              if (firstTry) {
                earn(XP.gameCorrect)
                trackEvent('gameCorrect')
              }
              check(item, firstTry)
            }}
            onFinish={() => {
              trackEvent('gamePlay')
              finish()
            }}
          />
        )}
      </div>
    </div>
  )
}
