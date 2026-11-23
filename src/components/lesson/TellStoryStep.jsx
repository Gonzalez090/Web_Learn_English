// =========================================================
// TellStoryStep — ขั้น "เล่าเรื่องเองจากภาพ" ทีละภาพ (Stage 5 picture story, ส่วนที่ 4 ขั้น 6: ใช้เอง)
//   ดูภาพ (+ แถบภาพ 1-2-3 ให้รู้ว่าอยู่ตอนไหนของเรื่อง) แล้วเล่าด้วยคำพูดของตัวเอง — ไม่มีข้อความให้ดู
//   ตรวจคำสำคัญของภาพนั้น (utils/storyCheck.js): พูดได้ ≥ 60% = ผ่าน
//   ยังไม่ผ่าน → ทวนกลับด้วยประโยคที่เจ้าของภาษาเล่า (recast) แล้วลองใหม่ได้ไม่จำกัด
//   "ดูคำใบ้" → เห็นคำสำคัญ (ไม่บังคับ) / ลองครบ 3 ครั้ง (หรือไมค์ใช้ไม่ได้) → "ไปต่อ" (ภาพนั้นเข้ารายการทบทวน)
// props: item (ภาพนี้: target, requiredWords, image), story (ทุกภาพของเรื่อง), onDone({ passed })
// =========================================================
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Lightbulb } from 'lucide-react'
import { compareKeywords, keywordLabel } from '../../utils/storyCheck'
import { MAX_ATTEMPTS_BEFORE_SKIP } from '../../utils/lessonSteps'
import { isBlockingMicError, isRecognitionSupported } from '../../utils/recognition'
import { useStepReveal } from '../../hooks/useStepReveal'
import Picture from '../Picture'
import MicButton from '../MicButton'
import Button from '../Button'
import StoryStrip from './StoryStrip'
import styles from './Step.module.css'
import tellStyles from './TellStoryStep.module.css'

export default function TellStoryStep({ item, story, onDone }) {
  const { t } = useTranslation()
  const [passed, setPassed] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [blocked, setBlocked] = useState(!isRecognitionSupported)
  const [hintOpen, setHintOpen] = useState(false)
  const index = Math.max(0, story.findIndex((panel) => panel.id === item.id))
  const canSkip = attempts >= MAX_ATTEMPTS_BEFORE_SKIP || blocked
  // จอเตี้ย: เข้าขั้นแล้วเห็นปุ่มพูด / ได้ผลแล้วเห็นผล + ปุ่มไปต่อ
  const { micRef, actionsRef, showActions } = useStepReveal(item.id)

  function handleResult(result) {
    setAttempts((count) => count + 1)
    if (result.passed) setPassed(true)
    showActions()
  }

  function handleError(error) {
    if (isBlockingMicError(error)) setBlocked(true)
    else setAttempts((count) => count + 1)
    showActions()
  }

  return (
    <div className={styles.step}>
      <p className={styles.instruction}>{t('story.tell')}</p>
      <StoryStrip items={story} current={index} />
      <Picture
        image={item.image}
        size="fill"
        alt={t('story.panel', { n: index + 1, total: story.length })}
        className={`${styles.picture} ${tellStyles.picture}`}
      />

      {hintOpen ? (
        <div className={tellStyles.hint}>
          <span className={tellStyles.hintLabel}>{t('story.keywords')}</span>
          <ul className={tellStyles.keywords}>
            {(item.requiredWords ?? []).map((word) => (
              <li key={word} className={tellStyles.keyword} lang="en">
                {keywordLabel(word)}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <Button size="sm" variant="secondary" icon={Lightbulb} onClick={() => setHintOpen(true)}>
          {t('story.showHint')}
        </Button>
      )}

      <div ref={micRef} className={styles.micBox}>
        <MicButton
          target={item.target}
          evaluate={(alternatives, attempt) =>
            compareKeywords(item.requiredWords, alternatives, { model: item.target, attempt })
          }
          wordsLabel={t('story.keywords')}
          speakId={`${item.id}:tell`}
          label={t('mic.tell')}
          onResult={handleResult}
          onError={handleError}
        />
      </div>

      <div ref={actionsRef} className={styles.actions}>
        {passed && (
          <Button block size="lg" onClick={() => onDone({ passed: true })}>
            {t('lesson.next')}
          </Button>
        )}
        {!passed && canSkip && (
          <Button block variant="secondary" onClick={() => onDone({ passed: false })}>
            {t('lesson.skip')}
          </Button>
        )}
        {!passed && !canSkip && <p className={styles.hint}>{t('story.tellHint')}</p>}
      </div>
    </div>
  )
}
