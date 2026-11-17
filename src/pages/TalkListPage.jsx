// =========================================================
// TalkListPage — รายการบทสนทนาสุ่ม (/talk) (ส่วนที่ 6)
//   ปุ่ม "สุ่มสถานการณ์" (เข้าสถานการณ์ไหนก็ได้) + เลือกสถานการณ์เอง (ภาพฉาก + เป้าหมาย)
//   (ขั้นที่ 14 แผนที่เมืองจะพาเข้าบทสนทนาของแต่ละสถานที่อีกทาง)
// =========================================================
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Dices } from 'lucide-react'
import { scenarios } from '../data'
import { useLocalized } from '../hooks/useLocalized'
import { randomSeed } from '../utils/conversation'
import Page from '../components/Page'
import Section from '../components/Section'
import Button from '../components/Button'
import Tile, { TileList } from '../components/Tile'
import styles from './Talk.module.css'

export default function TalkListPage() {
  const { t } = useTranslation()
  const loc = useLocalized()
  const navigate = useNavigate()

  function randomScenario() {
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)]
    navigate(`/talk/${scenario.id}?seed=${randomSeed()}`)
  }

  return (
    <Page title={t('talk.title')} subtitle={t('talk.subtitle')} backTo="/">
      <div className={styles.randomBox}>
        <p className={styles.note}>{t('talk.randomNote')}</p>
        <Button block size="lg" icon={Dices} onClick={randomScenario}>
          {t('talk.random')}
        </Button>
      </div>
      <Section title={t('talk.pick')}>
        <TileList>
          {scenarios.map((scenario) => (
            <Tile
              key={scenario.id}
              to={`/talk/${scenario.id}`}
              image={scenario.image}
              title={loc(scenario, 'name')}
              description={scenario.goalTh}
            />
          ))}
        </TileList>
      </Section>
    </Page>
  )
}
