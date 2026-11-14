// =========================================================
// ContextSentence — ประโยคในบริบท (ส่วนที่ 2.2 + 2.3) สำหรับบทประเภท context (Stage 5+)
//   - ฉาก (scene) + ประโยคแบบที่เจ้าของภาษาพูดจริง 1–3 ประโยค
//   - คำลงเสียงหนัก + ลูกศรทำนองเสียง (SentenceText) + คำอ่านไทย / คำแปลไทย (ตามตั้งค่า)
//   - connectedSpeech: ป้าย "เจ้าของภาษาพูดว่า…" เช่น wanna = want to, did you → ฟังเป็น didja (+ คำอ่านไทย)
//   - alsoSay: พูดแบบอื่นได้ (สุภาพ / กันเอง) พร้อมปุ่มฟัง
// props: item, display (ผลจาก useSentenceDisplay)
// =========================================================
import { useTranslation } from 'react-i18next'
import { MessageCircle } from 'lucide-react'
import { useLocalized } from '../../hooks/useLocalized'
import SentenceText from '../SentenceText'
import ThaiReading from '../ThaiReading'
import SpeakButton from '../SpeakButton'
import styles from './ContextSentence.module.css'

export default function ContextSentence({ item, display }) {
  const { t } = useTranslation()
  const loc = useLocalized()
  const scene = loc(item, 'scene')

  return (
    <div className={styles.card}>
      {scene && <p className={styles.scene}>{scene}</p>}
      <SentenceText text={item.target} stressWords={item.stressWords} intonation={item.intonation} size="lg" />
      {display.readingVisible && <ThaiReading reading={item.readingTh} />}
      {display.meaningVisible && (
        <p className={styles.meaning} lang="th">
          {item.translationTh}
        </p>
      )}

      {item.connectedSpeech?.length > 0 && (
        <div className={styles.block}>
          <p className={styles.label}>
            <MessageCircle className={styles.labelIcon} aria-hidden="true" />
            {t('context.connected')}
          </p>
          <ul className={styles.chips}>
            {item.connectedSpeech.map((entry) => (
              <li key={entry.text} className={styles.chip}>
                <span className={styles.chipText} lang="en">
                  {entry.text}
                </span>
                <span className={styles.chipNote}>
                  {entry.full ? t('context.means', { full: entry.full }) : t('context.soundsLike', { spoken: entry.spoken })}
                </span>
                <span className={styles.chipReading} lang="th">
                  {entry.readingTh}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {item.alsoSay?.length > 0 && (
        <div className={styles.block}>
          <p className={styles.label}>{t('context.alsoSay')}</p>
          {item.alsoSay.map((other, index) => (
            <div key={other.text} className={styles.other}>
              <span className={styles.tag}>{t(`register.${other.register}`)}</span>
              <p className={styles.otherText} lang="en">
                {other.text}
              </p>
              {display.meaningVisible && (
                <p className={styles.meaning} lang="th">
                  {other.translationTh}
                </p>
              )}
              <SpeakButton text={other.text} id={`${item.id}:also-${index}`} size="sm" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
