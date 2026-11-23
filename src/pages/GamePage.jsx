// =========================================================
// GamePage — เล่นมินิเกมแยก (/games/:gameId, ขั้นที่ 17) ใช้ตัวเกมเดียวกับในบทเรียน (โหลดแยกไฟล์)
//   Listen & Tap / Shadow Karaoke / Word Swap Race → สุ่ม 1 บทที่เรียนจบแล้ว (utils/gamePool.js)
//   Minimal Pair Duel → สุ่ม 1 ชุดเสียงจากโหมดฝึกเสียง / Real or Textbook? → คู่ประโยคทั้งคลัง
//   Speed Order → เลือกบทสนทนาที่ปลดล็อกแล้ว (/talk/:id?mode=speed)
//   ยังไม่มีเนื้อหาที่เรียนแล้ว → บอกว่าต้องเรียน Stage ไหนก่อน
// =========================================================
import { Suspense, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getMiniGame, lessonList, soundPractice, textbookVsReal } from '../data'
import { useLesson } from '../hooks/useLessons'
import { useLocalized } from '../hooks/useLocalized'
import { useSpeedScenarios } from '../hooks/useSpeedScenarios'
import { useProgressStore } from '../store/progressStore'
import { randomSeed } from '../utils/conversation'
import { soundPairItems } from '../utils/duel'
import { gameAvailability, LESSON_GAMES, pickOther, playableLessons } from '../utils/gamePool'
import { LESSON_FLOWS } from '../utils/lessonSteps'
import { ICONS } from '../utils/icons'
import Page from '../components/Page'
import PageLoading from '../components/PageLoading'
import Button from '../components/Button'
import Tile, { TileList } from '../components/Tile'
import GameRunner from '../components/games/GameRunner'
import ListenTapGame from '../components/games/ListenTapGame'
import ShadowKaraokeGame from '../components/games/ShadowKaraokeGame'
import WordSwapRaceGame from '../components/games/WordSwapRaceGame'
import MinimalPairDuelGame from '../components/games/MinimalPairDuelGame'
import RealOrTextbookGame from '../components/games/RealOrTextbookGame'
import NotFoundPage from './NotFoundPage'
import styles from '../components/games/GameRunner.module.css'

const LESSON_GAME_COMPONENTS = {
  'listen-tap': ListenTapGame,
  'shadow-karaoke': ShadowKaraokeGame,
  'word-swap-race': WordSwapRaceGame,
}

// เกมที่ใช้บทเรียน: สุ่มบทที่เรียนจบแล้ว (เล่นอีกครั้ง = สุ่มบทอื่น)
// เลือกบทนอก Suspense → ระหว่างรอโหลดไม่สุ่มใหม่ (ไม่งั้นโหลดหลาย Stage เกินจำเป็น)
function LessonGame({ game }) {
  const lessonProgress = useProgressStore((state) => state.lessonProgress)
  const [lessonId, setLessonId] = useState(() => pickOther(playableLessons(game.id, lessonList, lessonProgress)).id)
  const pickAgain = () => setLessonId((last) => pickOther(playableLessons(game.id, lessonList, lessonProgress), last).id)

  return (
    <Suspense fallback={<PageLoading />}>
      <LessonRound game={game} lessonId={lessonId} onAgain={pickAgain} />
    </Suspense>
  )
}

function LessonRound({ game, lessonId, onAgain }) {
  const loc = useLocalized()
  const lesson = useLesson(lessonId)
  const Game = LESSON_GAME_COMPONENTS[game.id]
  const isRace = game.id === 'word-swap-race'

  return (
    <GameRunner
      game={game}
      source={loc(lesson, 'title')}
      countOnly={isRace}
      ownIntro={isRace}
      onAgain={onAgain}
    >
      {(handlers) => <Game key={lesson.id} items={lesson.items} ordered={LESSON_FLOWS[lesson.type].keepOrder} {...handlers} />}
    </GameRunner>
  )
}

// Minimal Pair Duel: สุ่มชุดเสียงที่คนไทยออกยาก
function DuelGame({ game }) {
  const loc = useLocalized()
  const [set, setSet] = useState(() => pickOther(soundPractice))

  return (
    <GameRunner game={game} source={loc(set, 'title')} onAgain={() => setSet((last) => pickOther(soundPractice, last.id))}>
      {(handlers) => <MinimalPairDuelGame key={set.id} items={soundPairItems(set)} showMeaning {...handlers} />}
    </GameRunner>
  )
}

function TextbookGame({ game }) {
  return <GameRunner game={game}>{(handlers) => <RealOrTextbookGame items={textbookVsReal} {...handlers} />}</GameRunner>
}

// Speed Order: บทสนทนาจับเวลาที่เปิดแล้ว (สุ่มบทพูดใหม่ทุกครั้งที่เข้าหน้านี้)
function SpeedOrder({ game, scenarios }) {
  const loc = useLocalized()
  const [seed] = useState(randomSeed)
  return (
    <Page title={game.name} subtitle={loc(game, 'description')} backTo="/games">
      <TileList>
        {scenarios.map((scenario) => (
          <Tile
            key={scenario.id}
            to={`/talk/${scenario.id}?seed=${seed}&mode=speed`}
            image={scenario.image}
            title={loc(scenario, 'name')}
            description={loc(scenario, 'goal')}
          />
        ))}
      </TileList>
    </Page>
  )
}

// ยังเล่นไม่ได้: บอกว่าต้องเรียน Stage ไหนก่อน + ปุ่มไปเรียน
function LockedGame({ game, stage }) {
  const { t } = useTranslation()
  const loc = useLocalized()
  const unlockedStages = useProgressStore((state) => state.unlockedStages)
  const LockIcon = ICONS.locked
  return (
    <Page title={game.name} subtitle={loc(game, 'description')} backTo="/games">
      <div className={styles.box} role="note">
        <LockIcon className={styles.icon} aria-hidden="true" />
        <p className={styles.title}>{t('games.lockedTitle')}</p>
        <p className={styles.text}>{t(LESSON_GAMES[game.id] ? 'games.lockedLesson' : 'games.lockedStage', { n: stage })}</p>
        <Button block to={unlockedStages.includes(stage) ? `/learn/${stage}` : '/learn'} icon={ICONS.learn}>
          {t('games.goLearn')}
        </Button>
      </div>
    </Page>
  )
}

export default function GamePage() {
  const { gameId } = useParams()
  const lessonProgress = useProgressStore((state) => state.lessonProgress)
  const speedScenarios = useSpeedScenarios()

  const game = getMiniGame(gameId)
  if (!game) return <NotFoundPage />
  const { ready, stage } = gameAvailability(gameId, { lessonList, lessonProgress, speedScenarios })

  if (!ready) return <LockedGame game={game} stage={stage} />
  if (LESSON_GAMES[gameId]) return <LessonGame key={gameId} game={game} />
  if (gameId === 'minimal-pair-duel') return <DuelGame game={game} />
  if (gameId === 'real-or-textbook') return <TextbookGame game={game} />
  return <SpeedOrder game={game} scenarios={speedScenarios} />
}
