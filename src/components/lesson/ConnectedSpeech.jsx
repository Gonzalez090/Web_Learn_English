// =========================================================
// ConnectedSpeech — ป้าย "เจ้าของภาษาพูดว่า…" (ส่วนที่ 2.3: เสียงพูดเชื่อม)
//   เช่น wanna = want to, did you → ฟังเป็น didja + คำอ่านไทย
// ใช้ในประโยคในบริบท (ContextSentence) และกล่องบทสนทนา (DialogueBubble)
// props: entries = item.connectedSpeech [{ text, full | spoken, readingTh }], compact = ขนาดเล็ก (ในกล่องแชต)
// =========================================================
import { useTranslation } from 'react-i18next'
import { MessageCircle } from 'lucide-react'
import styles from './ConnectedSpeech.module.css'

export default function ConnectedSpeech({ entries, compact = false }) {
  const { t } = useTranslation()
  if (!entries?.length) return null

  return (
    <div className={compact ? `${styles.wrap} ${styles.compact}` : styles.wrap}>
      <p className={styles.label}>
        <MessageCircle className={styles.labelIcon} aria-hidden="true" />
        {t('context.connected')}
      </p>
      <ul className={styles.chips}>
        {entries.map((entry) => (
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
  )
}
