// GamePage — หน้าเล่นมินิเกมแต่ละเกม (/games/:gameId) (ทำในขั้นที่ 17a–17f)
import { useParams } from 'react-router-dom'
import { getMiniGame } from '../data'
import { useLocalized } from '../hooks/useLocalized'
import Page from '../components/Page'
import ComingSoon from '../components/ComingSoon'
import NotFoundPage from './NotFoundPage'

export default function GamePage() {
  const { gameId } = useParams()
  const loc = useLocalized()

  const game = getMiniGame(gameId)
  if (!game) return <NotFoundPage />

  return (
    <Page title={game.name} subtitle={loc(game, 'description')} backTo="/games">
      <ComingSoon step={game.step} />
    </Page>
  )
}
