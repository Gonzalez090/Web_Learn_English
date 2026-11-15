// =========================================================
// PlayAllButtons — ปุ่ม "ฟังทั้งบท" (ปกติ) + "ช้า" สำหรับเล่นหลายบรรทัดต่อกัน (ใช้คู่กับ useLinePlayer)
//   ปุ่มของความเร็วที่กำลังเล่นกลายเป็น "หยุด"
// props: label (ข้อความปุ่มความเร็วปกติ เช่น "ฟังทั้งบท"), playingRate ('normal' | 'slow' | null),
//        onPlay(rate), onStop
// =========================================================
import { useTranslation } from 'react-i18next'
import { Snail, Square, Volume2 } from 'lucide-react'
import Button from '../Button'
import styles from './Step.module.css'

export default function PlayAllButtons({ label, playingRate, onPlay, onStop }) {
  const { t } = useTranslation()
  const buttons = [
    { rate: 'normal', Icon: Volume2, text: label },
    { rate: 'slow', Icon: Snail, text: t('speech.slow') },
  ]

  return (
    <div className={styles.controls} role="group" aria-label={label}>
      {buttons.map(({ rate, Icon, text }) => {
        const playing = playingRate === rate
        return (
          <Button
            key={rate}
            size="sm"
            variant={playing ? 'primary' : 'secondary'}
            icon={playing ? Square : Icon}
            aria-pressed={playing}
            onClick={() => (playing ? onStop() : onPlay(rate))}
          >
            {playing ? t('speech.stop') : text}
          </Button>
        )
      })}
    </div>
  )
}
