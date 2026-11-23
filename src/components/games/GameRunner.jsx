// =========================================================
// GameRunner — กรอบเล่นมินิเกมแยก (/games/:gameId, ขั้นที่ 17): เริ่ม → เล่น → สรุป → เล่นอีกครั้ง
//   XP ต่อรอบเท่าในบทเรียน (GAME_ROUND_XP), เล่นจบ = เหตุการณ์ gamePlay + miniGame (แผนวันนี้)
//   ไม่ส่งข้อที่พลาดเข้ารายการทบทวน (เล่นเพื่อความสนุก) / ไม่มีระบบหัวใจ
// props:
//   game         ข้อมูลเกม (id, name, description/Th)
//   source       ชื่อเนื้อหาของรอบนี้ (เช่น ชื่อบท) — ไม่มี = ไม่แสดง
//   countOnly    นับเฉพาะรอบที่ถูก (Word Swap Race: เดาผิดไม่นับ) → สรุป "ทำได้ n" แทน "n จาก total"
//   ownIntro     ตัวเกมมีหน้าเริ่มของตัวเองแล้ว (Word Swap Race) → ไม่ต้องกดเริ่มซ้ำสองหน้า
//   onAgain      เตรียมเนื้อหารอบใหม่ก่อนเล่นอีกครั้ง (เช่น สุ่มบทใหม่)
//   children     ({ onRoundResult, onFinish }) => ตัวเกม
// =========================================================
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocalized } from '../../hooks/useLocalized'
import { useProgressStore } from '../../store/progressStore'
import { GAME_ROUND_XP } from '../../utils/lessonSteps'
import { GAME_ICONS, ICONS } from '../../utils/icons'
import Page from '../Page'
import Button from '../Button'
import styles from './GameRunner.module.css'

const EMPTY = { correct: 0, total: 0, xp: 0, skipped: false }

export default function GameRunner({ game, source, countOnly = false, ownIntro = false, onAgain, children }) {
  const { t } = useTranslation()
  const loc = useLocalized()
  const gameId = game.id
  const playRef = useRef(null)
  const addXp = useProgressStore((state) => state.addXp)
  const trackEvent = useProgressStore((state) => state.trackEvent)
  const [mode, setMode] = useState(ownIntro ? 'play' : 'idle') // 'idle' → 'play' → 'done'
  const [round, setRound] = useState(0) // เล่นอีกครั้ง = เริ่มตัวเกมใหม่ (สุ่มใหม่)
  const [result, setResult] = useState(EMPTY)

  // จอเตี้ย: เลื่อนให้ตัวเกมเริ่มใต้แถบบน ตัวเลือก/ปุ่มไม่จมใต้แถบเมนู (Page ตอนเล่นไม่มีคำอธิบายแล้ว)
  useEffect(() => {
    if (mode === 'play' && round > 0) playRef.current?.scrollIntoView({ block: 'start' })
  }, [mode, round])

  function changeMode(next) {
    setMode(next)
    window.scrollTo(0, 0)
  }

  function start() {
    setResult(EMPTY)
    setRound((value) => value + 1)
    changeMode('play')
  }

  function again() {
    onAgain?.()
    start()
  }

  function onRoundResult(_item, passed) {
    const xp = passed ? GAME_ROUND_XP[gameId] : 0
    setResult((value) => ({
      ...value,
      correct: value.correct + (passed ? 1 : 0),
      total: value.total + 1,
      xp: value.xp + xp,
    }))
    if (!passed) return
    addXp(xp)
    trackEvent('gameCorrect')
  }

  function onFinish(outcome) {
    const skipped = Boolean(outcome?.skipped)
    if (!skipped) {
      trackEvent('gamePlay')
      trackEvent('miniGame')
    }
    setResult((value) => ({ ...value, skipped }))
    changeMode('done')
  }

  if (mode === 'play') {
    return (
      <Page title={source ?? game.name} backTo="/games">
        <div key={round} ref={playRef} className={styles.play}>
          {children({ onRoundResult, onFinish })}
        </div>
      </Page>
    )
  }

  if (mode === 'done') {
    const score = countOnly
      ? t('games.scoreCount', { n: result.correct })
      : t('games.score', { n: result.correct, total: result.total })
    return (
      <Page title={game.name} backTo="/games">
        <div className={styles.box} role="status">
          <p className={styles.title}>{t(result.skipped ? 'games.skippedTitle' : 'games.doneTitle')}</p>
          {result.skipped ? <p className={styles.text}>{t('games.skippedText')}</p> : <p className={styles.score}>{score}</p>}
          {result.xp > 0 && <p className={styles.xp}>{t('games.xp', { xp: result.xp })}</p>}
          <div className={styles.actions}>
            <Button block size="lg" icon={GAME_ICONS[gameId]} onClick={again}>
              {t('games.again')}
            </Button>
            <Button block variant="secondary" to="/games">
              {t('games.other')}
            </Button>
          </div>
        </div>
      </Page>
    )
  }

  return (
    <Page title={game.name} subtitle={loc(game, 'description')} backTo="/games">
      <div className={styles.box}>
        {source && <p className={styles.text}>{t('games.source', { title: source })}</p>}
        <Button block size="lg" icon={ICONS.unlocked} onClick={start}>
          {t('games.start')}
        </Button>
      </div>
    </Page>
  )
}
