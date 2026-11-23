// =========================================================
// LineButton — ปุ่มลำโพงเล็ก ๆ ฟังบรรทัดเดียว (กดซ้ำตอนเล่นอยู่ = หยุด)
// ใช้ในกล่องถาม-ตอบ (Exchange) และกล่องบทสนทนา/คำคล้องจอง
// props:
//   text     ข้อความที่จะพูด
//   speakKey รหัสเสียง (ไม่ซ้ำกันในหน้า) — ปุ่มขึ้นสถานะ "กำลังเล่น" เมื่อเสียงรหัสนี้เล่นอยู่
//            (ตัวเล่นต่อเนื่องหลายบรรทัดใช้รหัสเดียวกัน → ปุ่มของบรรทัดที่กำลังเล่นขึ้นสถานะตามไปด้วย)
//   label    ชื่อปุ่มสำหรับโปรแกรมอ่านหน้าจอ
//   rate     'slow' = ช้าเสมอ เช่น NPC ที่พูดช้า (ป้าโรส) / 'normal' หรือไม่ใส่ = ความเร็วเริ่มต้นจากหน้าตั้งค่า
//   fileVoice เสียง Kokoro ของ NPC (world.json npc.voice) — ไม่ใส่ = เสียงหลัก
// =========================================================
import { useTranslation } from 'react-i18next'
import { Square, Volume2 } from 'lucide-react'
import { useSpeech } from '../../hooks/useSpeech'
import { abortListening } from '../../utils/recognition'
import styles from './LineButton.module.css'

export default function LineButton({ text, speakKey, label, rate = 'normal', fileVoice = null }) {
  const { t } = useTranslation()
  const { speak, stop, speakingKey } = useSpeech()
  const playing = speakingKey === speakKey
  const Icon = playing ? Square : Volume2
  return (
    <button
      type="button"
      className={playing ? `${styles.button} ${styles.playing}` : styles.button}
      aria-label={playing ? t('speech.stop') : label}
      aria-pressed={playing}
      onClick={() => {
        if (playing) return stop()
        abortListening() // กำลังฟังไมค์อยู่ → หยุดก่อน ไม่ให้ไมค์ได้ยินเสียงตัวอย่าง
        // ช้าเฉพาะที่ระบุ (NPC พูดช้า) — นอกนั้นใช้ความเร็วเริ่มต้นจากหน้าตั้งค่า
        return speak(text, { key: speakKey, rate: rate === 'slow' ? 'slow' : undefined, fileVoice })
      }}
    >
      <Icon className={styles.icon} aria-hidden="true" />
    </button>
  )
}
