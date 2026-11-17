// =========================================================
// PhrasesPage — คลังวลีใช้งานจริง (/phrases) (ส่วนที่ 5)
//   จัดกลุ่มตามสถานการณ์ที่เจอจริง (ทักทาย, สั่งอาหาร, ขอให้ช่วย …) ไม่ใช่ตามหมวดแบบเรียน → แตะเข้าไปดูวลีของสถานการณ์นั้น
//   + หน้า "คำในตำรา vs คำที่เจ้าของภาษาใช้จริง" (+ เกม Real or Textbook?)
// =========================================================
import { useTranslation } from 'react-i18next'
import { phraseSituations, phrasesOf, textbookVsReal } from '../data'
import { useLocalized } from '../hooks/useLocalized'
import { ICONS } from '../utils/icons'
import Page from '../components/Page'
import Section from '../components/Section'
import Tile, { TileList } from '../components/Tile'

export default function PhrasesPage() {
  const { t } = useTranslation()
  const loc = useLocalized()

  return (
    <Page title={t('phrases.title')} subtitle={t('phrases.subtitle')} backTo="/">
      <Section title={t('phrases.situations')}>
        <TileList>
          {phraseSituations.map((situation) => (
            <Tile
              key={situation.id}
              to={`/phrases/${situation.id}`}
              image={situation.image}
              title={loc(situation, 'name')}
              description={t('phrases.count', { count: phrasesOf(situation.id).length })}
            />
          ))}
        </TileList>
      </Section>
      <Section title={t('phrases.compare')}>
        <TileList>
          <Tile
            to="/phrases/real-vs-textbook"
            icon={ICONS.realVsTextbook}
            title={t('phrases.realVsTextbook')}
            description={t('phrases.pairCount', { count: textbookVsReal.length })}
          />
        </TileList>
      </Section>
    </Page>
  )
}
