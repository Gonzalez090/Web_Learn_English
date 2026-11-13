// =========================================================
// SpeakButton — ปุ่มฟังเสียง 2 ความเร็ว: [ฟัง] [ช้า]
// - กดซ้ำตอนกำลังเล่น = หยุด
// - กดปุ่มอื่น (หรือการ์ดอื่น) = หยุดเสียงเก่าแล้วเล่นเสียงใหม่ (เสียงไม่ซ้อนกัน)
// props:
//   text = ข้อความ หรือ array หลายบรรทัด
//   id   = รหัสไม่ซ้ำ (ใช้รู้ว่าปุ่มไหนกำลังเล่น เช่น id ของคำศัพท์)
//   showSlow = แสดงปุ่ม "ช้า" หรือไม่ (ค่าเริ่มต้น แสดง)
//   useFiles = ใช้ไฟล์เสียงคุณภาพสูง (Kokoro) ถ้ามี — ปุ่มลองเสียงในหน้าตั้งค่าส่ง false
//              เพื่อให้ได้ยินเสียงของเบราว์เซอร์ที่เลือกไว้จริง ๆ
// =========================================================
import { useTranslation } from 'react-i18next'
import { Snail, Square, Volume2 } from 'lucide-react'
import { useSpeech } from '../hooks/useSpeech'
import { abortListening } from '../utils/recognition'
import styles from './SpeakButton.module.css'

export default function SpeakButton({ text, id, showSlow = true, size = 'md', useFiles = true }) {
  const { t } = useTranslation()
  const { supported, speak, stop, speakingKey } = useSpeech()

  if (!supported) {
    return (
      <p className={styles.unsupported} role="note">
        {t('speech.notSupported')}
      </p>
    )
  }

  const buttons = [{ rate: 'normal', Icon: Volume2, label: t('speech.normal') }]
  if (showSlow) buttons.push({ rate: 'slow', Icon: Snail, label: t('speech.slow') })

  return (
    <div className={`${styles.group} ${styles[size]}`} role="group" aria-label={t('speech.listen')}>
      {buttons.map(({ rate, Icon, label }) => {
        const key = `${id}:${rate}`
        const playing = speakingKey === key
        const ShownIcon = playing ? Square : Icon
        return (
          <button
            key={rate}
            type="button"
            className={playing ? `${styles.button} ${styles.playing}` : styles.button}
            aria-pressed={playing}
            onClick={() => {
              if (playing) return stop()
              abortListening() // กำลังฟังไมค์อยู่ → หยุดก่อน ไม่ให้ไมค์ได้ยินเสียงตัวอย่าง
              return speak(text, { rate, key, useFiles })
            }}
          >
            <ShownIcon className={styles.icon} aria-hidden="true" />
            <span>{playing ? t('speech.stop') : label}</span>
          </button>
        )
      })}
    </div>
  )
}
