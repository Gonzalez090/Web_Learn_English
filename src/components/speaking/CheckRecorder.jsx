// =========================================================
// CheckRecorder — หน้าจออัด Speaking Check: ภาพชุดเดิม 4 ภาพ → ปุ่มอัด/เวลา → คำถามช่วยคิด (มือถือเห็นภาพกับเวลาพร้อมกัน)
//   ระหว่างอัด: แถบติดเหนือเมนูล่าง (เวลาที่เหลือ + ปุ่ม "พูดจบแล้ว" + แถบเวลา + ระดับเสียง) + ข้อความที่ระบบได้ยิน (สูงสุด 3 บรรทัด)
//   ครบ 1 นาที → จบเอง → onDone(ผลการอัดจาก useRecorder)
// props: pictures, prompts (game.json speakingCheck), onDone
// =========================================================
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useRecorder } from '../../hooks/useRecorder'
import { isRecognitionSupported, micErrorMessageKey } from '../../utils/recognition'
import { RECORD_MS } from '../../utils/speakingCheck'
import { ICONS } from '../../utils/icons'
import Picture from '../Picture'
import Button from '../Button'
import styles from './Speaking.module.css'

// มิลลิวินาที → "0:42"
const clock = (ms) => {
  const seconds = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

const MIN_FINISH_MS = 5000 // กด "พูดจบแล้ว" ได้หลังอัดไป 5 วินาที (กันกดพลาดทันที)

export default function CheckRecorder({ pictures, prompts, onDone }) {
  const { t } = useTranslation()
  const { supported, status, elapsedMs, level, liveText, error, start, finish } = useRecorder({ onDone })
  const recording = status === 'recording'
  const busy = status === 'starting' || status === 'processing'
  const MicIcon = ICONS.speakingCheck
  const StopIcon = ICONS.stop
  const liveTextRef = useRef(null)

  // กล่องข้อความที่ได้ยินสูงไม่เกิน 3 บรรทัด → เลื่อนไปท้ายสุดเสมอ (เห็นคำล่าสุด)
  useEffect(() => {
    const box = liveTextRef.current
    if (box) box.scrollTop = box.scrollHeight
  }, [liveText])

  return (
    <div className={styles.recorder}>
      <ol className={styles.pictures} aria-label={t('speakingCheck.picturesLabel')}>
        {pictures.map((picture, index) => (
          <li key={picture.id} className={styles.pictureItem}>
            <Picture image={picture.image} alt={t('speakingCheck.pictureAlt', { number: index + 1 })} size="fill" />
            <span className={styles.pictureNumber} aria-hidden="true">
              {index + 1}
            </span>
          </li>
        ))}
      </ol>

      {!supported ? (
        <p className={styles.notice}>{t('speakingCheck.notSupported')}</p>
      ) : recording || status === 'processing' ? (
        <>
          {/* แถบเวลา + ปุ่มจบ ติดเหนือเมนูล่างเสมอ (จอเตี้ย/ข้อความที่ได้ยินยาวก็ยังกดได้)
              sticky ใช้ได้เฉพาะในกล่องแม่ → ต้องเป็นลูกตรงของ .recorder (ไม่ห่อด้วย div อื่น) */}
          <div className={`${styles.dock} ${styles.dockLive}`} aria-live="polite">
            <div className={styles.dockRow}>
              <span className={styles.recDot} aria-hidden="true" />
              <span className={styles.timer}>{t('speakingCheck.timeLeft', { time: clock(RECORD_MS - elapsedMs) })}</span>
              {status === 'processing' ? (
                <span className={styles.hint}>{t('speakingCheck.processing')}</span>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  icon={StopIcon}
                  className={styles.dockButton}
                  disabled={elapsedMs < MIN_FINISH_MS}
                  onClick={finish}
                >
                  {t('speakingCheck.finish')}
                </Button>
              )}
            </div>
            <div
              className={styles.bar}
              role="progressbar"
              aria-label={t('speakingCheck.timeLabel')}
              aria-valuemin={0}
              aria-valuemax={RECORD_MS / 1000}
              aria-valuenow={Math.round(elapsedMs / 1000)}
            >
              <span className={styles.barFill} style={{ width: `${Math.min(100, (elapsedMs / RECORD_MS) * 100)}%` }} />
            </div>
            <div className={styles.level} aria-hidden="true">
              <span className={styles.levelFill} style={{ width: `${Math.min(100, level * 400)}%` }} />
            </div>
          </div>
          {liveText && (
            <p ref={liveTextRef} className={styles.liveText}>
              <span className={styles.liveLabel}>{t('mic.heard')}</span> <span lang="en">{liveText}</span>
            </p>
          )}
        </>
      ) : (
        <>
          <p className={styles.hint}>{t('speakingCheck.startHint')}</p>
          {!isRecognitionSupported && <p className={styles.notice}>{t('speakingCheck.noTranscribe')}</p>}
          {error && (
            <p className={styles.notice} role="alert">
              {t(error === 'record-failed' ? 'speakingCheck.recordFailed' : micErrorMessageKey(error))}
            </p>
          )}
          <div className={styles.dock}>
            <Button size="lg" icon={MicIcon} block disabled={busy} onClick={start}>
              {status === 'starting' ? t('speakingCheck.starting') : t('speakingCheck.start')}
            </Button>
          </div>
        </>
      )}
      <div className={styles.prompts}>
        <p className={styles.promptsTitle}>{t('speakingCheck.promptsTitle')}</p>
        <ul className={styles.promptList}>
          {prompts.map((prompt) => (
            <li key={prompt.text}>
              <span lang="en">{prompt.text}</span> <span className={styles.promptTh}>{prompt.textTh}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
