// =========================================================
// StoryStrip — แถบภาพของเรื่องเล่าเรียงกัน 1 → 2 → 3 (Stage 5 picture story)
//   ภาพปัจจุบันมีกรอบเน้น / ภาพอื่นจางลง / ส่ง onSelect → แตะภาพเพื่อไปภาพนั้นได้
//   ช่วยให้รู้ว่าตอนนี้อยู่ตอนไหนของเรื่อง (ต้น – กลาง – จบ)
// props: items (ภาพของเรื่อง), current (index ภาพปัจจุบัน), onSelect(index) (ไม่ส่ง = แตะไม่ได้)
// =========================================================
import { useTranslation } from 'react-i18next'
import Picture from '../Picture'
import styles from './StoryStrip.module.css'

export default function StoryStrip({ items, current, onSelect }) {
  const { t } = useTranslation()

  return (
    <ol className={styles.strip} aria-label={t('story.strip')} style={{ '--panels': items.length }}>
      {items.map((item, index) => {
        const isCurrent = index === current
        const label = t('story.panel', { n: index + 1, total: items.length })
        const content = (
          <>
            <Picture image={item.image} size="fill" alt="" className={styles.picture} />
            <span className={styles.number} aria-hidden="true">
              {index + 1}
            </span>
          </>
        )
        return (
          <li key={item.id} className={isCurrent ? `${styles.panel} ${styles.current}` : styles.panel}>
            {onSelect ? (
              <button
                type="button"
                className={styles.thumb}
                aria-label={label}
                aria-current={isCurrent ? 'step' : undefined}
                onClick={() => onSelect(index)}
              >
                {content}
              </button>
            ) : (
              <div className={styles.thumb} role="img" aria-label={label} aria-current={isCurrent ? 'step' : undefined}>
                {content}
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
