// =========================================================
// NativeSample — "เจ้าของภาษาเล่าภาพชุดนี้แบบนี้" (ฟังหลังอัดเสร็จ ไว้เทียบกับที่ตัวเองพูด)
//   ใช้ประโยคของเรื่องเล่า Stage 5 ชุดเดียวกับภาพ (มีไฟล์เสียงอยู่แล้ว) — ฟังทั้งเรื่อง ปกติ/ช้า หรือทีละประโยค
// props: lines = game.json speakingCheck.pictures [{ id, target, translationTh }]
// =========================================================
import { useTranslation } from 'react-i18next'
import { lineSpeakKey, useLinePlayer } from '../../hooks/useLinePlayer'
import PlayAllButtons from '../lesson/PlayAllButtons'
import LineButton from '../lesson/LineButton'
import styles from './Speaking.module.css'

export default function NativeSample({ lines }) {
  const { t } = useTranslation()
  const { current, rate, playAll, stopAll } = useLinePlayer(lines, { gapMs: 700 })

  return (
    <div className={styles.sample}>
      <PlayAllButtons label={t('speakingCheck.playSample')} playingRate={rate} onPlay={(next) => playAll({ rate: next })} onStop={stopAll} />
      <ol className={styles.sampleLines}>
        {lines.map((line, index) => (
          <li key={line.id} className={index === current ? `${styles.sampleLine} ${styles.sampleLineActive}` : styles.sampleLine}>
            <LineButton text={line.target} speakKey={lineSpeakKey(line)} label={t('speakingCheck.playLine', { number: index + 1 })} />
            <div>
              <p className={styles.sampleText} lang="en">
                {line.target}
              </p>
              <p className={styles.sampleTh}>{line.translationTh}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
