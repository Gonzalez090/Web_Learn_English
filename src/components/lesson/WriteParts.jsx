// =========================================================
// WriteParts — ชิ้นส่วนที่แบบฝึกเขียนทุกแบบใช้ร่วมกัน (Stage 7)
//   ModeNote     ป้ายบอกระดับการตรวจของบท: สะกดตามเสียงก็ผ่าน (บทแรก ๆ) / ต้องสะกดให้ตรง (บทหลัง ๆ)
//   KeywordHint  ปุ่ม "ดูคำใบ้" → ป้ายคำสำคัญ (งานเขียนอิสระ: บรรยายภาพ / เรื่องสั้น)
//   WriteActions ปุ่มท้ายขั้น: ยังไม่ผ่าน → "ตรวจ" (+ "ไปต่อ" เมื่อลองครบ 3 ครั้ง) / ผ่านแล้ว → "ต่อไป"
// =========================================================
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Lightbulb, PencilLine } from 'lucide-react'
import { playSfx } from '../../utils/sfx'
import { keywordLabel } from '../../utils/storyCheck'
import Button from '../Button'
import stepStyles from './Step.module.css'
import styles from './WriteStep.module.css'

export function KeywordHint({ requiredWords }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  if (!open) {
    return (
      <Button size="sm" variant="secondary" icon={Lightbulb} onClick={() => setOpen(true)}>
        {t('story.showHint')}
      </Button>
    )
  }
  return (
    <div className={styles.keywordRow}>
      <span className={styles.keywordLabel}>{t('story.keywords')}</span>
      <ul className={styles.keywords}>
        {(requiredWords ?? []).map((word) => (
          <li key={word} className={styles.keyword} lang="en">
            {keywordLabel(word)}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ModeNote({ mode }) {
  const { t } = useTranslation()
  return (
    <p className={styles.modeNote}>
      <PencilLine className={styles.modeIcon} aria-hidden="true" />
      {t(mode === 'sound' ? 'write.modeSound' : 'write.modeExact')}
    </p>
  )
}

// ref → กล่องปุ่ม (ตรวจแล้วเลื่อนจอมาให้เห็นผล + ปุ่ม) — React 19 ส่ง ref เป็น prop ได้เลย
export function WriteActions({ ref, passed, canSkip, canCheck, onCheck, onNext, onSkip, hintKey = 'write.hint' }) {
  const { t } = useTranslation()
  // เขียนผ่าน → เสียง "ติ๊ง" ทันทีที่ตรวจ (XP/ภารกิจให้ตอนกดต่อไป) — แต่ละข้อเริ่มใหม่ด้วย key จึงดังครั้งเดียวต่อข้อ
  useEffect(() => {
    if (passed) playSfx('pass')
  }, [passed])
  return (
    <div ref={ref} className={stepStyles.actions}>
      {passed ? (
        <Button block size="lg" onClick={onNext}>
          {t('lesson.next')}
        </Button>
      ) : (
        <Button block size="lg" icon={Check} disabled={!canCheck} onClick={onCheck}>
          {t('write.check')}
        </Button>
      )}
      {!passed && canSkip && (
        <Button block variant="secondary" onClick={onSkip}>
          {t('lesson.skip')}
        </Button>
      )}
      {!passed && !canSkip && <p className={stepStyles.hint}>{t(hintKey)}</p>}
    </div>
  )
}
