// =========================================================
// TalkPage — บทสนทนาสุ่มแบบชีวิตจริง (/talk/:scenarioId?seed=123) (ส่วนที่ 6)
//   intro (ภาพฉาก + คุยกับใคร + เป้าหมาย) → เล่น (ConversationPlayer) → สรุป (ConversationSummary)
//   seed อยู่ใน URL → เปิดลิงก์เดิม = บทสนทนาเดิม (ทดสอบซ้ำได้) / ไม่มี seed → สุ่มให้แล้วใส่ใน URL
//   "สุ่มอีกรอบ" = seed ใหม่ สถานการณ์เดิม / "สุ่มสถานการณ์ใหม่" = สถานการณ์อื่น + seed ใหม่
//   XP: พูดผ่าน 1 บรรทัด = พูดตาม 15 / จบบท = ภารกิจ "คุยบทสนทนาสุ่มจบ 1 รอบ"
//   บรรทัดที่ข้าม → เข้ารายการทบทวนเอง / ปุ่ม "เพิ่มเข้ารายการทบทวน" = บรรทัดของเราทั้งหมด (บทเรียน talk-<id>)
// =========================================================
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MessagesSquare } from 'lucide-react'
import { scenarios } from '../data'
import { useLocalized } from '../hooks/useLocalized'
import { useProgressStore } from '../store/progressStore'
import { useReviewStore } from '../store/reviewStore'
import { buildConversation, randomSeed, talkLessonId } from '../utils/conversation'
import { XP } from '../utils/lessonSteps'
import Page from '../components/Page'
import Picture from '../components/Picture'
import Button from '../components/Button'
import ConversationPlayer from '../components/talk/ConversationPlayer'
import ConversationSummary from '../components/talk/ConversationSummary'
import NotFoundPage from './NotFoundPage'
import styles from './Talk.module.css'

// ระดับ/โหมด (ขั้นที่ 12) — อยู่ใน URL ?mode= เหมือน seed: ปกติ / ยาก (ซ่อนตัวเลือก) / Speed Order (จับเวลา — เฉพาะสถานการณ์ที่ speedOrder)
const MODES = ['normal', 'hard', 'speed']

// สถานการณ์อื่นแบบสุ่ม (ไม่ซ้ำอันเดิม)
function otherScenarioId(currentId) {
  const others = scenarios.filter((scenario) => scenario.id !== currentId)
  return others[Math.floor(Math.random() * others.length)]?.id ?? currentId
}

export default function TalkPage() {
  const { scenarioId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const loc = useLocalized()
  const addXp = useProgressStore((state) => state.addXp)
  const trackEvent = useProgressStore((state) => state.trackEvent)
  const addMissed = useReviewStore((state) => state.addMissed)
  const scenario = scenarios.find((entry) => entry.id === scenarioId)

  const seedParam = Number(searchParams.get('seed'))
  const seed = searchParams.has('seed') && Number.isInteger(seedParam) && seedParam >= 0 ? seedParam : null
  const modeParam = searchParams.get('mode')
  const playMode = MODES.includes(modeParam) && (modeParam !== 'speed' || scenario?.speedOrder) ? modeParam : 'normal'
  // แก้ค่าใน URL โดยคงค่าอื่นไว้ (seed / mode)
  const updateParams = (changes, options) =>
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      for (const [key, value] of Object.entries(changes)) next.set(key, String(value))
      return next
    }, options)

  // ไม่มี seed ใน URL → สุ่มแล้วใส่ (แทนที่ประวัติ ไม่ต้องกดย้อนกลับ 2 ครั้ง)
  useEffect(() => {
    if (seed === null) updateParams({ seed: randomSeed() }, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed])

  const conversation = useMemo(
    () => (scenario && seed !== null ? buildConversation(scenario, seed) : null),
    [scenario, seed],
  )
  // mode: 'intro' → 'play' → 'done'
  const [mode, setMode] = useState('intro')
  const [result, setResult] = useState(null) // { outcomes, said }
  const [xp, setXp] = useState(0)
  const [reviewAdded, setReviewAdded] = useState(false)

  if (!scenario) return <NotFoundPage />
  if (!conversation) return null

  function start() {
    setResult(null)
    setXp(0)
    setReviewAdded(false)
    setMode('play')
  }

  // ระดับยาก = พูดเองไม่ดูตัวเลือก → XP เท่า "ใช้เอง"
  function linePass() {
    const gain = playMode === 'hard' ? XP.speakOwn : XP.speak
    addXp(gain)
    setXp((value) => value + gain)
    trackEvent('speakPass')
  }

  function finish(outcome) {
    trackEvent('conversation')
    if (playMode === 'speed') trackEvent('gamePlay') // Speed Order = มินิเกม
    const skipped = Object.keys(outcome.outcomes).filter((id) => outcome.outcomes[id] !== 'passed')
    addMissed(talkLessonId(scenario.id), skipped)
    setResult(outcome)
    setMode('done')
    window.scrollTo(0, 0)
  }

  function again() {
    updateParams({ seed: randomSeed() })
    start()
  }

  function newScenario() {
    navigate(`/talk/${otherScenarioId(scenario.id)}?seed=${randomSeed()}&mode=${playMode === 'hard' ? 'hard' : 'normal'}`)
    setMode('intro')
  }

  const modeChoices = MODES.filter((value) => value !== 'speed' || scenario.speedOrder)

  function addReview() {
    const ids = scenario.turns.filter((turn) => turn.speaker === 'user').map((turn) => turn.id)
    addMissed(talkLessonId(scenario.id), ids)
    setReviewAdded(true)
  }

  return (
    <Page title={loc(scenario, 'name')} subtitle={t('talk.with', { name: loc(scenario.partner, 'name') })} backTo="/talk">
      {mode === 'intro' && (
        <div className={styles.intro}>
          <Picture image={scenario.image} size="fill" alt="" className={styles.introPicture} />
          <p className={styles.goal}>
            <span className={styles.goalLabel}>{t('talk.goal')}</span> <span lang="th">{scenario.goalTh}</span>
          </p>
          <div className={styles.modes} role="group" aria-label={t('talk.modeLabel')}>
            {modeChoices.map((value) => (
              <Button
                key={value}
                size="sm"
                variant={playMode === value ? 'primary' : 'secondary'}
                aria-pressed={playMode === value}
                onClick={() => updateParams({ mode: value }, { replace: true })}
              >
                {t(`talk.mode.${value}`)}
              </Button>
            ))}
          </div>
          <p className={styles.note}>{t(`talk.modeNote.${playMode}`)}</p>
          <Button block size="lg" icon={MessagesSquare} onClick={start}>
            {t('talk.start')}
          </Button>
        </div>
      )}

      {mode === 'play' && (
        <ConversationPlayer
          key={`${scenario.id}:${seed}`}
          scenario={scenario}
          conversation={conversation}
          mode={playMode}
          onLinePass={linePass}
          onFinish={finish}
        />
      )}

      {mode === 'done' && result && (
        <ConversationSummary
          scenario={scenario}
          conversation={conversation}
          outcomes={result.outcomes}
          said={result.said}
          xp={xp}
          reviewAdded={reviewAdded}
          onAddReview={addReview}
          onAgain={again}
          onNew={newScenario}
        />
      )}
    </Page>
  )
}
