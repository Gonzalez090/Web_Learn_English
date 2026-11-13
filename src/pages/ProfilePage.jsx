// =========================================================
// ProfilePage — โปรไฟล์: เลเวล/streak, สถิติ, Speaking Check
// (กราฟนาทีที่พูด ขั้นที่ 18, Collection/ห้องของตัวละคร ขั้นที่ 20)
// =========================================================
import { useTranslation } from 'react-i18next'
import { stages } from '../data'
import { useProgressStore } from '../store/progressStore'
import { ICONS } from '../utils/icons'
import Page from '../components/Page'
import Section from '../components/Section'
import LevelCard from '../components/LevelCard'
import Tile, { TileList } from '../components/Tile'
import ComingSoon from '../components/ComingSoon'
import styles from './ProfilePage.module.css'

export default function ProfilePage() {
  const { t } = useTranslation()
  const xp = useProgressStore((state) => state.xp)
  const bestStreak = useProgressStore((state) => state.streak.best ?? state.streak.count)
  const lessonProgress = useProgressStore((state) => state.lessonProgress)
  const unlockedStages = useProgressStore((state) => state.unlockedStages)

  const lessonsDone = Object.values(lessonProgress).filter((progress) => progress.completed).length
  const stats = [
    { key: 'totalXp', value: t('stats.xp', { count: xp }) },
    { key: 'bestStreak', value: t('profile.days', { count: bestStreak }) },
    { key: 'lessonsDone', value: t('profile.lessons', { count: lessonsDone }) },
    { key: 'stagesOpen', value: t('profile.ofTotal', { count: unlockedStages.length, total: stages.length }) },
  ]

  return (
    <Page title={t('profile.title')}>
      <LevelCard />

      <Section title={t('profile.stats')}>
        <dl className={styles.stats}>
          {stats.map((stat) => (
            <div key={stat.key} className={styles.stat}>
              <dt className={styles.label}>{t(`profile.${stat.key}`)}</dt>
              <dd className={styles.value}>{stat.value}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <TileList>
        <Tile
          to="/profile/speaking-check"
          icon={ICONS.speakingCheck}
          title={t('profile.speakingCheck')}
          description={t('profile.speakingCheckDesc')}
        />
      </TileList>
      <ComingSoon step={18} />
    </Page>
  )
}
