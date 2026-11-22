// =========================================================
// ConversationSummary — จบบทสนทนาสุ่ม (ส่วนที่ 6)
//   ผล (พูดผ่านกี่บรรทัด + XP) → ปุ่ม: สุ่มอีกรอบ (สถานการณ์เดิม) / สุ่มสถานการณ์ใหม่ / เพิ่มบรรทัดของเราเข้ารายการทบทวน
//   → บทสนทนาทั้งบท (ฟังซ้ำได้ทุกบรรทัด) → วลีใหม่ (ตัวเลือกทุกแบบของเรา + ป้าย register)
// props: scenario, conversation, outcomes, said, xp, reviewAdded, onAddReview, onAgain, onNew
// =========================================================
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CircleCheck, Dices, RotateCcw } from 'lucide-react'
import { getStage } from '../../data'
import { useLocalized } from '../../hooks/useLocalized'
import { useSentenceDisplay } from '../../hooks/useSentenceDisplay'
import Button from '../Button'
import Section from '../Section'
import DialogueBubble from '../lesson/DialogueBubble'
import LineButton from '../lesson/LineButton'
import stepStyles from '../lesson/Step.module.css'
import playerStyles from './ConversationPlayer.module.css'
import styles from '../../pages/Talk.module.css'

export default function ConversationSummary({
  scenario,
  conversation,
  outcomes,
  said,
  xp,
  reviewAdded,
  onAddReview,
  onAgain,
  onNew,
  npcRate = 'normal',
  npcVoice = null,
}) {
  const { t } = useTranslation()
  const loc = useLocalized()
  const display = useSentenceDisplay(useMemo(() => getStage(5), []))
  const userLines = conversation.lines.filter((line) => line.speaker === 'user')
  const passedCount = userLines.filter((line) => outcomes[line.id] === 'passed').length
  const timeupCount = userLines.filter((line) => outcomes[line.id] === 'timeup').length // Speed Order
  const partner = loc(scenario.partner, 'name')

  return (
    <>
      <div className={styles.result} role="status">
        <p className={styles.resultTitle}>{t('talk.doneTitle')}</p>
        <p>{t('talk.doneCount', { n: passedCount, total: userLines.length })}</p>
        {timeupCount > 0 && <p>{t('talk.timeupCount', { n: timeupCount })}</p>}
        {(conversation.twists ?? []).map((twist) => (
          <p key={twist.id} className={styles.twistNote}>
            {t('talk.twist', { title: loc(twist, 'title') })}
          </p>
        ))}
        {xp > 0 && <p className={styles.resultXp}>{t('phrases.gameXp', { xp })}</p>}
      </div>

      <div className={styles.resultActions}>
        <Button block size="lg" icon={RotateCcw} onClick={onAgain}>
          {t('talk.again')}
        </Button>
        <Button block variant="secondary" icon={Dices} onClick={onNew}>
          {t('talk.newScenario')}
        </Button>
        <Button block variant="ghost" icon={reviewAdded ? CircleCheck : undefined} disabled={reviewAdded} onClick={onAddReview}>
          {reviewAdded ? t('talk.reviewAdded') : t('talk.addReview')}
        </Button>
      </div>

      <Section title={t('talk.transcript')}>
        <div className={stepStyles.chat}>
          {conversation.lines.map((line) => {
            const mine = line.speaker === 'user'
            return (
              <DialogueBubble
                key={line.id}
                line={mine ? { id: line.id, target: said[line.id] ?? line.options[0].text } : line}
                speakerName={mine ? t('talk.you') : partner}
                side={mine ? 'right' : 'left'}
                status={outcomes[line.id]}
                display={mine ? undefined : display}
                speakKey={`talk-summary:${line.id}`}
                rate={mine ? 'normal' : npcRate}
                fileVoice={mine ? null : npcVoice}
              />
            )
          })}
        </div>
      </Section>

      <Section title={t('talk.newPhrases')}>
        <ul className={styles.phraseGroups}>
          {userLines.map((line) => (
            <li key={line.id} className={styles.phraseGroup}>
              <p className={styles.phraseHint} lang="th">
                {line.hintTh}
              </p>
              <ul className={playerStyles.options}>
                {line.options.map((option, index) => (
                  <li key={option.text} className={playerStyles.option}>
                    <span className={playerStyles.optionText} lang="en">
                      {option.text}
                    </span>
                    <span className={playerStyles.register}>{t(`register.${option.register}`)}</span>
                    <LineButton text={option.text} speakKey={`talk-summary:${line.id}:${index}`} label={t('talk.hearOption')} />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Section>
    </>
  )
}
