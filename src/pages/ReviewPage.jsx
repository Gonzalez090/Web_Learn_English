// =========================================================
// ReviewPage — ทบทวนวันนี้ (/review) — Spaced Repetition 1 → 3 → 7 → 14 วัน (ส่วนที่ 8.5)
// - ไม่มีรายการถึงกำหนด → บอกวันที่รอบหน้า
// - มี → ReviewPlayer (เกม + พูดตาม) → สรุปว่าแต่ละข้อเลื่อนไปอีกกี่วัน / กลับมาพรุ่งนี้ / จำได้แล้ว
// รายการรอบนี้ถูก "จับภาพ" ตอนเริ่ม → ระหว่างเล่นคิวเปลี่ยนก็ไม่กระทบ
// =========================================================
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { getLessonMeta, getStage } from '../data'
import { talkLessonId, talkReviewLesson } from '../utils/conversation'
import { useScenarios } from '../hooks/useScenarios'
import { englishTextMode } from '../utils/display'
import { useLessonsOfStages } from '../hooks/useLessons'
import { useReviewStore } from '../store/reviewStore'
import { useProgressStore } from '../store/progressStore'
import {
  buildReviewItems,
  dueEntries,
  MAX_REVIEW_PER_SESSION,
  missingEntries,
  nextDueDate,
  SHORT_REVIEW_COUNT,
} from '../utils/review'
import { formatDateKey, todayKey } from '../utils/date'
import { ICONS } from '../utils/icons'
import Page from '../components/Page'
import Section from '../components/Section'
import Button from '../components/Button'
import Picture from '../components/Picture'
import ReviewPlayer from '../components/lesson/ReviewPlayer'
import styles from './ReviewPage.module.css'

// ข้อจาก Stage ที่แสดงตัวอักษรได้ (Stage 4 ขึ้นไป) → สรุปแสดงประโยคด้วย
const showsEnglish = (lesson) => englishTextMode(getStage(lesson?.stageId)?.showText) !== 'hidden'

// ผลของแต่ละข้อ → ข้อความ
function outcomeText(t, outcome) {
  if (outcome?.outcome === 'mastered') return t('review.mastered')
  if (outcome?.outcome === 'next') return t('review.next', { days: outcome.days })
  return t('review.reset')
}

