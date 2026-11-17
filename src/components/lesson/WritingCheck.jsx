// =========================================================
// WritingCheck — ผลตรวจงานเขียนอิสระ (บรรยายภาพ / เรื่องสั้น — Stage 7)
//   ไม่มี AI ตรวจไวยากรณ์ (สเปกส่วนที่ 3) → บอกสิ่งที่ตรวจได้จริง แล้วให้เทียบกับตัวอย่างเอง:
//   - คำสำคัญ: ป้ายคำที่ใช้แล้ว (เขียว ✓) / ยังไม่ได้ใช้ (เส้นประ)
//   - จำนวนประโยค (เรื่องสั้น)
//   - ตัวสะกด: "ใกล้แล้ว ลองสะกดแบบนี้: kiet → kite" (เทียบกับคำในตัวอย่าง)
//   - ประโยค/เรื่องตัวอย่างของเจ้าของภาษา + ปุ่มฟัง (+ ความหมายไทยตามการตั้งค่า)
//   ไม่ใช้คำว่า "ผิด" — ยังไม่ผ่านก็บอกแค่ว่าเติมอะไรอีกนิด
// props: check (ผลจาก checkFreeWriting), models ([{ text, translationTh }]), story (true = เรื่องสั้น),
//        mode, attempt, speakId, showMeaning
// =========================================================
import { useTranslation } from 'react-i18next'
import { Check, CircleCheck, MessageCircleHeart, RotateCcw } from 'lucide-react'
import LineButton from './LineButton'
import resultStyles from './SpellingResult.module.css'
import styles from './WriteStep.module.css'

const pick = (messages, attempt) => (Array.isArray(messages) ? messages[attempt % messages.length] : messages)

export default function WritingCheck({ check, models, story = false, mode, attempt = 0, speakId, showMeaning }) {
  const { t } = useTranslation()
  if (!check) return null

  const Icon = check.passed ? CircleCheck : RotateCcw
  const message = pick(t(check.passed ? 'write.freePraise' : 'write.encourage', { returnObjects: true }), attempt)
  const needMoreSentences = check.sentences < check.minSentences
  const needKeywords = check.keywords.found < check.keywords.needed
  const needSpelling = mode === 'exact' && check.hints.length > 0

  return (
    <div className={`${resultStyles.box} ${check.passed ? resultStyles.passed : resultStyles.retry}`} role="status">
      <p className={resultStyles.headline}>
        <Icon className={resultStyles.icon} aria-hidden="true" />
        <span>{message}</span>
      </p>

      {!check.passed && (
        <ul className={styles.reasons}>
          {needMoreSentences && (
            <li>{t('write.needSentences', { min: check.minSentences, count: check.sentences })}</li>
          )}
          {needKeywords && <li>{t('write.needKeywords')}</li>}
          {needSpelling && <li>{t('write.needSpelling')}</li>}
        </ul>
      )}

      {check.keywords.words.length > 0 && (
        <div className={styles.keywordRow}>
          <span className={resultStyles.label}>{t('story.keywords')}</span>
          <ul className={styles.keywords}>
            {check.keywords.words.map((word) => (
              <li key={word.text} className={word.found ? styles.keywordFound : styles.keyword} lang="en">
                {word.found && <Check className={styles.keywordIcon} aria-label={t('write.used')} />}
                {word.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      {check.hints.length > 0 && (
        <div className={styles.hintBox}>
          <span className={resultStyles.label}>{t('write.spellingHints')}</span>
          <ul className={styles.spellingHints}>
            {check.hints.map((hint) => (
              <li key={hint.typed} lang="en">
                <span className={resultStyles.close}>{hint.typed}</span>
                <span aria-hidden="true"> → </span>
                <strong className={styles.suggestion}>{hint.suggestion}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.models}>
        <p className={styles.modelsTitle}>
          <MessageCircleHeart className={resultStyles.answerIcon} aria-hidden="true" />
          {t(story ? 'write.exampleStory' : 'write.examples')}
        </p>
        <ol className={styles.modelList}>
          {models.map((model, index) => (
            <li key={model.text} className={styles.modelLine}>
              <span className={styles.modelText}>
                <span lang="en">{model.text}</span>
                {showMeaning && model.translationTh && (
                  <span className={styles.modelMeaning} lang="th">
                    {model.translationTh}
                  </span>
                )}
              </span>
              <LineButton text={model.text} speakKey={`${speakId}:model-${index}`} label={t('write.hearAnswer')} />
            </li>
          ))}
        </ol>
        <p className={styles.compareNote}>{t('write.compareNote')}</p>
      </div>
    </div>
  )
}
