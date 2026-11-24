// =========================================================
// HomePage — หน้าแรก
//   เข้าเว็บครั้งแรก → พาไปหน้าแนะนำวิธีเรียน (/welcome) ก่อน
//   การ์ดใหญ่ "เรียนต่อ" (ContinueCard) → บทถัดไปที่ยังไม่จบ — บอกชื่อบทเลย ไม่ต้องหาเอง
//   การ์ดคู่ "แผนวันนี้" + "ทบทวนวันนี้", การ์ดเลเวล/streak, ภารกิจวันนี้, แผนที่เมือง, ปุ่มลัด (มือถือ)
//   จอกว้าง 2 คอลัมน์: เรียน + เมือง | เลเวล + ภารกิจ
// =========================================================
import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useProgressStore } from '../store/progressStore'
import { useReviewStore } from '../store/reviewStore'
import { useSettingsStore } from '../store/settingsStore'
import { dueEntries } from '../utils/review'
import { todayKey } from '../utils/date'
import { isPlanDone, isTaskDone } from '../utils/dailyPlan'
import { useDailyPlan } from '../hooks/useDailyPlan'
import { ICONS } from '../utils/icons'
import Page from '../components/Page'
import Section from '../components/Section'
import Tile, { TileList } from '../components/Tile'
import StudyTime from '../components/StudyTime'
import ContinueCard from '../components/ContinueCard'
import LevelCard from '../components/LevelCard'
import MissionList from '../components/MissionList'
import CityMap from '../components/CityMap'
import WelcomeBack from '../components/WelcomeBack'
import AccountPrompt from '../components/AccountPrompt'
import styles from './HomePage.module.css'

// ปุ่มลัดไปส่วนที่ใช้งานได้แล้ว (จอกว้างอยู่ในเมนูซ้ายแล้ว)
const SHORTCUTS = [
  { to: '/learn', icon: ICONS.learn, labelKey: 'home.learnBasics', tone: 'violet' },
  { to: '/phrases', icon: ICONS.phrases, labelKey: 'home.phrases', tone: 'sky' },
  { to: '/talk', icon: ICONS.talk, labelKey: 'home.talk', tone: 'mint' },
  { to: '/sounds', icon: ICONS.sounds, labelKey: 'home.soundPractice', tone: 'peach' },
  { to: '/profile', icon: ICONS.profile, labelKey: 'nav.profile', tone: 'pink' },
  { to: '/settings', icon: ICONS.settings, labelKey: 'home.settings', tone: 'plain' },
]

// การ์ด "แผนวันนี้" (ขั้นที่ 18) — ทำแล้วกี่ขั้น / ครบแล้ว → ไปหน้า /plan
function PlanCard() {
  const { t } = useTranslation()
  const plan = useDailyPlan()
  if (!plan) return null
  const total = plan.tasks.length
  const done = plan.tasks.filter(isTaskDone).length
  const finished = isPlanDone(plan)
  return (
    <Link to="/plan" className={finished ? `${styles.card} ${styles.planDone}` : styles.card}>
      <span className={finished ? `${styles.cardIcon} ${styles.doneIcon}` : styles.cardIcon}>
        <ICONS.plan aria-hidden="true" />
      </span>
      <span className={styles.cardText}>
        <span className={styles.cardTitle}>{t('home.plan', { goal: plan.goal })}</span>
        <span className={styles.cardNote}>
          {finished ? t('home.planDone') : t('home.planProgress', { done, total })}
        </span>
        <span className={styles.cardBar} aria-hidden="true">
          <span className={styles.cardFill} style={{ transform: `scaleX(${done / total})` }} />
        </span>
        <StudyTime planDone={finished} className={styles.cardNote} />
      </span>
    </Link>
  )
}

// การ์ด "ทบทวนวันนี้" — มีรายการถึงกำหนด = ลิงก์ / ไม่มี = บอกว่าว่าง
function ReviewCard({ count }) {
  const { t } = useTranslation()
  if (count === 0) {
    return (
      <div className={styles.card}>
        <span className={`${styles.cardIcon} ${styles.doneIcon}`}>
          <ICONS.completed aria-hidden="true" />
        </span>
        <span className={styles.cardText}>
          <span className={styles.cardTitle}>{t('review.title')}</span>
          <span className={styles.cardNote}>{t('home.noReview')}</span>
        </span>
      </div>
    )
  }
  return (
    <Link to="/review" className={styles.card}>
      <span className={`${styles.cardIcon} ${styles.reviewIcon}`}>
        <ICONS.review aria-hidden="true" />
      </span>
      <span className={styles.cardText}>
        <span className={styles.cardTitle}>{t('review.title')}</span>
        <span className={styles.cardNote}>{t('home.reviewDue', { count })}</span>
      </span>
    </Link>
  )
}

export default function HomePage() {
  const { t } = useTranslation()
  const introSeen = useSettingsStore((state) => state.introSeen)
  // มีความคืบหน้าแล้ว = เคยใช้เว็บแล้ว (ผู้ใช้เดิมที่ไม่เคยเปลี่ยนการตั้งค่า ไม่มี et-settings ให้ย้ายค่า introSeen)
  const hasProgress = useProgressStore((state) => state.xp > 0 || Object.keys(state.lessonProgress).length > 0)
  // นับเฉพาะรายการที่ถึงกำหนดวันนี้ (หรือค้างจากก่อนหน้า)
  const reviewQueue = useReviewStore((state) => state.reviewQueue)
  const reviewCount = dueEntries(reviewQueue, todayKey()).length

  // เข้าเว็บครั้งแรก (ยังไม่เคยเรียนเลย) → หน้าแนะนำวิธีเรียน
  if (!introSeen && !hasProgress) return <Navigate to="/welcome" replace />

  return (
    <Page title={t('home.title')} subtitle={t('app.tagline')} wide>
      {/* หายไป ≥ 3 วัน → NPC ทัก "Long time no see!" + ทบทวนสั้น ๆ (ขั้นที่ 15) */}
      <WelcomeBack reviewCount={reviewCount} />
      <AccountPrompt />

      <div className={styles.layout}>
        <div className={styles.main}>
          <ContinueCard />
          <div className={styles.duo}>
            <PlanCard />
            <ReviewCard count={reviewCount} />
          </div>
        </div>

        <div className={styles.side}>
          <LevelCard />
          <Section title={t('home.todayMissions')}>
            <MissionList />
          </Section>
        </div>

        <div className={styles.town}>
          {/* แผนที่เมือง (ขั้นที่ 14): ผ่าน Stage แล้วปลดล็อกสถานที่ */}
          <Section title={t('home.cityMap')}>
            <CityMap />
          </Section>
          <div className={styles.shortcuts}>
            <Section title={t('home.shortcuts')}>
              <TileList variant="grid">
                {SHORTCUTS.map((item) => (
                  <Tile key={item.to} to={item.to} icon={item.icon} title={t(item.labelKey)} tone={item.tone} layout="stack" />
                ))}
                {import.meta.env.DEV && (
                  <Tile to="/dev" icon={ICONS.dev} title={t('home.dev')} tone="plain" layout="stack" />
                )}
              </TileList>
            </Section>
          </div>
        </div>
      </div>
    </Page>
  )
}
