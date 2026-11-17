// =========================================================
// ReviewPlayer — ตัวเล่น "ทบทวนวันนี้" (ส่วนที่ 8.5)
//   1) Listen & Tap: ฟังแล้วแตะภาพของข้อที่ถึงกำหนด (ภาพหลอกมาจากบทเดียวกัน)
//      — เฉพาะข้อจากบทที่ภาพแยกกันได้ (บทสนทนา/คำคล้องจองใช้ภาพฉากเดียวทั้งบท → ข้ามเกมนี้)
//   2) พูดตามทีละข้อ (เฉพาะข้อจากบทที่มีขั้นพูด) — บทสนทนา/คำคล้องจองมีบรรทัดก่อนหน้าเป็นตัวนำ
//   3) อ่านออกเสียงทีละข้อ (Stage 6: คำ phonics / sight word / หน้านิทาน)
//   4) เขียนทีละข้อ (Stage 7: ทำแบบฝึกเดิมอีกครั้ง ด้วยระดับการตรวจตัวสะกดของบทนั้น)
//   ชนิดการทบทวนของแต่ละประเภทบทอยู่ใน LESSON_FLOWS[type].review
// ข้อไหนทำได้ทุกขั้นตั้งแต่ครั้งแรก = ผ่าน → เลื่อนรอบ / พลาด = กลับรอบแรก (ตัดสินใน reviewStore)
// props: reviewItems [{ entry, item, lesson }], onFinish(results [{ entryId, passed }])
// =========================================================
import { useMemo, useRef, useState } from 'react'
import { getStage } from '../../data'
import { useProgressStore } from '../../store/progressStore'
import { readVariantOf, reviewKindsOf, writeXp, XP } from '../../utils/lessonSteps'
import PlayerFrame from './PlayerFrame'
import SpeakStep from './SpeakStep'
import ReadAloudStep from './ReadAloudStep'
import WriteStep from './WriteStep'
import ListenTapGame from '../games/ListenTapGame'

// ข้อที่ทบทวนด้วยเกมแตะภาพ
const tapItemsOf = (reviewItems) => reviewItems.filter(({ lesson }) => reviewKindsOf(lesson).includes('tap'))

// ขั้นทีละข้อของชนิดการทบทวนหนึ่ง ('speak' / 'read' / 'write')
const itemStepsOf = (reviewItems, kind) =>
  reviewItems
    .filter(({ lesson }) => reviewKindsOf(lesson).includes(kind))
    .map(({ item, lesson }) => ({
      kind,
      item,
      stage: getStage(lesson.stageId),
      variant: readVariantOf(lesson),
      spelling: lesson.spelling,
    }))

function buildSteps(reviewItems) {
  return [
    ...(tapItemsOf(reviewItems).length ? [{ kind: 'game' }] : []),
    ...itemStepsOf(reviewItems, 'speak'),
    ...itemStepsOf(reviewItems, 'read'),
    ...itemStepsOf(reviewItems, 'write'),
  ]
}

export default function ReviewPlayer({ reviewItems, onFinish }) {
  const addXp = useProgressStore((state) => state.addXp)
  const trackEvent = useProgressStore((state) => state.trackEvent)

  const steps = useMemo(() => buildSteps(reviewItems), [reviewItems])
  const tapReviewItems = useMemo(() => tapItemsOf(reviewItems), [reviewItems])
  const items = useMemo(() => tapReviewItems.map(({ item }) => item), [tapReviewItems])
  // ภาพหลอกของเกม: ทุกข้อในบทที่มีข้อทบทวนด้วยเกม (ไม่ซ้ำ)
  const pool = useMemo(() => {
    const byId = new Map()
    for (const { lesson } of tapReviewItems) for (const item of lesson.items) byId.set(item.id, item)
    return [...byId.values()]
  }, [tapReviewItems])

  const [index, setIndex] = useState(0)
  const failedRef = useRef(new Set()) // id ของข้อ (item.id) ที่พลาดในรอบนี้

  function finish() {
    const results = reviewItems.map(({ entry, item }) => ({ entryId: entry.id, passed: !failedRef.current.has(item.id) }))
    onFinish(results)
  }

  function next() {
    if (index + 1 >= steps.length) finish()
    else setIndex(index + 1)
  }

  const step = steps[index]

  // ผลของขั้นทีละข้อ (พูดตาม / อ่านออกเสียง / เขียน): ผ่านได้ XP / ไม่ผ่าน = พลาดรอบนี้
  function itemDone(item, passed, kind = 'speak') {
    if (passed) {
      addXp(kind === 'write' ? writeXp(item) : XP.speak)
      trackEvent(kind === 'write' ? 'writePass' : 'speakPass')
    } else {
      failedRef.current.add(item.id)
    }
    next()
  }

  return (
    <PlayerFrame exitTo="/" index={index} total={steps.length} stepKey={`review-${index}`}>
      {step.kind === 'game' && (
        <ListenTapGame
          items={items}
          pool={pool}
          onRoundResult={(item, firstTry) => {
            if (firstTry) {
              addXp(XP.gameCorrect)
              trackEvent('gameCorrect')
            } else {
              failedRef.current.add(item.id)
            }
          }}
          onFinish={() => {
            trackEvent('gamePlay')
            next()
          }}
        />
      )}
      {step.kind === 'speak' && (
        <SpeakStep item={step.item} stage={step.stage} onDone={({ passed }) => itemDone(step.item, passed)} />
      )}
      {step.kind === 'read' && (
        <ReadAloudStep
          item={step.item}
          stage={step.stage}
          variant={step.variant}
          onDone={({ passed }) => itemDone(step.item, passed)}
        />
      )}
      {step.kind === 'write' && (
        <WriteStep
          item={step.item}
          stage={step.stage}
          mode={step.spelling}
          onDone={({ passed }) => itemDone(step.item, passed, 'write')}
        />
      )}
    </PlayerFrame>
  )
}
