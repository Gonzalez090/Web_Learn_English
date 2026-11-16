// =========================================================
// ReadingText — ประโยคที่ต้องอ่านออกเสียง (Stage 6): คำที่อ่านถึงแล้วเปลี่ยนสี ไล่จากซ้ายไปขวาระหว่างพูด
// props: text, read (จำนวนคำที่อ่านแล้ว — จาก utils/reading.js readProgress), focusWord (sight word ที่ระบายไว้)
// =========================================================
import { Fragment } from 'react'
import { readingUnits } from '../../utils/reading'
import styles from './ReadingText.module.css'

export default function ReadingText({ text, read = 0, focusWord }) {
  const focus = focusWord?.toLowerCase()
  return (
    <p className={styles.text} lang="en">
      {readingUnits(text).map((unit, index) => {
        const classes = [styles.word]
        if (unit.countable && unit.order < read) classes.push(styles.read)
        if (focus && unit.tokens.join(' ') === focus) classes.push(styles.focus)
        return (
          <Fragment key={index}>
            {index > 0 && ' '}
            <span className={classes.join(' ')}>{unit.display}</span>
          </Fragment>
        )
      })}
    </p>
  )
}
