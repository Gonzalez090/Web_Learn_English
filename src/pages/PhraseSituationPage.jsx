// =========================================================
// PhraseSituationPage — วลีของสถานการณ์หนึ่ง (/phrases/:situationId?group=<หมวดย่อย>) (ส่วนที่ 5)
//   สถานการณ์ละ ~90 วลี แบ่งเป็นหมวดย่อย (ขั้นที่ 27) → เลือกหมวดด้วยปุ่มเม็ดยา (จำไว้ใน URL ย้อนกลับมาแล้วหมวดเดิม)
//   การ์ดวลีทีละใบ (ฟัง / พูดตาม / ตัวอย่าง / คนไทยมักพูดว่า) → ปุ่ม "หมวดถัดไป" → ท้ายหน้า: เกม Real or Textbook?
//   วลีเต็มโหลดแยกรายสถานการณ์ (useSituationPhrases) — สารบัญ/จำนวนวลีมากับไฟล์หลัก
//   พูดตามผ่าน 1 วลี (ครั้งแรกต่อการ์ด) = XP พูดตาม 15 + ภารกิจ "พูดตามผ่าน" / "ฝึกวลีใช้งานจริง"
// =========================================================
import { useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getPhraseSituation, textbookPairsOf, textbookVsReal } from '../data'
import { useSituationPhrases } from '../hooks/usePhrases'
import { useLocalized } from '../hooks/useLocalized'
import { useProgressStore } from '../store/progressStore'
import { XP } from '../utils/lessonSteps'
import { ICONS } from '../utils/icons'
import Page from '../components/Page'
import Section from '../components/Section'
import Button from '../components/Button'
import ChipTabs from '../components/ChipTabs'
import PhraseCard from '../components/PhraseCard'
import RealOrTextbookPlay from '../components/RealOrTextbookPlay'
import NotFoundPage from './NotFoundPage'
import styles from './Phrases.module.css'

export default function PhraseSituationPage() {
  const { situationId } = useParams()
  const situation = getPhraseSituation(situationId)
  if (!situation) return <NotFoundPage />
  return <SituationPhrases key={situation.id} situation={situation} />
}

function SituationPhrases({ situation }) {
  const { t } = useTranslation()
  const loc = useLocalized()
  const addXp = useProgressStore((state) => state.addXp)
  const trackEvent = useProgressStore((state) => state.trackEvent)
  const [playing, setPlaying] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const topRef = useRef(null)
  const phrases = useSituationPhrases(situation.id)

  // หมวดย่อยที่มีวลีจริง (ข้อมูลเก่าที่ไม่มีหมวด → แสดงทุกวลีรวมกัน)
  const groups = (situation.groups ?? []).filter((group) => phrases.some((phrase) => phrase.group === group.id))
  const requested = searchParams.get('group')
  const group = groups.find((entry) => entry.id === requested) ?? groups[0] ?? null
  const list = group ? phrases.filter((phrase) => phrase.group === group.id) : phrases
  const nextGroup = group ? groups[groups.indexOf(group) + 1] : null

  function chooseGroup(groupId, { scroll = false } = {}) {
    setSearchParams({ group: groupId }, { replace: true })
    if (scroll) topRef.current?.scrollIntoView({ block: 'start' })
  }

  function speakPass() {
    addXp(XP.speak)
    trackEvent('speakPass')
    trackEvent('phrase')
  }

  return (
    <Page title={loc(situation, 'name')} subtitle={t('phrases.situationSubtitle', { count: situation.phraseCount })} backTo="/phrases">
      {!playing && (
        <>
          {groups.length > 1 && (
            <div ref={topRef} className={styles.groups}>
              <ChipTabs
                label={t('phrases.groups')}
                value={group.id}
                onChange={(groupId) => chooseGroup(groupId)}
                options={groups.map((entry) => ({
                  value: entry.id,
                  label: loc(entry, 'name'),
                  count: phrases.filter((phrase) => phrase.group === entry.id).length,
                }))}
              />
            </div>
          )}
          <ul className={styles.cards}>
            {list.map((phrase) => (
              <li key={phrase.id}>
                <PhraseCard phrase={phrase} onSpeakPass={speakPass} />
              </li>
            ))}
          </ul>
          {nextGroup && (
            <div className={styles.nextGroup}>
              <Button block variant="secondary" icon={ICONS.next} onClick={() => chooseGroup(nextGroup.id, { scroll: true })}>
                {t('phrases.nextGroup', { name: loc(nextGroup, 'name') })}
              </Button>
            </div>
          )}
        </>
      )}
      <Section title={t('phrases.gameSection')}>
        <RealOrTextbookPlay pairs={textbookPairsOf(situation.id)} pool={textbookVsReal} onPlayingChange={setPlaying} />
      </Section>
    </Page>
  )
}
