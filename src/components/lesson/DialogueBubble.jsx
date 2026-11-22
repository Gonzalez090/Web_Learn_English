// =========================================================
// DialogueBubble — 1 บรรทัดในบทสนทนา แบบกล่องแชต (Stage 5)
//   อีกฝ่ายอยู่ซ้าย / เรา (หรือผู้พูดคนที่ 2 ตอนยังไม่ได้เลือกบท) อยู่ขวา + ชื่อผู้พูดเหนือกล่อง
//   ในกล่อง: ประโยค (คำลงเสียงหนัก + ทำนองเสียง) + คำอ่านไทย / คำแปลไทย / เสียงพูดเชื่อม ตามที่เปิด
//            ยังไม่ได้ฟัง → คลื่นเสียง (ฟังก่อนค่อยเห็นข้อความ)
//            ตาเราแบบซ่อนบท → ความหมายไทยเป็นโจทย์ ให้พูดเป็นภาษาอังกฤษเอง
// props:
//   line         บรรทัด { id, target, translationTh, readingTh, stressWords, intonation, connectedSpeech }
//   speakerName  ชื่อผู้พูดที่แสดง
//   side         'left' | 'right'
//   active       บรรทัดที่กำลังพูด/ตาเรา (เน้นกรอบ)
//   status       'passed' (พูดผ่าน) | 'skipped' (ข้ามไปก่อน) | undefined
//   textHidden   ยังไม่ได้ฟัง → คลื่นเสียงแทนข้อความ
//   cue          ข้อความไทยให้พูดเอง (ซ่อนบทของเรา) — มีค่า = ไม่แสดงประโยค
//   display      ผลจาก useSentenceDisplay (คำอ่าน/คำแปล)
//   details      แสดงเสียงพูดเชื่อม (เปิดเฉพาะบรรทัดที่ต้องใช้ ไม่ให้แชตรก)
//   speakKey     รหัสเสียงของบรรทัดนี้ / canReplay = แสดงปุ่มลำโพง
//   rate / fileVoice  ความเร็ว + เสียง Kokoro ของผู้พูด (NPC ในบทสนทนาสุ่ม — ขั้นที่ 28-1) ไม่ใส่ = ปกติ + เสียงหลัก
//   ref          ใช้เลื่อนจอมาที่บรรทัดนี้ (React 19 ส่ง ref เป็น prop ได้)
// =========================================================
import { useTranslation } from 'react-i18next'
import { CircleCheck, Mic } from 'lucide-react'
import SentenceText from '../SentenceText'
import ThaiReading from '../ThaiReading'
import LineButton from './LineButton'
import HiddenText from './HiddenText'
import ConnectedSpeech from './ConnectedSpeech'
import styles from './DialogueBubble.module.css'

export default function DialogueBubble({
  line,
  speakerName,
  side = 'left',
  active = false,
  status,
  textHidden = false,
  cue = null,
  display,
  details = false,
  speakKey,
  canReplay = true,
  rate = 'normal',
  fileVoice = null,
  ref,
}) {
  const { t } = useTranslation()
  const classes = [styles.row, styles[side], active && styles.active, status && styles[status]].filter(Boolean)

  return (
    <div ref={ref} className={classes.join(' ')}>
      {canReplay && !cue && !textHidden && (
        <LineButton
          text={line.target}
          speakKey={speakKey}
          rate={rate}
          fileVoice={fileVoice}
          label={t('dialogue.playLine', { name: speakerName })}
        />
      )}
      <div className={styles.body}>
        <span className={styles.speaker}>
          {speakerName}
          {status === 'passed' && <CircleCheck className={styles.passedIcon} aria-label={t('dialogue.passed')} />}
        </span>
        <div className={styles.bubble}>
          {cue ? (
            <>
              <span className={styles.cueLabel}>
                <Mic className={styles.cueIcon} aria-hidden="true" />
                {t('lesson.sayInEnglish')}
              </span>
              <p className={styles.cueText} lang="th">
                {cue}
              </p>
            </>
          ) : textHidden ? (
            <HiddenText />
          ) : (
            <>
              <SentenceText
                text={line.target}
                stressWords={line.stressWords}
                intonation={line.intonation}
                align="start"
              />
              {display?.readingVisible && <ThaiReading reading={line.readingTh} />}
              {display?.meaningVisible && (
                <p className={styles.meaning} lang="th">
                  {line.translationTh}
                </p>
              )}
              {details && <ConnectedSpeech entries={line.connectedSpeech} compact />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
