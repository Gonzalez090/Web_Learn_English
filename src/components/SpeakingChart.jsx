// =========================================================
// SpeakingChart — กราฟแท่ง "นาทีที่พูดภาษาอังกฤษ" 7 วันล่าสุด (ส่วนที่ 8.4, ขั้นที่ 18) — SVG ทำเอง ไม่ใช้ไลบรารี
//   แท่งละวัน (เก่า → ใหม่) ตัวเลขนาทีบนแท่ง ชื่อวันใต้แท่ง วันนี้สีเข้ม + รวม 7 วันใต้กราฟ
//   ยังไม่เคยพูดเลย → ข้อความชวนไปใช้ไมค์แทนกราฟว่าง
// props: minutes = et-progress.speakingMinutes { 'YYYY-MM-DD': นาที }, today = 'YYYY-MM-DD'
// =========================================================
import { useTranslation } from 'react-i18next'
import { formatMinutes, lastDays } from '../utils/speaking'
import styles from './SpeakingChart.module.css'

const WIDTH = 308
const HEIGHT = 150
const TOP = 22 // ที่ว่างให้ตัวเลขบนแท่ง
const BOTTOM = 24 // ที่ว่างให้ชื่อวัน
const BAR_GAP = 12

export default function SpeakingChart({ minutes, today }) {
  const { t, i18n } = useTranslation()
  const days = lastDays(minutes, today)
  const total = days.reduce((sum, day) => sum + day.minutes, 0)
  if (total === 0) return <p className={styles.empty}>{t('plan.chartEmpty')}</p>

  const max = Math.max(1, ...days.map((day) => day.minutes))
  const barWidth = (WIDTH - BAR_GAP * (days.length + 1)) / days.length
  const plotHeight = HEIGHT - TOP - BOTTOM
  const locale = i18n.language === 'th' ? 'th-TH' : 'en-US'
  const weekday = (date) => {
    const [y, m, d] = date.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString(locale, { weekday: 'short' })
  }

  return (
    <figure className={styles.figure}>
      <svg
        className={styles.chart}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`${t('plan.chartLabel')}: ${days.map((day) => `${weekday(day.date)} ${formatMinutes(day.minutes)}`).join(', ')}`}
      >
        <line className={styles.axis} x1={0} x2={WIDTH} y1={HEIGHT - BOTTOM} y2={HEIGHT - BOTTOM} />
        {days.map((day, index) => {
          const height = Math.max(day.minutes > 0 ? 3 : 0, (day.minutes / max) * plotHeight)
          const x = BAR_GAP + index * (barWidth + BAR_GAP)
          const y = HEIGHT - BOTTOM - height
          const isToday = day.date === today
          return (
            <g key={day.date}>
              <rect
                className={isToday ? `${styles.bar} ${styles.today}` : styles.bar}
                x={x}
                y={y}
                width={barWidth}
                height={height}
                rx={4}
              />
              {day.minutes > 0 && (
                <text className={styles.value} x={x + barWidth / 2} y={y - 6} textAnchor="middle">
                  {formatMinutes(day.minutes)}
                </text>
              )}
              <text
                className={isToday ? `${styles.day} ${styles.dayToday}` : styles.day}
                x={x + barWidth / 2}
                y={HEIGHT - 6}
                textAnchor="middle"
              >
                {isToday ? t('plan.today') : weekday(day.date)}
              </text>
            </g>
          )
        })}
      </svg>
      <figcaption className={styles.caption}>{t('plan.chartTotal', { value: formatMinutes(total) })}</figcaption>
    </figure>
  )
}
