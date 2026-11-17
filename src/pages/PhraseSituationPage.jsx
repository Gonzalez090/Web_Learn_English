// =========================================================
// PhraseSituationPage — วลีของสถานการณ์หนึ่ง (/phrases/:situationId) (ส่วนที่ 5)
//   การ์ดวลีทีละใบ (ฟัง / พูดตาม / ตัวอย่าง / คนไทยมักพูดว่า) → ท้ายหน้า: เกม Real or Textbook? ของสถานการณ์นี้
//   พูดตามผ่าน 1 วลี (ครั้งแรกต่อการ์ด) = XP พูดตาม 15 + ภารกิจ "พูดตามผ่าน" / "ฝึกวลีใช้งานจริง"
// =========================================================
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getPhraseSituation, phrasesOf, textbookPairsOf, textbookVsReal } from '../data'
import { useLocalized } from '../hooks/useLocalized'
import { useProgressStore } from '../store/progressStore'
import { XP } from '../utils/lessonSteps'
import Page from '../components/Page'
import Section from '../components/Section'
import PhraseCard from '../components/PhraseCard'
import RealOrTextbookPlay from '../components/RealOrTextbookPlay'
import NotFoundPage from './NotFoundPage'
import styles from './Phrases.module.css'

export default function PhraseSituationPage() {
  const { situationId } = useParams()
  const { t } = useTranslation()
  const loc = useLocalized()
  const addXp = useProgressStore((state) => state.addXp)
  const trackEvent = useProgressStore((state) => state.trackEvent)
  const [playing, setPlaying] = useState(false)
  const situation = getPhraseSituation(situationId)

  if (!situation) return <NotFoundPage />

  const list = phrasesOf(situation.id)

  function speakPass() {
    addXp(XP.speak)
    trackEvent('speakPass')
    trackEvent('phrase')
  }

  return (
    <Page title={loc(situation, 'name')} subtitle={t('phrases.situationSubtitle', { count: list.length })} backTo="/phrases">
      {!playing && (
        <ul className={styles.cards}>
          {list.map((phrase) => (
            <li key={phrase.id}>
              <PhraseCard phrase={phrase} onSpeakPass={speakPass} />
            </li>
          ))}
        </ul>
      )}
      <Section title={t('phrases.gameSection')}>
        <RealOrTextbookPlay pairs={textbookPairsOf(situation.id)} pool={textbookVsReal} onPlayingChange={setPlaying} />
      </Section>
    </Page>
  )
}
