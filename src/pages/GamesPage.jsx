// =========================================================
// GamesPage — รายการมินิเกมทั้ง 6 เกม (ตัวเกมทำในขั้นที่ 17a–17f)
// ชื่อเกมเป็นชื่อเฉพาะ (อังกฤษ) ส่วนคำอธิบายเปลี่ยนตามภาษาหน้าเว็บ
// =========================================================
import { useTranslation } from 'react-i18next'
import { miniGames } from '../data'
import { useLocalized } from '../hooks/useLocalized'
import { GAME_ICONS } from '../utils/icons'
import Page from '../components/Page'
import Tile, { TileList } from '../components/Tile'

export default function GamesPage() {
  const { t } = useTranslation()
  const loc = useLocalized()

  return (
    <Page title={t('games.title')} subtitle={t('games.subtitle')}>
      <TileList>
        {miniGames.map((game) => (
          <Tile
            key={game.id}
            to={`/games/${game.id}`}
            icon={GAME_ICONS[game.id]}
            title={game.name}
            description={loc(game, 'description')}
          />
        ))}
      </TileList>
    </Page>
  )
}
