// =========================================================
// ThaiReading — คำอ่านภาษาไทย + เน้นพยางค์ที่ลงเสียงหนัก
//   reading        = 'แอ๊ป-เพิ่ล' (คั่นพยางค์ด้วย -)
//   stressSyllable = 1 → พยางค์แรกลงเสียงหนัก (คำพยางค์เดียวไม่ต้องเน้น)
// =========================================================
import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './ThaiReading.module.css'

export default function ThaiReading({ reading, stressSyllable }) {
  const { t } = useTranslation()
  if (!reading) return null

  const syllables = reading.split('-')
  const highlight = Number.isInteger(stressSyllable) && syllables.length > 1

  return (
    <p className={styles.reading} lang="th">
      {syllables.map((syllable, index) => (
        <Fragment key={index}>
          {index > 0 && <span className={styles.dash}>-</span>}
          {highlight && index + 1 === stressSyllable ? (
            <strong className={styles.stress} title={t('card.stressHint')}>
              {syllable}
            </strong>
          ) : (
            <span>{syllable}</span>
          )}
        </Fragment>
      ))}
    </p>
  )
}
