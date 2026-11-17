// =========================================================
// RealVsTextbookPage — คำในตำรา vs คำที่เจ้าของภาษาใช้จริง (/phrases/real-vs-textbook) (ส่วนที่ 5)
//   แต่ละคู่: สถานการณ์ (ไทย) → ในตำรา (ไม่ผิด แต่ไม่ค่อยมีใครพูด) → เจ้าของภาษาพูดว่า (1–2 แบบ + ป้าย register + ปุ่มฟัง)
//   → เหตุผลภาษาไทย / ท้ายหน้า: เกม Real or Textbook? สุ่มจากทุกคู่
// =========================================================
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen, MessageCircle } from 'lucide-react'
import { textbookVsReal } from '../data'
import Page from '../components/Page'
import Section from '../components/Section'
import LineButton from '../components/lesson/LineButton'
import RealOrTextbookPlay from '../components/RealOrTextbookPlay'
import styles from './Phrases.module.css'

export default function RealVsTextbookPage() {
  const { t } = useTranslation()
  const [playing, setPlaying] = useState(false)

  return (
    <Page title={t('phrases.realVsTextbook')} subtitle={t('phrases.realVsTextbookDesc')} backTo="/phrases">
      {!playing && (
        <ul className={styles.cards}>
          {textbookVsReal.map((pair) => (
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
      )}
      <Section title={t('phrases.gameSection')}>
        <RealOrTextbookPlay pairs={textbookVsReal} onPlayingChange={setPlaying} />
      </Section>
    </Page>
  )
}
