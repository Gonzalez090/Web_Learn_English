// =========================================================
// TalkListPage — รายการบทสนทนาสุ่ม (/talk) (ส่วนที่ 6)
//   ปุ่ม "สุ่มสถานการณ์" (เข้าสถานการณ์ไหนก็ได้) + เลือกสถานการณ์เอง (ภาพฉาก + เป้าหมาย)
//   (ขั้นที่ 14 แผนที่เมืองจะพาเข้าบทสนทนาของแต่ละสถานที่อีกทาง)
// =========================================================
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Dices, Timer } from 'lucide-react'
import { getNpc, scenarioList } from '../data'
import { useLocalized } from '../hooks/useLocalized'
import { useProgressStore } from '../store/progressStore'
import { randomSeed } from '../utils/conversation'
import { isScenarioLocked } from '../utils/friendship'
import Page from '../components/Page'
import Section from '../components/Section'
import Button from '../components/Button'
import Tile, { TileList } from '../components/Tile'
import styles from './Talk.module.css'

export default function TalkListPage() {
  const { t } = useTranslation()
  const loc = useLocalized()
  const navigate = useNavigate()
  const friendship = useProgressStore((state) => state.npcFriendship)
  // บทที่ต้องสนิทกับ NPC ก่อน (ขั้นที่ 28-1) ยังเล่นไม่ได้ → ไม่สุ่มเข้า แต่ยังแสดงในรายการ (ล็อก + บอกว่าต้องสนิทกับใคร)
  const open = scenarioList.filter((scenario) => !isScenarioLocked(scenario, friendship))

  function randomScenario() {
    const scenario = open[Math.floor(Math.random() * open.length)]
    navigate(`/talk/${scenario.id}?seed=${randomSeed()}`)
  }

  // มินิเกม Speed Order (ขั้นที่ 12): บทสนทนาสุ่มแบบจับเวลา — สุ่มจากสถานการณ์ที่สั่งของ (speedOrder)
  function speedOrder() {
    const choices = open.filter((scenario) => scenario.speedOrder)
    const scenario = choices[Math.floor(Math.random() * choices.length)]
    navigate(`/talk/${scenario.id}?seed=${randomSeed()}&mode=speed`)
  }

  return (
    <Page title={t('talk.title')} subtitle={t('talk.subtitle')} backTo="/">
      <div className={styles.randomBox}>
        <p className={styles.note}>{t('talk.randomNote')}</p>
        <Button block size="lg" icon={Dices} onClick={randomScenario}>
          {t('talk.random')}
        </Button>
        <Button block variant="secondary" icon={Timer} onClick={speedOrder}>
          {t('talk.speedOrder')}
        </Button>
      </div>
      <Section title={t('talk.pick')}>
        <TileList>
          {scenarioList.map((scenario) => {
            const locked = isScenarioLocked(scenario, friendship)
            const npc = getNpc(scenario.npcId)
            return (
              <Tile
                key={scenario.id}
                to={`/talk/${scenario.id}`}
                image={scenario.image}
                title={loc(scenario, 'name')}
                description={
                  locked
                    ? t('talk.lockedShort', { name: loc(npc, 'name'), level: t(`npc.level.${scenario.minFriendship}`) })
                    : scenario.goalTh
                }
                locked={locked}
              />
            )
          })}
        </TileList>
      </Section>
    </Page>
  )
}
