// =========================================================
// WordOrderStep — แบบฝึกเขียนแบบที่ 3 "เรียงคำเป็นประโยค" (Stage 7)
//   ภาพ (+ ความหมายไทยกดดูได้) → แตะ/ลากป้ายคำเรียงเป็นประโยค → เรียงครบแล้วกด "ตรวจ"
//   ยังไม่ถูก → ป้ายที่อยู่ถูกที่เป็นสีเขียว ที่เหลือสีส้ม + โชว์ประโยคที่ถูก (ทวนกลับ) แล้วเรียงใหม่ได้ไม่จำกัด
//   เสียงอ่านประโยคเปิดหลังตรวจครั้งแรก (เรียงจากความหมาย ไม่ใช่ฟังแล้วเรียงตาม)
// props: item ({ id, target, image, translationTh, acceptAlso }), stage, onDone({ passed })
// =========================================================
import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import { useSentenceDisplay } from '../../hooks/useSentenceDisplay'
import { MAX_ATTEMPTS_BEFORE_SKIP } from '../../utils/lessonSteps'
import { checkOrder, makeTiles, shuffleTiles } from '../../utils/wordOrder'
import { createRandom, hashString } from '../../utils/random'
import { scrollIntoViewGently } from '../../utils/scroll'
import Picture from '../Picture'
import Button from '../Button'
import WordTiles from './WordTiles'
import SpellingResult from './SpellingResult'
import { WriteActions } from './WriteParts'
import stepStyles from './Step.module.css'
import styles from './WriteStep.module.css'

export default function WordOrderStep({ item, stage, onDone }) {
  const { t } = useTranslation()
  const display = useSentenceDisplay(stage)
  // สลับแบบกำหนด seed จาก id ของข้อ → ลำดับเดิมทุกครั้งที่เปิดข้อนี้ (ไม่สลับใหม่ตอน render)
  const tiles = useMemo(() => shuffleTiles(makeTiles(item.target), createRandom(hashString(item.id))), [item.id, item.target])
  const [answer, setAnswer] = useState([])
  const [result, setResult] = useState(null)
  const [marks, setMarks] = useState(null)
  const [attempts, setAttempts] = useState(0)
  const actionsRef = useRef(null)
  const passed = Boolean(result?.passed)
  const textOf = (id) => tiles.find((tile) => tile.id === id)?.text ?? ''

  function change(next) {
    setAnswer(next)
    setMarks(null) // ขยับคำแล้ว → สีบอกตำแหน่งเดิมไม่ตรงแล้ว
  }

  function check() {
    if (answer.length < tiles.length || passed) return
    const checked = checkOrder(answer.map(textOf), item.target, item.acceptAlso)
    setResult({
      passed: checked.passed,
      close: false,
      written: answer.map((id, index) => ({ text: textOf(id), status: checked.positions[index] ? 'correct' : 'missed' })),
      answer: checked.answer,
    })
    setMarks(Object.fromEntries(answer.map((id, index) => [id, checked.positions[index] ? 'correct' : 'retry'])))
    setAttempts((count) => count + 1)
    setTimeout(() => scrollIntoViewGently(actionsRef.current), 60)
  }

  return (
    <div className={stepStyles.step}>
      <p className={stepStyles.instruction}>{t('write.orderInstruction')}</p>
      <Picture image={item.image} size="fill" alt="" className={stepStyles.pictureSmall} />
      {display.meaningVisible && (
        <p className={styles.meaning} lang="th">
          {item.translationTh}
        </p>
      )}
      {display.canRevealMeaning && (
        <Button size="sm" variant="secondary" icon={Languages} onClick={display.revealMeaning}>
          {t('card.showMeaning')}
        </Button>
      )}

      <WordTiles tiles={tiles} answer={answer} onChange={change} marks={marks} disabled={passed} />

      {/* ป้ายระบายสีบอกตำแหน่งแล้ว → ไม่ต้องแสดง "คุณเขียน" ซ้ำ */}
      <SpellingResult
        result={result}
        answer={result?.answer ?? item.target}
        attempt={Math.max(0, attempts - 1)}
        speakId={item.id}
        showWritten={false}
      />

      <WriteActions
        ref={actionsRef}
        passed={passed}
        canSkip={attempts >= MAX_ATTEMPTS_BEFORE_SKIP}
        canCheck={answer.length === tiles.length}
        onCheck={check}
        onNext={() => onDone({ passed: true })}
        onSkip={() => onDone({ passed: false })}
        hintKey={marks ? 'write.orderRetry' : 'write.orderHint'}
      />
    </div>
  )
}
