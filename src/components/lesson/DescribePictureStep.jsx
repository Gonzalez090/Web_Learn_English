// =========================================================
// DescribePictureStep — แบบฝึกเขียนแบบที่ 4 "เขียนประโยคบรรยายภาพ" (Stage 7)
//   ดูภาพ → เขียนเอง 1 ประโยค (เขียนแบบไหนก็ได้) → ตรวจ: มีคำสำคัญครบ + ตัวสะกด (utils/spelling.js checkFreeWriting)
//   ตรวจแล้วโชว์ประโยคตัวอย่างของเจ้าของภาษา 1–2 แบบให้เทียบ / "ดูคำใบ้" → เห็นคำสำคัญก่อนเขียนได้
// props: item ({ id, target (ประโยคตัวอย่างหลัก), translationTh, examples: [{ text, translationTh }], requiredWords, image }),
//        stage, mode, onDone({ passed })
// =========================================================
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSentenceDisplay } from '../../hooks/useSentenceDisplay'
import { MAX_ATTEMPTS_BEFORE_SKIP } from '../../utils/lessonSteps'
import { checkFreeWriting, writtenWords } from '../../utils/spelling'
import { scrollIntoViewGently } from '../../utils/scroll'
import Picture from '../Picture'
import WritingInput from './WritingInput'
import WritingCheck from './WritingCheck'
import { KeywordHint, ModeNote, WriteActions } from './WriteParts'
import stepStyles from './Step.module.css'

// ประโยคตัวอย่างทั้งหมดของข้อ (ประโยคหลัก + แบบอื่น)
const describeModels = (item) => [{ text: item.target, translationTh: item.translationTh }, ...(item.examples ?? [])]

export default function DescribePictureStep({ item, stage, mode, onDone }) {
  const { t } = useTranslation()
  const display = useSentenceDisplay(stage)
  const [text, setText] = useState('')
  const [check, setCheck] = useState(null)
  const [attempts, setAttempts] = useState(0)
  const actionsRef = useRef(null)
  const models = describeModels(item)
  const passed = Boolean(check?.passed)

  function runCheck() {
    if (!writtenWords(text).length || passed) return
    setCheck(
      checkFreeWriting(text, {
        requiredWords: item.requiredWords,
        models: models.map((model) => model.text),
        mode,
        minSentences: 1,
        requireAll: true,
      }),
    )
    setAttempts((count) => count + 1)
    setTimeout(() => scrollIntoViewGently(actionsRef.current), 60)
  }

  return (
    <div className={stepStyles.step}>
      <p className={stepStyles.instruction}>{t('write.describeInstruction')}</p>
      <ModeNote mode={mode} />
      <Picture image={item.image} size="fill" alt="" className={stepStyles.picture} />
      <KeywordHint requiredWords={item.requiredWords} />

      <WritingInput
        multiline
        rows={2}
        value={text}
        onChange={setText}
        label={t('write.inputLabel')}
        placeholder={t('write.placeholderEnglish')}
        disabled={passed}
      />

      <WritingCheck
        check={check}
        models={models}
        mode={mode}
        attempt={Math.max(0, attempts - 1)}
        speakId={item.id}
        showMeaning={display.meaningVisible}
      />

      <WriteActions
        ref={actionsRef}
        passed={passed}
        canSkip={attempts >= MAX_ATTEMPTS_BEFORE_SKIP}
        canCheck={writtenWords(text).length > 0}
        onCheck={runCheck}
        onNext={() => onDone({ passed: true })}
        onSkip={() => onDone({ passed: false })}
        hintKey="write.freeHint"
      />
    </div>
  )
}
