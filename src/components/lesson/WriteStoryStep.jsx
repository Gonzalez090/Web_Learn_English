// =========================================================
// WriteStoryStep — แบบฝึกเขียนแบบที่ 5 "เขียนเรื่องสั้น 3–5 ประโยคจากภาพ" (Stage 7)
//   แถบภาพ 1-2-3(-4) แตะเพื่อดูภาพใหญ่ → เขียนเรื่องเอง (ตัวนับประโยคบอกว่าเขียนไปกี่ประโยคแล้ว)
//   ตรวจ (utils/spelling.js checkFreeWriting): ประโยค ≥ minSentences (ประโยคละ ≥ 3 คำ) + คำสำคัญ ≥ 60% + ตัวสะกด
//   ตรวจแล้วโชว์เรื่องตัวอย่างของเจ้าของภาษาทีละภาพ + ปุ่มฟัง ให้เทียบ
// props: item ({ id, lines: [{ text, translationTh, image }], requiredWords, minSentences, maxSentences }),
//        stage, mode, onDone({ passed })
// =========================================================
import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSentenceDisplay } from '../../hooks/useSentenceDisplay'
import { MAX_ATTEMPTS_BEFORE_SKIP } from '../../utils/lessonSteps'
import { checkFreeWriting, countSentences, writtenWords } from '../../utils/spelling'
import { scrollIntoViewGently } from '../../utils/scroll'
import Picture from '../Picture'
import WritingInput from './WritingInput'
import WritingCheck from './WritingCheck'
import StoryStrip from './StoryStrip'
import { KeywordHint, ModeNote, WriteActions } from './WriteParts'
import stepStyles from './Step.module.css'
import styles from './WriteStep.module.css'

// เรื่องสั้น 3–5 ประโยค (สเปกส่วนที่ 3) — ข้อไหนอยากต่างจากนี้ใส่ minSentences / maxSentences ในข้อมูล
const STORY_SENTENCES = { min: 3, max: 5 }

export default function WriteStoryStep({ item, stage, mode, onDone }) {
  const { t } = useTranslation()
  const display = useSentenceDisplay(stage)
  const [text, setText] = useState('')
  const [check, setCheck] = useState(null)
  const [attempts, setAttempts] = useState(0)
  const [selected, setSelected] = useState(0)
  const actionsRef = useRef(null)
  const panels = useMemo(() => item.lines.map((line, index) => ({ id: `${item.id}-${index + 1}`, image: line.image })), [item])
  const models = item.lines
  const min = item.minSentences ?? STORY_SENTENCES.min
  const max = item.maxSentences ?? STORY_SENTENCES.max
  const sentences = countSentences(text)
  const passed = Boolean(check?.passed)

  function runCheck() {
    if (!writtenWords(text).length || passed) return
    setCheck(
      checkFreeWriting(text, {
        requiredWords: item.requiredWords,
        models: models.map((model) => model.text),
        mode,
        minSentences: min,
      }),
    )
    setAttempts((count) => count + 1)
    setTimeout(() => scrollIntoViewGently(actionsRef.current), 60)
  }

  return (
    <div className={stepStyles.step}>
      <p className={stepStyles.instruction}>{t('write.storyInstruction', { min, max })}</p>
      <ModeNote mode={mode} />
      <StoryStrip items={panels} current={selected} onSelect={setSelected} />
      <Picture
        image={panels[selected].image}
        size="fill"
        alt={t('story.panel', { n: selected + 1, total: panels.length })}
        className={stepStyles.pictureSmall}
      />
      <KeywordHint requiredWords={item.requiredWords} />

      <WritingInput
        multiline
        rows={5}
        value={text}
        onChange={setText}
        label={t('write.inputLabel')}
        placeholder={t('write.placeholderStory')}
        disabled={passed}
      />
      <p className={sentences >= min ? styles.counterDone : stepStyles.hint} aria-live="polite">
        {t('write.sentenceCount', { count: sentences, min })}
      </p>

      <WritingCheck
        check={check}
        models={models}
        story
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
