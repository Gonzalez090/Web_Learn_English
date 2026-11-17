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
  // ไม่มี seed ใน URL → สุ่มแล้วใส่ (แทนที่ประวัติ ไม่ต้องกดย้อนกลับ 2 ครั้ง)
  useEffect(() => {
    if (seed === null) setSearchParams({ seed: String(randomSeed()) }, { replace: true })
  }, [seed, setSearchParams])

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

  function linePass() {
    addXp(XP.speak)
    setXp((value) => value + XP.speak)
    trackEvent('speakPass')
  }

  function finish(outcome) {
    trackEvent('conversation')
    const skipped = Object.keys(outcome.outcomes).filter((id) => outcome.outcomes[id] === 'skipped')
    addMissed(talkLessonId(scenario.id), skipped)
    setResult(outcome)
    setMode('done')
    window.scrollTo(0, 0)
  }

  function again() {
    setSearchParams({ seed: String(randomSeed()) })
    start()
  }

  function newScenario() {
    navigate(`/talk/${otherScenarioId(scenario.id)}?seed=${randomSeed()}`)
    setMode('intro')
  }

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
          <p className={styles.note}>{t('talk.introNote')}</p>
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
