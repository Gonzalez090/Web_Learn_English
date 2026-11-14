// =========================================================
// SentenceText — ประโยคภาษาอังกฤษ (ส่วนที่ 2.3 การพูดแบบเจ้าของภาษา)
//   - คำที่ลงเสียงหนัก (stressWords) เป็นตัวหนา + ขีดเส้นใต้
//   - ลูกศรท้ายประโยคบอกทำนองเสียง ↗ (ขึ้น) / ↘ (ลง)
// props: text, stressWords[], intonation ('up' | 'down'), size ('md' | 'lg')
// =========================================================
import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { markStress } from '../utils/display'
import styles from './SentenceText.module.css'

const ARROWS = { up: ArrowUpRight, down: ArrowDownRight }

export default function SentenceText({ text, stressWords, intonation, size = 'md' }) {
  const { t } = useTranslation()
  const words = markStress(text, stressWords)
  const Arrow = ARROWS[intonation]

  return (
    <p className={`${styles.sentence} ${styles[size]}`}>
      <span lang="en">
        {words.map((word, index) => (
          <Fragment key={index}>
            {index > 0 && ' '}
            {word.stressed ? (
              <strong className={styles.stress} title={t('sentence.stressHint')}>
                {word.text}
              </strong>
            ) : (
              word.text
            )}
          </Fragment>
        ))}
      </span>
      {Arrow && (
        <span
          className={styles.arrowWrap}
          role="img"
          aria-label={t(`sentence.intonation.${intonation}`)}
          title={t(`sentence.intonation.${intonation}`)}
        >
          <Arrow className={styles.arrow} aria-hidden="true" />
        </span>
      )}
    </p>
  )
}
