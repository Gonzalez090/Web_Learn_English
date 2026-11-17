// =========================================================
// PlacePage — สถานที่ในเมือง (/place/:placeId) (ส่วนที่ 7)
//   ภาพสถานที่ → NPC ประจำสถานที่ + ความสนิท (ขั้นที่ 15) → บทสนทนาสุ่มที่เกิดที่นี่ (+ Speed Order ถ้ามี)
//   → วลีที่ใช้ที่นี่ (จากคลังวลี) / ยังล็อก → บอกว่าต้องผ่าน Stage ไหน + ปุ่มไปเรียนต่อ
// =========================================================
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Timer } from 'lucide-react'
import { cityMap, getPhraseSituation, npcOfPlace, scenarios } from '../data'
import { useLocalized } from '../hooks/useLocalized'
import { useProgressStore } from '../store/progressStore'
import { isPlaceUnlocked } from '../utils/places'
import { ICONS } from '../utils/icons'
import Page from '../components/Page'
import Section from '../components/Section'
import Picture from '../components/Picture'
import Button from '../components/Button'
import Tile, { TileList } from '../components/Tile'
import NpcCard from '../components/NpcCard'
import NotFoundPage from './NotFoundPage'
import styles from './Talk.module.css'

export default function PlacePage() {
  const { placeId } = useParams()
  const { t } = useTranslation()
  const loc = useLocalized()
  const unlockedStages = useProgressStore((state) => state.unlockedStages)
  const friendship = useProgressStore((state) => state.npcFriendship)
  const place = cityMap.find((entry) => entry.placeId === placeId)
  if (!place) return <NotFoundPage />

  const unlocked = isPlaceUnlocked(place, unlockedStages)
  const talks = scenarios.filter((scenario) => scenario.placeId === place.placeId)
  const situations = place.phraseGroups.map(getPhraseSituation).filter(Boolean)
  const npc = npcOfPlace(place.placeId)

  return (
    <Page title={loc(place, 'name')} subtitle={loc(place, 'description')} backTo="/">
      <div className={styles.intro}>
        <Picture image={place.image} size="fill" alt="" className={styles.introPicture} />
      </div>

      {!unlocked ? (
        <div className={styles.randomBox}>
          <p className={styles.note}>{t('place.locked', { n: place.unlockAfterStage })}</p>
          <Button block icon={ICONS.learn} to="/">
            {t('home.continue')}
          </Button>
        </div>
      ) : (
        <>
          {npc && (
            <Section title={t('place.npc')} description={t('npc.howToFriend', { name: loc(npc, 'name') })}>
              <NpcCard npc={npc} points={friendship[npc.id] ?? 0} />
            </Section>
          )}
          <Section title={t('place.talk')}>
            {talks.length ? (
              <TileList>
                {talks.map((scenario) => (
                  <Tile
                    key={scenario.id}
                    to={`/talk/${scenario.id}`}
                    image={scenario.image}
                    title={loc(scenario, 'name')}
                    description={scenario.goalTh}
                  />
                ))}
                {talks
                  .filter((scenario) => scenario.speedOrder)
                  .map((scenario) => (
                    <Tile
                      key={`${scenario.id}-speed`}
                      to={`/talk/${scenario.id}?mode=speed`}
                      icon={Timer}
                      title={t('talk.speedOrder')}
                      description={loc(scenario, 'name')}
                    />
                  ))}
              </TileList>
            ) : (
              <p className={styles.note}>{t('place.noTalk')}</p>
            )}
          </Section>
          <Section title={t('place.phrases')}>
            <TileList>
              {situations.map((situation) => (
                <Tile
                  key={situation.id}
                  to={`/phrases/${situation.id}`}
                  image={situation.image}
                  title={loc(situation, 'name')}
                />
              ))}
            </TileList>
          </Section>
        </>
      )}
    </Page>
  )
}
