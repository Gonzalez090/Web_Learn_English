// =========================================================
// SoundDrillPage — ฝึกเสียงหนึ่งชุด (/sounds/:soundId) (ส่วนที่ 10.1)
//   1) ออกเสียงอย่างไร (ตำแหน่งปาก/ลิ้น เป็นภาษาไทย) + คนไทยมักพลาดตรงไหน
//   2) ฟังคู่คำ (แตะคำเพื่อฟัง) — think / sink …
//   3) เกม Minimal Pair Duel: ฟังคำ แล้วเลือกว่าได้ยินคำไหน (ระบบรับเสียงตรวจการออกเสียงคู่คำไม่ได้ → ฝึกแบบฟังแล้วเลือก)
//   4) สรุป: ถูกกี่คู่ + XP → เล่นอีกครั้ง / กลับไปฟังคู่คำ / เลือกเสียงอื่น
// XP: เลือกถูก 1 รอบ = 5 (เท่าเกมอื่น) / จบ 1 ชุด = ภารกิจ "ฝึกเสียงที่คนไทยออกยาก 1 ชุด"
// =========================================================
import { useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Swords } from 'lucide-react'
import { soundPractice } from '../data'
import { useLocalized } from '../hooks/useLocalized'
import { useSpeech } from '../hooks/useSpeech'
import { useProgressStore } from '../store/progressStore'
import { soundPairItems } from '../utils/duel'
import { XP } from '../utils/lessonSteps'
import Page from '../components/Page'
import Section from '../components/Section'
import Button from '../components/Button'
import MinimalPairDuelGame from '../components/games/MinimalPairDuelGame'
import NotFoundPage from './NotFoundPage'
import styles from './SoundPractice.module.css'

// ปุ่มคำ 1 คำในคู่: แตะเพื่อฟัง
function PairWord({ text, meaningTh, speakKey }) {
  const { speak, speakingKey } = useSpeech()
  return (
    <button
      type="button"
      className={speakingKey === speakKey ? `${styles.word} ${styles.playing}` : styles.word}
      onClick={() => speak(text, { key: speakKey })}
    >
      <span className={styles.wordText} lang="en">
        {text}
      </span>
      <span className={styles.wordMeaning} lang="th">
        {meaningTh}
      </span>
    </button>
  )
}

export default function SoundDrillPage() {
  const { soundId } = useParams()
  const { t } = useTranslation()
  const loc = useLocalized()
  const addXp = useProgressStore((state) => state.addXp)
  const trackEvent = useProgressStore((state) => state.trackEvent)
  const set = soundPractice.find((entry) => entry.id === soundId)
  const items = useMemo(() => soundPairItems(set), [set])
  // mode: 'learn' (วิธีออกเสียง + ฟังคู่คำ) → 'play' (เกม) → 'done' (สรุป)
  const [mode, setMode] = useState('learn')
  const [gameKey, setGameKey] = useState(0) // เล่นอีกครั้ง = เริ่มเกมใหม่ (สุ่มรอบใหม่)
  const [result, setResult] = useState({ correct: 0, xp: 0 })
  const tallyRef = useRef({ correct: 0, xp: 0 })

  if (!set) return <NotFoundPage />

  function startGame() {
    tallyRef.current = { correct: 0, xp: 0 }
    setGameKey((key) => key + 1)
    setMode('play')
  }

  function roundResult(_item, firstTry) {
    if (!firstTry) return
    tallyRef.current.correct += 1
    tallyRef.current.xp += XP.gameCorrect
    addXp(XP.gameCorrect)
    trackEvent('gameCorrect')
  }

  function finishGame() {
    trackEvent('gamePlay')
    trackEvent('miniGame') // เกมที่เล่นแยก → ขั้น "มินิเกม" ของแผนวันนี้ (ขั้นที่ 18)
    trackEvent('sound')
    setResult({ ...tallyRef.current })
    setMode('done')
  }

  const great = result.correct >= Math.ceil(items.length * 0.8)

  return (
    <Page title={loc(set, 'title')} subtitle={loc(set, 'summary')} backTo="/sounds">
      {mode === 'learn' && (
        <>
          <Section title={t('sounds.howTo')}>
            <p className={styles.tip} lang="th">
              {set.tipTh}
            </p>
          </Section>
          <Section title={t('sounds.mistake')}>
            <p className={styles.tip} lang="th">
              {set.mistakeTh}
            </p>
          </Section>
          <Section title={t('sounds.pairs')}>
            <ul className={styles.pairs}>
              {set.pairs.map((pair) => (
                <li key={`${pair.a}-${pair.b}`} className={styles.pair}>
                  <PairWord text={pair.a} meaningTh={pair.aTh} speakKey={`sound:${set.id}:${pair.a}`} />
                  <PairWord text={pair.b} meaningTh={pair.bTh} speakKey={`sound:${set.id}:${pair.b}`} />
                </li>
              ))}
            </ul>
          </Section>
          <Button block size="lg" icon={Swords} onClick={startGame}>
            {t('sounds.startDuel')}
          </Button>
          <p className={styles.note}>{t('sounds.note')}</p>
        </>
      )}

      {mode === 'play' && (
        <MinimalPairDuelGame
          key={gameKey}
          items={items}
          showMeaning
          onRoundResult={roundResult}
          onFinish={finishGame}
        />
      )}

      {mode === 'done' && (
        <div className={styles.result} role="status">
          <p className={styles.resultTitle}>{t('sounds.resultTitle')}</p>
          <p className={styles.resultScore}>{t('sounds.score', { n: result.correct, total: items.length })}</p>
          {result.xp > 0 && <p className={styles.resultXp}>{t('sounds.xp', { xp: result.xp })}</p>}
          <p className={styles.tip}>{t(great ? 'sounds.great' : 'sounds.keepGoing')}</p>
          <div className={styles.resultActions}>
            <Button block size="lg" onClick={startGame}>
              {t('sounds.playAgain')}
            </Button>
            <Button block variant="secondary" onClick={() => setMode('learn')}>
              {t('sounds.backToPairs')}
            </Button>
            <Button block variant="ghost" to="/sounds">
              {t('sounds.otherSounds')}
            </Button>
          </div>
        </div>
      )}
    </Page>
  )
}
