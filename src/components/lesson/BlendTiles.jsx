// =========================================================
// BlendTiles — ป้ายตัวอักษรของคำ phonics (s | i | t) + ปุ่ม "ไล่เสียง" (ส่วนที่ 3 Stage 6: ผสมเสียงเป็นคำ)
//   กดไล่เสียง → ไฮไลต์ทีละตัวจากซ้ายไปขวา พร้อมเสียงไทยที่ใกล้เคียงใต้ตัวอักษร (ซ · อิ · ท)
//   แล้วป้ายเลื่อนชิดกันเป็นคำเดียว → ผู้เรียนออกเสียงตามเองทีละตัว แล้วอ่านทั้งคำ
//   (TTS ออกเสียงหน่วยเสียงเดี่ยว เช่น /s/ ไม่ได้ → ใช้เสียงไทยใกล้เคียงเป็นตัวช่วยแทน — ยังไม่พูดคำให้ฟัง อ่านเองก่อน)
// props: units [{ id, grapheme, hint, silent }] (จาก utils/reading.js graphemeUnits) — silent = ตัวที่ไม่ออกเสียง (e ท้ายคำ)
// =========================================================
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Play } from 'lucide-react'
import Button from '../Button'
import styles from './BlendTiles.module.css'

const STEP_MS = 750 // เวลาต่อ 1 ตัวอักษรตอนไล่เสียง

export default function BlendTiles({ units }) {
  const { t } = useTranslation()
  // -1 = ยังไม่ไล่ / 0..n-1 = กำลังไล่ตัวที่ / n = รวมเป็นคำแล้ว
  const [active, setActive] = useState(-1)
  const [hintsShown, setHintsShown] = useState(false)
  const blended = active >= units.length
  const running = active >= 0 && !blended

  useEffect(() => {
    if (!running) return undefined
    const timer = setTimeout(() => setActive((current) => current + 1), STEP_MS)
    return () => clearTimeout(timer)
  }, [running, active])

  function soundOut() {
    setHintsShown(true)
    setActive(0)
  }

  return (
    <div className={styles.blend}>
      <div className={blended ? `${styles.tiles} ${styles.blended}` : styles.tiles} lang="en">
        {units.map((unit, index) => {
          const classes = [styles.tile]
          if (index === active) classes.push(styles.active)
          if (blended || index < active) classes.push(styles.done)
          if (unit.silent) classes.push(styles.silent)
          return (
            <span key={`${unit.id}-${index}`} className={classes.join(' ')}>
              <span className={styles.letter}>{unit.grapheme}</span>
              {/* เสียงไทยใกล้เคียง — โผล่หลังกดไล่เสียง (ลองอ่านเองก่อนได้) */}
              <span className={styles.sound} lang="th" aria-hidden={!hintsShown}>
                {hintsShown ? unit.hint : ' '}
              </span>
            </span>
          )
        })}
      </div>
      <Button size="sm" variant="secondary" icon={Play} onClick={soundOut} disabled={running}>
        {t('read.soundOut')}
      </Button>
    </div>
  )
}
