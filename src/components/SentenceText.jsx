// =========================================================
// SentenceText — ประโยคภาษาอังกฤษ (ส่วนที่ 2.3 การพูดแบบเจ้าของภาษา)
//   - คำที่ลงเสียงหนัก (stressWords) เป็นตัวหนา + ขีดเส้นใต้
//   - ลูกศรท้ายประโยคบอกทำนองเสียง ↗ (ขึ้น) / ↘ (ลง)
// props: text, stressWords[], intonation ('up' | 'down'), size ('md' | 'lg')
//        lastWordClassName = ระบายคำสุดท้าย (ไม่รวมเครื่องหมาย) เช่น คำท้ายที่คล้องจองในคำคล้องจอง
//        align = 'center' (ค่าเริ่มต้น) | 'start' (ชิดซ้าย — กล่องแชตบทสนทนา, บรรทัดคำคล้องจอง)
// =========================================================
import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { markStress } from '../utils/display'
import styles from './SentenceText.module.css'

const ARROWS = { up: ArrowUpRight, down: ArrowDownRight }

// "bed." → ระบายแค่ "bed" แล้วต่อด้วย "." ธรรมดา
function markLast(text, className) {
  const [, word, tail] = String(text).match(/^(.*?)([^A-Za-z0-9']*)$/s)
  return (
    <>
      <span className={className}>{word}</span>
      {tail}
    </>
  )
}

export default function SentenceText({ text, stressWords, intonation, size = 'md', lastWordClassName, align = 'center' }) {
  const { t, i18n } = useTranslation()
  const words = markStress(text, stressWords)
  const Arrow = ARROWS[intonation]
  const classes = [styles.sentence, styles[size], align === 'start' && styles.start].filter(Boolean).join(' ')

  const arrow = Arrow && (
    <span
      className={styles.arrowWrap}
      role="img"
      lang={i18n.language}
      aria-label={t(`sentence.intonation.${intonation}`)}
      title={t(`sentence.intonation.${intonation}`)}
    >
      <Arrow className={styles.arrow} aria-hidden="true" />
    </span>
  )

  return (
    <p className={classes}>
      <span lang="en">
        {words.map((word, index) => {
          const last = index === words.length - 1
          const content = lastWordClassName && last ? markLast(word.text, lastWordClassName) : word.text
          const shown = word.stressed ? (
            <strong className={styles.stress} title={t('sentence.stressHint')}>
              {content}
            </strong>
          ) : (
            content
          )
          return (
            <Fragment key={index}>
              {index > 0 && ' '}
              {/* คำสุดท้าย + ลูกศรอยู่ด้วยกันเสมอ (ไม่ให้ลูกศรตกไปขึ้นบรรทัดใหม่เดี่ยว ๆ) */}
              {last && arrow ? (
                <span className={styles.tail}>
                  {shown}
                  {arrow}
                </span>
              ) : (
                shown
              )}
            </Fragment>
          )
        })}
      </span>
    </p>
  )
}
