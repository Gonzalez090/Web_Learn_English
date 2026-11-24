// =========================================================
// ProfilePage — โปรไฟล์: หัวโปรไฟล์/บัญชี (ขั้นที่ 31), เลเวล/streak, สถิติ, Speaking Check
// (กราฟนาทีที่พูด ขั้นที่ 18, Collection การ์ดวลี ขั้นที่ 20-1, ห้องของตัวละคร ขั้นที่ 20-2)
// =========================================================
import { useTranslation } from 'react-i18next'
import { phraseSituations, stages } from '../data'
import { useProgressStore } from '../store/progressStore'
import { useLocalized } from '../hooks/useLocalized'
import { levelFromXp } from '../utils/level'
import { currentHome } from '../utils/room'
import { ICONS } from '../utils/icons'
import Page from '../components/Page'
import Section from '../components/Section'
import LevelCard from '../components/LevelCard'
import ProfileHeader from '../components/ProfileHeader'
import DeleteAccountSection from '../components/DeleteAccountSection'
import Tile, { TileList } from '../components/Tile'
import SpeakingChart from '../components/SpeakingChart'
import { todayKey } from '../utils/date'
import styles from './ProfilePage.module.css'

export default function ProfilePage() {
  const { t } = useTranslation()
  const loc = useLocalized()
  const xp = useProgressStore((state) => state.xp)
  const bestStreak = useProgressStore((state) => state.streak.best ?? state.streak.count)
  const lessonProgress = useProgressStore((state) => state.lessonProgress)
  const unlockedStages = useProgressStore((state) => state.unlockedStages)
  const speakingMinutes = useProgressStore((state) => state.speakingMinutes)
  const cardCount = useProgressStore((state) => state.collection.length)
  const room = useProgressStore((state) => state.room)
  const home = currentHome(room, levelFromXp(xp))
  const phraseTotal = phraseSituations.reduce((sum, situation) => sum + situation.phraseCount, 0)

  const lessonsDone = Object.values(lessonProgress).filter((progress) => progress.completed).length
  const stats = [
    { key: 'totalXp', value: t('stats.xp', { count: xp }) },
    { key: 'bestStreak', value: t('profile.days', { count: bestStreak }) },
    { key: 'lessonsDone', value: t('profile.lessons', { count: lessonsDone }) },
    { key: 'stagesOpen', value: t('profile.ofTotal', { count: unlockedStages.length, total: stages.length }) },
  ]

  return (
    <Page title={t('profile.title')} wide>
      <ProfileHeader />
      <div className={styles.layout}>
        <div className={styles.col}>
          <LevelCard />
          <TileList>
            <Tile to="/profile/room" image={home.image} title={t('room.title')} description={t('room.tile', { name: loc(home, 'name') })} />
            <Tile
              to="/profile/collection"
              icon={ICONS.collection}
              tone="lemon"
              title={t('collection.title')}
              description={t('collection.tile', { count: cardCount, total: phraseTotal })}
            />
            <Tile
              to="/profile/speaking-check"
              icon={ICONS.speakingCheck}
              tone="mint"
              title={t('profile.speakingCheck')}
              description={t('profile.speakingCheckDesc')}
            />
          </TileList>
        </div>

        <div className={styles.col}>
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
          {/* นาทีที่พูดภาษาอังกฤษ 7 วันล่าสุด (ขั้นที่ 18) */}
          <Section title={t('plan.speaking')} description={t('plan.speakingNote')}>
            <div className={styles.panel}>
              <SpeakingChart minutes={speakingMinutes} today={todayKey()} />
            </div>
          </Section>
        </div>
      </div>
      {/* ล็อกอินอยู่เท่านั้น */}
      <DeleteAccountSection />
    </Page>
  )
}