export default function ReviewPage() {
  const { t, i18n } = useTranslation()
  const queue = useReviewStore((state) => state.reviewQueue)
  const gradeReviews = useReviewStore((state) => state.gradeReviews)
  const trackEvent = useProgressStore((state) => state.trackEvent)

  // โหลดเนื้อหาเฉพาะ Stage ที่มีข้ออยู่ในคิว — จับชุด Stage ไว้ตั้งแต่เปิดหน้า
  // (ระหว่างทบทวน คิวมีแต่ข้อเดิมเปลี่ยนรอบ ไม่มีบทใหม่เข้ามา → ไม่ต้องโหลด/รอใหม่กลางทาง)
  const [stageIds] = useState(() => queue.map((entry) => getLessonMeta(entry.lessonId)?.stageId).filter(Boolean))
  const stageLessons = useLessonsOfStages(stageIds)
  // บทสนทนาสุ่ม (ขั้นที่ 11): บรรทัดของเราที่ข้าม/เพิ่มเข้ารายการทบทวน อยู่ในบทเรียนเสมือน talk-<id>
  //   บทพูดโหลดแยกไฟล์ (ขั้นที่ 28-1) → โหลดเฉพาะสถานการณ์ที่มีบรรทัดอยู่ในคิว (จับชุดไว้ตอนเปิดหน้าเหมือน Stage)
  const [talkIds] = useState(() =>
    queue
      .map((entry) => entry.lessonId)
      .filter((lessonId) => lessonId.startsWith(talkLessonId('')))
      .map((lessonId) => lessonId.slice(talkLessonId('').length)),
  )
  const talkScenarios = useScenarios(talkIds)
  const lessons = useMemo(
    () => [...stageLessons, ...talkScenarios.map(talkReviewLesson)],
    [stageLessons, talkScenarios],
  )

  // ข้อที่ไม่มีจริงแล้ว → เอาออกจากคิว (ตรวจครั้งเดียวตอนเปิดหน้า ใช้คิวชุดเดียวกับที่โหลดบทมา)
  const [missingIds] = useState(() => missingEntries(queue, lessons))
  const removeEntries = useReviewStore((state) => state.removeEntries)
  useEffect(() => {
    removeEntries(missingIds)
  }, [missingIds, removeEntries])

  const [round, setRound] = useState(0) // เพิ่มขึ้น = เริ่มทบทวนรอบใหม่
  // ?short=1 (กลับมาหลังหายไปนาน — คำทัก "Long time no see!") → ทบทวนสั้น ๆ แค่ 5 ข้อแรก
  const [searchParams] = useSearchParams()
  const limit = searchParams.get('short') ? SHORT_REVIEW_COUNT : MAX_REVIEW_PER_SESSION
  const [session, setSession] = useState(() => buildReviewItems(queue, lessons, todayKey(), limit))
  const [summary, setSummary] = useState(null) // [{ item, outcome }]

  const today = todayKey()
  const remaining = buildReviewItems(queue, lessons, today).length

  function handleFinish(results) {
    const outcomes = gradeReviews(results)
    trackEvent('review', results.length)
    setSummary(
      session.map(({ entry, item, lesson }) => ({
        item,
        lesson,
        outcome: outcomes.find((result) => result.entryId === entry.id),
      })),
    )
  }

  function startAgain() {
    setSession(buildReviewItems(useReviewStore.getState().reviewQueue, lessons, todayKey()))
    setSummary(null)
    setRound((value) => value + 1)
  }

  // ---------- สรุปหลังทบทวน ----------
  if (summary) {
    const passed = summary.filter(({ outcome }) => outcome && outcome.outcome !== 'reset').length
    return (
      <Page title={t('review.title')} backTo="/">
        <div className={styles.hero}>
          <p className={styles.headline}>{t('review.doneTitle')}</p>
          <p>{t('review.doneCount', { passed, total: summary.length })}</p>
        </div>
        <Section title={t('review.resultTitle')}>
          <ul className={styles.items}>
            {summary.map(({ item, lesson, outcome }) => (
              <li key={item.id} className={styles.item}>
                <Picture image={item.image} size="sm" />
                <div className={styles.itemBody}>
                  {/* ประโยคช่วยแยกข้อที่ใช้ภาพเดียวกัน (บทสนทนา/คำคล้องจอง) — Stage 1–3 ห้ามแสดงตัวอักษร */}
                  {showsEnglish(lesson) && (
                    <span className={styles.itemText} lang="en">
                      {item.target ?? item.word}
                    </span>
                  )}
                  <span className={outcome?.outcome === 'reset' ? styles.reset : styles.good}>
                    {outcomeText(t, outcome)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Section>
        <div className={styles.actions}>
          {remaining > 0 && (
            <Button size="lg" block icon={ICONS.review} onClick={startAgain}>
              {t('review.continue', { count: remaining })}
            </Button>
          )}
          <Button to="/" variant={remaining > 0 ? 'secondary' : 'primary'} block>
            {t('review.backHome')}
          </Button>
        </div>
      </Page>
    )
  }

  // ---------- ไม่มีรายการถึงกำหนด ----------
  if (session.length === 0) {
    const nextDate = nextDueDate(queue, today)
    const CompletedIcon = ICONS.completed
    return (
      <Page title={t('review.title')} backTo="/">
        <div className={styles.empty}>
          <CompletedIcon className={styles.emptyIcon} aria-hidden="true" />
          <p className={styles.headline}>{t('home.noReview')}</p>
          <p className={styles.muted}>
            {nextDate
              ? t('review.nextDue', { date: formatDateKey(nextDate, i18n.language), count: queue.length })
              : t('review.emptyHint')}
          </p>
          <Button to="/learn" block>
            {t('review.goLearn')}
          </Button>
        </div>
      </Page>
    )
  }

  // ---------- ทบทวน ----------
  return (
    <Page title={t('review.title')} subtitle={t('review.subtitle', { count: dueEntries(queue, today).length })}>
      <ReviewPlayer key={round} reviewItems={session} onFinish={handleFinish} />
    </Page>
  )
}
