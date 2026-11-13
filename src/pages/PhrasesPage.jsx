// PhrasesPage — คลังวลีใช้งานจริง จัดกลุ่มตามสถานการณ์ (ทำในขั้นที่ 10)
import { useTranslation } from 'react-i18next'
import { ICONS } from '../utils/icons'
import Page from '../components/Page'
import Tile, { TileList } from '../components/Tile'
import ComingSoon from '../components/ComingSoon'

export default function PhrasesPage() {
  const { t } = useTranslation()

  return (
    <Page title={t('phrases.title')} subtitle={t('phrases.subtitle')} backTo="/">
      <TileList>
        <Tile
          to="/phrases/real-vs-textbook"
          icon={ICONS.realVsTextbook}
          title={t('phrases.realVsTextbook')}
          description={t('phrases.realVsTextbookDesc')}
        />
      </TileList>
      <ComingSoon step={10} />
    </Page>
  )
}
