// =========================================================
// HomePage — หน้าแรก
//   เข้าเว็บครั้งแรก → พาไปหน้าแนะนำวิธีเรียน (/welcome) ก่อน
//   ปุ่มใหญ่ "เรียนต่อ" → บทถัดไปที่ยังไม่จบ (ไล่ Stage ฟัง → พูด → อ่าน → เขียน) — บอกชื่อบทบนปุ่มเลย ไม่ต้องหาเอง
//     (ขั้นที่ 18 แผนรายวันเสร็จแล้ว ค่อยเปลี่ยนเป็น "เริ่มแผนวันนี้")
//   ปุ่ม "ทบทวนวันนี้", การ์ดเลเวล/streak, ภารกิจวันนี้, ปุ่มลัดไปส่วนที่เปิดแล้ว
//   (แผนที่เมือง ขั้นที่ 14 / มินิเกมเล่นแยก ขั้นที่ 17 — ยังไม่แสดง จะได้ไม่หลงเข้าหน้าว่าง / คลังวลีเปิดแล้วในขั้นที่ 10)
// =========================================================
import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getStage, lessonList } from '../data'
import { useLocalized } from '../hooks/useLocalized'
import { useProgressStore } from '../store/progressStore'
import { useReviewStore } from '../store/reviewStore'
import { useSettingsStore } from '../store/settingsStore'
import { nextLesson } from '../utils/progress'
import { dueEntries } from '../utils/review'
import { todayKey } from '../utils/date'
import { isPlanDone, isTaskDone } from '../utils/dailyPlan'
import { useDailyPlan } from '../hooks/useDailyPlan'
import { ICONS } from '../utils/icons'
import Page from '../components/Page'
import Section from '../components/Section'
import Button from '../components/Button'
import Tile, { TileList } from '../components/Tile'
import LevelCard from '../components/LevelCard'
import MissionList from '../components/MissionList'
import CityMap from '../components/CityMap'
import WelcomeBack from '../components/WelcomeBack'
import styles from './HomePage.module.css'

// ปุ่มลัดไปส่วนที่ใช้งานได้แล้ว
const SHORTCUTS = [
  { to: '/learn', icon: ICONS.learn, labelKey: 'home.learnBasics' },
  { to: '/phrases', icon: ICONS.phrases, labelKey: 'home.phrases' },
  { to: '/talk', icon: ICONS.talk, labelKey: 'home.talk' },
  { to: '/sounds', icon: ICONS.sounds, labelKey: 'home.soundPractice' },
  { to: '/profile', icon: ICONS.profile, labelKey: 'nav.profile' },
  { to: '/settings', icon: ICONS.settings, labelKey: 'home.settings' },
]

// ปุ่มใหญ่ "เรียนต่อ" — บทถัดไป หรือ (เรียนครบทุกบทที่เปิดแล้ว) ไปหน้ารายการ Stage
function ContinueButton() {
  const { t } = useTranslation()
  const loc = useLocalized()
  const unlockedStages = useProgressStore((state) => state.unlockedStages)
  const lessonProgress = useProgressStore((state) => state.lessonProgress)
  const lesson = nextLesson(lessonList, unlockedStages, lessonProgress)
  const ContinueIcon = ICONS.unlocked

  if (!lesson) {
    return (
      <Button to="/learn" size="lg" block icon={ICONS.learn}>
        {t('home.allDone')}
      </Button>
    )
  }

  const stage = getStage(lesson.stageId)
  return (
    <Link to={`/lesson/${lesson.id}`} className={styles.continue}>
      <ContinueIcon className={styles.continueIcon} aria-hidden="true" />
      <span className={styles.continueText}>
        <span className={styles.continueTitle}>{t('home.continue')}</span>
        <span className={styles.continueLesson}>
          {t('learn.stageN', { n: stage.id })} · {loc(lesson, 'title')}
        </span>
      </span>
    </Link>
  )
}

// การ์ด "แผนวันนี้" (ขั้นที่ 18) — ทำแล้วกี่ขั้น / ครบแล้ว → ไปหน้า /plan
function PlanCard() {
  const { t } = useTranslation()
  const plan = useDailyPlan()
  if (!plan) return null
  const total = plan.tasks.length
  const done = plan.tasks.filter(isTaskDone).length
  const finished = isPlanDone(plan)
  return (
    <Link to="/plan" className={finished ? `${styles.plan} ${styles.planDone}` : styles.plan}>
      <ICONS.plan className={styles.planIcon} aria-hidden="true" />
      <span className={styles.continueText}>
        <span className={styles.planTitle}>{t('home.plan', { goal: plan.goal })}</span>
        <span className={styles.planProgress}>
          {finished ? t('home.planDone') : t('home.planProgress', { done, total })}
        </span>
      </span>
      <span className={styles.planBar} aria-hidden="true">
        <span className={styles.planFill} style={{ width: `${Math.round((done / total) * 100)}%` }} />
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
    <Page title={t('home.title')} subtitle={t('app.tagline')}>
      {/* หายไป ≥ 3 วัน → NPC ทัก "Long time no see!" + ทบทวนสั้น ๆ (ขั้นที่ 15) */}
      <WelcomeBack reviewCount={reviewCount} />

      <LevelCard />

      <div className={styles.actions}>
        <PlanCard />
        <ContinueButton />
        {reviewCount > 0 ? (
          <Button to="/review" variant="secondary" block icon={ICONS.review}>
            {t('home.reviewToday', { count: reviewCount })}
          </Button>
        ) : (
          // ไม่มีอะไรต้องทบทวน → ปุ่มกดไม่ได้ พร้อมข้อความบอก
          <Button variant="secondary" block icon={ICONS.completed} disabled>
            {t('home.noReview')}
          </Button>
        )}
      </div>

      <Section title={t('home.todayMissions')}>
        <MissionList />
      </Section>

      {/* แผนที่เมือง (ขั้นที่ 14): ผ่าน Stage แล้วปลดล็อกสถานที่ */}
      <Section title={t('home.cityMap')}>
        <CityMap />
      </Section>

      <Section title={t('home.shortcuts')}>
        <TileList variant="grid">
          {SHORTCUTS.map((item) => (
            <Tile key={item.to} to={item.to} icon={item.icon} title={t(item.labelKey)} layout="stack" />
          ))}
          {import.meta.env.DEV && <Tile to="/dev" icon={ICONS.dev} title={t('home.dev')} layout="stack" />}
        </TileList>
      </Section>
    </Page>
  )
}
