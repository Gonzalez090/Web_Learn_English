// =========================================================
// RealOrTextbookPlay — ส่วนเล่นเกม "Real or Textbook?" ในหน้าคลังวลี (ใช้ทั้งหน้ารายสถานการณ์และหน้าคำในตำรา vs ใช้จริง)
//   ปุ่มเริ่ม → เกม 5 รอบ → สรุป (ถูกกี่รอบ + XP) → เล่นอีกครั้ง / เลิกเล่น
//   XP: เลือกถูกตั้งแต่ครั้งแรก 1 รอบ = 5 (เท่าเกมอื่น) + ภารกิจ "เล่นมินิเกม" / "ตอบถูกในมินิเกม"
// props: pairs (คู่หลักที่เล่นก่อน), pool (คู่ที่ใช้เติมให้ครบรอบ), onPlayingChange(true/false) (ซ่อนเนื้อหาอื่นตอนเล่น/ดูผล)
// =========================================================
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CircleHelp } from 'lucide-react'
import { useProgressStore } from '../store/progressStore'
import { XP } from '../utils/lessonSteps'
import Button from './Button'
import RealOrTextbookGame from './games/RealOrTextbookGame'
import styles from './RealOrTextbookPlay.module.css'

export default function RealOrTextbookPlay({ pairs, pool = pairs, onPlayingChange }) {
  const { t } = useTranslation()
  const addXp = useProgressStore((state) => state.addXp)
  const trackEvent = useProgressStore((state) => state.trackEvent)
  // mode: 'idle' (ปุ่มเริ่ม) → 'play' → 'done' (สรุป)
  const [mode, setMode] = useState('idle')
  const [gameKey, setGameKey] = useState(0)
  const [result, setResult] = useState({ correct: 0, total: 0, xp: 0 })
  const tallyRef = useRef({ correct: 0, total: 0, xp: 0 })

  // กำลังเล่น / ดูผล → ให้หน้าซ่อนรายการวลี (ผลสรุปอยู่บนสุด ไม่ตกไปท้ายหน้า) — กด "กลับไปดูวลี" ค่อยแสดงอีกครั้ง
  function changeMode(next) {
    setMode(next)
    onPlayingChange?.(next !== 'idle')
    window.scrollTo(0, 0)
  }

  function start() {
    tallyRef.current = { correct: 0, total: 0, xp: 0 }
    setGameKey((key) => key + 1)
    changeMode('play')
  }

  function roundResult(_item, firstTry) {
    tallyRef.current.total += 1
    if (!firstTry) return
    tallyRef.current.correct += 1
    tallyRef.current.xp += XP.gameCorrect
    addXp(XP.gameCorrect)
    trackEvent('gameCorrect')
  }

  function finish() {
    trackEvent('gamePlay')
    trackEvent('miniGame') // เกมที่เล่นแยก (หน้าคลังวลี) → ขั้น "มินิเกม" ของแผนวันนี้ (ขั้นที่ 18)
    setResult({ ...tallyRef.current })
    changeMode('done')
  }

  if (mode === 'play') {
    return <RealOrTextbookGame key={gameKey} items={pairs} pool={pool} onRoundResult={roundResult} onFinish={finish} />
  }

  if (mode === 'done') {
    return (
      <div className={styles.result} role="status">
        <p className={styles.title}>{t('phrases.gameDone')}</p>
        <p className={styles.score}>{t('phrases.gameScore', { n: result.correct, total: result.total })}</p>
        {result.xp > 0 && <p className={styles.xp}>{t('phrases.gameXp', { xp: result.xp })}</p>}
        <div className={styles.actions}>
          <Button block size="lg" icon={CircleHelp} onClick={start}>
            {t('phrases.playAgain')}
          </Button>
          <Button block variant="secondary" onClick={() => changeMode('idle')}>
            {t('phrases.backToList')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.start}>
      <p className={styles.intro}>{t('phrases.gameIntro')}</p>
      <Button block size="lg" icon={CircleHelp} onClick={start}>
        {t('phrases.playGame')}
      </Button>
    </div>
  )
}
