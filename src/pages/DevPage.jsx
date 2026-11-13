// =========================================================
// DevPage — หน้าทดสอบสำหรับนักพัฒนา (/dev)
// มีเฉพาะตอน npm run dev (App.jsx โหลดแบบ lazy เฉพาะโหมด DEV → ไม่ติดไปใน build จริง)
//   - ลิงก์ไปทุกหน้า
//   - ปลดล็อกทุก Stage / ล้างข้อมูลทั้งหมด (กด 2 ครั้งเพื่อยืนยัน)
//   - ดูจำนวนบทเรียนในแต่ละ Stage, คำสะสม, สัดส่วนคำใหม่ (หลัก i+1) และข้อมูลที่เก็บใน localStorage
// =========================================================
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { stages, lessons, cityMap, getLessonsByStage } from '../data'
import { cumulativeVocabulary, lessonFirstHearingShare } from '../utils/vocabulary'
import { useProgressStore } from '../store/progressStore'
import { useSettingsStore } from '../store/settingsStore'
import { useReviewStore } from '../store/reviewStore'
import { useSpeech } from '../hooks/useSpeech'
import { useRecognition } from '../hooks/useRecognition'
import Page from '../components/Page'
import Section from '../components/Section'
import Button from '../components/Button'
import styles from './DevPage.module.css'

// ตัวนับคำ (คำนวณครั้งเดียวตอนเปิดหน้า)
const CUMULATIVE = cumulativeVocabulary(lessons)
const SHARES = lessonFirstHearingShare(lessons).slice(1) // บทแรกของคอร์สเป็นของใหม่ทั้งหมดเสมอ
const averageShare = (stageId) => {
  const inStage = SHARES.filter((entry) => entry.stageId === stageId)
  if (!inStage.length) return null
  return Math.round((inStage.reduce((sum, entry) => sum + entry.share, 0) / inStage.length) * 100)
}

const ROUTES = [
  '/',
  '/learn',
  '/learn/1',
  '/learn/4',
  '/learn/5',
  '/lesson/s1-home-family',
  '/lesson/s4-home-family',
  '/lesson/s1-home-family/summary',
  '/place/home',
  '/talk/cafe',
  '/phrases',
  '/phrases/real-vs-textbook',
  '/review',
  '/plan',
  '/games',
  '/games/listen-tap',
  '/sounds',
  '/profile',
  '/profile/speaking-check',
  '/settings',
  '/credits',
  '/learn/99',
  '/no-such-page',
]

// ตัดฟังก์ชัน (action) ออก เหลือแต่ข้อมูลที่ถูกบันทึกจริง
const dataOnly = (state) => JSON.parse(JSON.stringify(state))

export default function DevPage() {
  const { t } = useTranslation()
  const progress = useProgressStore()
  const settings = useSettingsStore()
  const review = useReviewStore()
  const { voices, activeVoice } = useSpeech()
  const mic = useRecognition()
  const [micAlternatives, setMicAlternatives] = useState([])
  const [confirmReset, setConfirmReset] = useState(false)
  const [message, setMessage] = useState('')

  // ทดสอบไมค์: ฟัง 1 ครั้ง แล้วแสดงทุกแบบที่ระบบอาจได้ยิน + ความมั่นใจ
  async function handleMicTest() {
    if (mic.status === 'listening') return mic.stop()
    setMicAlternatives([])
    const alternatives = await mic.listen()
    if (alternatives) setMicAlternatives(alternatives)
  }

  function handleUnlockAll() {
    progress.devUnlockAll(
      stages.map((stage) => stage.id),
      cityMap.map((place) => place.placeId),
    )
    setMessage(t('dev.done'))
  }

  function handleReset() {
    if (!confirmReset) {
      setConfirmReset(true)
      return
    }
    progress.resetProgress()
    review.resetReview()
    settings.resetSettings()
    setConfirmReset(false)
    setMessage(t('dev.done'))
  }

  return (
    <Page title={t('dev.title')} subtitle={t('dev.subtitle')} backTo="/">
      <Section title={t('dev.routes')}>
        <ul className={styles.links}>
          {ROUTES.map((path) => (
            <li key={path}>
              <Link to={path}>{path}</Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t('dev.tools')}>
        <div className={styles.row}>
          <Button size="sm" variant="secondary" onClick={handleUnlockAll}>
            {t('dev.unlockAll')}
          </Button>
          <Button size="sm" variant="danger" onClick={handleReset}>
            {confirmReset ? t('dev.confirmReset') : t('dev.resetAll')}
          </Button>
        </div>
        {message && (
          <p className={styles.message} role="status">
            {message}
          </p>
        )}
      </Section>

      <Section title={t('dev.lessonData')}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t('dev.colStage')}</th>
              <th>{t('dev.colLessons')}</th>
              <th>{t('dev.colItems')}</th>
              <th>{t('dev.colWords')}</th>
              <th>{t('dev.colNewShare')}</th>
            </tr>
          </thead>
          <tbody>
            {stages.map((stage) => {
              const stageLessons = getLessonsByStage(stage.id)
              const itemCount = stageLessons.reduce((sum, lesson) => sum + lesson.items.length, 0)
              return (
                <tr key={stage.id}>
                  <td>{stage.id}</td>
                  <td>{stageLessons.length}</td>
                  <td>{itemCount}</td>
                  <td>{CUMULATIVE[stage.id] ?? '–'}</td>
                  <td>{averageShare(stage.id) === null ? '–' : `${averageShare(stage.id)}%`}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Section>

      <Section title={t('dev.micTest')} description={t('dev.micTestHint')}>
        <div className={styles.row}>
          <Button size="sm" variant={mic.status === 'listening' ? 'danger' : 'secondary'} onClick={handleMicTest}>
            {mic.status === 'listening' ? t('dev.micStop') : t('dev.micStart')}
          </Button>
        </div>
        {mic.interim && <p className={styles.voices}>{mic.interim}</p>}
        {mic.error && <p className={styles.voices}>{`error: ${mic.error}`}</p>}
        {micAlternatives.length > 0 && (
          <ol className={styles.voices}>
            {micAlternatives.map((alt, index) => (
              <li key={index}>{`${alt.transcript} (${Math.round((alt.confidence ?? 0) * 100)}%)`}</li>
            ))}
          </ol>
        )}
      </Section>

      <Section title={t('dev.voices', { count: voices.length })}>
        <ul className={styles.voices}>
          {voices.map((voice) => (
            <li key={voice.voiceURI} className={voice === activeVoice ? styles.activeVoice : undefined}>
              {`${voice.name} · ${voice.lang} · ${voice.localService ? t('dev.voiceLocal') : t('dev.voiceOnline')}`}
              {voice === activeVoice && ` ← ${t('dev.activeVoice')}`}
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t('dev.storage')}>
        <pre className={styles.pre}>
          {JSON.stringify(
            { settings: dataOnly(settings), progress: dataOnly(progress), review: dataOnly(review) },
            null,
            2,
          )}
        </pre>
      </Section>
    </Page>
  )
}
