// =========================================================
// GamesPage — รายการมินิเกมทั้ง 6 เกม (ขั้นที่ 17) — เกมที่ยังไม่มีเนื้อหาที่เรียนแล้ว บอกว่าต้องเรียนถึงไหนก่อน
// ชื่อเกมเป็นชื่อเฉพาะ (อังกฤษ) ส่วนคำอธิบายเปลี่ยนตามภาษาหน้าเว็บ
// =========================================================
import { useTranslation } from 'react-i18next'
import { lessonList, miniGames } from '../data'
import { useLocalized } from '../hooks/useLocalized'
import { useSpeedScenarios } from '../hooks/useSpeedScenarios'
import { useProgressStore } from '../store/progressStore'
import { gameAvailability, LESSON_GAMES } from '../utils/gamePool'
import { GAME_ICONS, ICONS } from '../utils/icons'
import Page from '../components/Page'
import Tile, { TileList } from '../components/Tile'

export default function GamesPage() {
  const { t } = useTranslation()
  const loc = useLocalized()
  const lessonProgress = useProgressStore((state) => state.lessonProgress)
  const speedScenarios = useSpeedScenarios()

  return (
    <Page title={t('games.title')} subtitle={t('games.subtitle')}>
      <TileList>
        {miniGames.map((game) => {
          const { ready, stage } = gameAvailability(game.id, { lessonList, lessonProgress, speedScenarios })
          return (
            <Tile
              key={game.id}
              to={`/games/${game.id}`}
              icon={ready ? GAME_ICONS[game.id] : ICONS.locked}
              title={game.name}
              description={ready ? loc(game, 'description') : t(LESSON_GAMES[game.id] ? 'games.lockedLesson' : 'games.lockedStage', { n: stage })}
            />
          )
        })}
      </TileList>
    </Page>
  )
}
