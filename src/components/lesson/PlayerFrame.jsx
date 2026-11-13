// =========================================================
// PlayerFrame — กรอบของตัวเล่นแบบทีละขั้น (บทเรียน / ทบทวน)
//   แถบบน: ปุ่ม "ออก" + แถบความคืบหน้า แล้วตามด้วยขั้นปัจจุบัน (children)
// props: exitTo, index (ขั้นที่ทำอยู่ เริ่ม 0), total (จำนวนขั้น), stepKey (เปลี่ยน = เริ่มขั้นใหม่)
// =========================================================
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import Button from '../Button'
import styles from './PlayerFrame.module.css'

export default function PlayerFrame({ exitTo, index, total, stepKey, children }) {
  const { t } = useTranslation()
  const ratio = total > 0 ? index / total : 0

  return (
    <div className={styles.player}>
      <div className={styles.top}>
        <Button to={exitTo} variant="ghost" size="sm" icon={X} className={styles.exit}>
          {t('lesson.exit')}
        </Button>
        <div
          className={styles.progress}
          role="progressbar"
          aria-label={t('lesson.progress')}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={index}
        >
          <span className={styles.progressBar} style={{ transform: `scaleX(${ratio})` }} />
        </div>
      </div>

      {/* key เปลี่ยน → เริ่ม component ของขั้นใหม่ (สถานะไม่ค้างจากข้อก่อน) */}
      <div key={stepKey} className={styles.stage}>
        {children}
      </div>
    </div>
  )
}
