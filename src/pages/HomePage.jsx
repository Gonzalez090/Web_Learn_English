// =========================================================
// HomePage — หน้าแรก
//   ปุ่ม "เริ่มแผนวันนี้" / "ทบทวนวันนี้"
//   การ์ดเลเวล/streak, ภารกิจวันนี้, แผนที่เมือง (ขั้นที่ 14)
//   ปุ่มลัดไปส่วนต่าง ๆ
// =========================================================
import { useTranslation } from 'react-i18next'
import { useReviewStore } from '../store/reviewStore'
import { dueEntries } from '../utils/review'
import { todayKey } from '../utils/date'
import { ICONS } from '../utils/icons'
import Page from '../components/Page'
import Section from '../components/Section'
import Button from '../components/Button'
import ComingSoon from '../components/ComingSoon'
import Tile, { TileList } from '../components/Tile'
import LevelCard from '../components/LevelCard'
import MissionList from '../components/MissionList'
import styles from './HomePage.module.css'

const SHORTCUTS = [
  { to: '/learn', icon: ICONS.learn, labelKey: 'home.learnBasics' },
  { to: '/sounds', icon: ICONS.sounds, labelKey: 'home.soundPractice' },
  { to: '/games', icon: ICONS.games, labelKey: 'home.miniGames' },
  { to: '/phrases', icon: ICONS.phrases, labelKey: 'home.phrases' },
  { to: '/profile', icon: ICONS.profile, labelKey: 'nav.profile' },
  { to: '/settings', icon: ICONS.settings, labelKey: 'home.settings' },
]

export default function HomePage() {
  const { t } = useTranslation()
  // นับเฉพาะรายการที่ถึงกำหนดวันนี้ (หรือค้างจากก่อนหน้า)
  const reviewQueue = useReviewStore((state) => state.reviewQueue)
  const reviewCount = dueEntries(reviewQueue, todayKey()).length

  return (
    <Page title={t('home.title')} subtitle={t('app.tagline')}>
      <LevelCard />

      <div className={styles.actions}>
        <Button to="/plan" size="lg" block icon={ICONS.plan}>
          {t('home.startPlan')}
        </Button>
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

      <Section title={t('home.cityMap')}>
        <ComingSoon step={14} />
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
