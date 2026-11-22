// =========================================================
// RealVsTextbookPage — คำในตำรา vs คำที่เจ้าของภาษาใช้จริง (/phrases/real-vs-textbook?situation=<id>) (ส่วนที่ 5)
//   แต่ละคู่: สถานการณ์ (ไทย) → ในตำรา (ไม่ผิด แต่ไม่ค่อยมีใครพูด) → เจ้าของภาษาพูดว่า (1–2 แบบ + ป้าย register + ปุ่มฟัง)
//   → เหตุผลภาษาไทย / ท้ายหน้า: เกม Real or Textbook? (คู่ของสถานการณ์ที่เลือกก่อน แล้วเติมจากทุกคู่)
//   คู่มีกว่า 100 คู่ → แสดงทีละสถานการณ์ (ChipTabs + ?situation= — ค่าผิด/ไม่มี → สถานการณ์แรก)
// =========================================================
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookOpen, MessageCircle } from 'lucide-react'
import { phraseSituations, textbookPairsOf, textbookVsReal } from '../data'
import { useLocalized } from '../hooks/useLocalized'
import Page from '../components/Page'
import Section from '../components/Section'
import ChipTabs from '../components/ChipTabs'
import LineButton from '../components/lesson/LineButton'
import RealOrTextbookPlay from '../components/RealOrTextbookPlay'
import styles from './Phrases.module.css'

// สถานการณ์ที่มีคู่อย่างน้อย 1 คู่ (ลำดับเดียวกับหน้าคลังวลี)
const SITUATIONS = phraseSituations.filter((situation) => textbookPairsOf(situation.id).length > 0)

export default function RealVsTextbookPage() {
  const { t } = useTranslation()
  const loc = useLocalized()
  const [playing, setPlaying] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const situation = SITUATIONS.find((entry) => entry.id === searchParams.get('situation')) ?? SITUATIONS[0]
  const pairs = situation ? textbookPairsOf(situation.id) : textbookVsReal

  return (
    <Page title={t('phrases.realVsTextbook')} subtitle={t('phrases.realVsTextbookDesc')} backTo="/phrases">
      {!playing && (
        <>
          {SITUATIONS.length > 1 && (
            <div className={styles.groups}>
              <ChipTabs
                label={t('phrases.situations')}
                value={situation.id}
                onChange={(id) => setSearchParams({ situation: id }, { replace: true })}
                options={SITUATIONS.map((entry) => ({
                  value: entry.id,
                  label: loc(entry, 'name'),
                  count: textbookPairsOf(entry.id).length,
                }))}
              />
            </div>
          )}
          <ul className={styles.cards}>
            {pairs.map((pair) => (
              <li key={pair.id} className={styles.pair}>
                <p className={styles.pairMeaning} lang="th">
                  {pair.meaningTh}
                </p>
                <div className={styles.pairRow}>
                  <span className={styles.pairLabel}>
                    <BookOpen className={styles.pairIcon} aria-hidden="true" />
                    {t('phrases.textbook')}
                  </span>
                  <span className={styles.textbookText} lang="en">
                    {pair.textbook}
                  </span>
                  <LineButton text={pair.textbook} speakKey={`${pair.id}:textbook`} label={t('phrases.hearExample')} />
                </div>
                <div className={styles.pairReal}>
                  <span className={styles.pairLabel}>
                    <MessageCircle className={styles.pairIcon} aria-hidden="true" />
                    {t('phrases.real')}
                  </span>
                  <ul className={styles.realList}>
                    {pair.real.map((real, index) => (
                      <li key={real.text} className={styles.pairRow}>
                        <span className={styles.realText} lang="en">
                          {real.text}
                        </span>
                        <span className={styles.registerTag}>{t(`register.${real.register}`)}</span>
                        <LineButton text={real.text} speakKey={`${pair.id}:real${index}`} label={t('phrases.hearExample')} />
                      </li>
                    ))}
                  </ul>
                </div>
                <p className={styles.pairNote} lang="th">
                  {pair.noteTh}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
      <Section title={t('phrases.gameSection')}>
        <RealOrTextbookPlay key={situation?.id} pairs={pairs} pool={textbookVsReal} onPlayingChange={setPlaying} />
      </Section>
    </Page>
  )
}
