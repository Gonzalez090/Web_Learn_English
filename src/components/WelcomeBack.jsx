// =========================================================
// WelcomeBack — กลับมาหลังหายไป ≥ 3 วัน → NPC ทัก "Long time no see!" บนหน้าแรก (ส่วนที่ 8.6 — ขั้นที่ 15)
//   คนที่ทัก = NPC ที่สนิทที่สุดในสถานที่ที่ปลดล็อกแล้ว (ยังไม่สนิทใคร → ป้าโรสข้างบ้าน)
//   + ปุ่ม "ทบทวนสั้น ๆ" (5 ข้อแรกที่ถึงกำหนด — /review?short=1) ถ้ามีรายการต้องทบทวน
//   แสดงเฉพาะวันที่กลับมา (progressStore.welcomeBack.date = วันนี้) — กดปิดได้
// =========================================================
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { cityMap, npcs } from '../data'
import { useLocalized } from '../hooks/useLocalized'
import { useProgressStore } from '../store/progressStore'
import { greeterNpc } from '../utils/friendship'
import { unlockedPlaceIds } from '../utils/places'
import { todayKey } from '../utils/date'
import { SHORT_REVIEW_COUNT } from '../utils/review'
import { ICONS } from '../utils/icons'
import Picture from './Picture'
import Button from './Button'
import LineButton from './lesson/LineButton'
import styles from './WelcomeBack.module.css'

// reviewCount = จำนวนรายการที่ถึงกำหนดทบทวนวันนี้
export default function WelcomeBack({ reviewCount }) {
  const { t } = useTranslation()
  const loc = useLocalized()
  const welcomeBack = useProgressStore((state) => state.welcomeBack)
  const friendship = useProgressStore((state) => state.npcFriendship)
  const unlockedStages = useProgressStore((state) => state.unlockedStages)
  const dismiss = useProgressStore((state) => state.dismissWelcomeBack)

  if (!welcomeBack || welcomeBack.date !== todayKey()) return null
  const npc = greeterNpc(npcs, friendship, unlockedPlaceIds(cityMap, unlockedStages))
  if (!npc) return null
  const name = loc(npc, 'name')

  return (
    <section className={styles.banner} aria-label={t('welcomeBack.title')}>
      <button type="button" className={styles.close} aria-label={t('welcomeBack.dismiss')} onClick={dismiss}>
        <X aria-hidden="true" />
      </button>
      <div className={styles.top}>
        <Picture image={npc.image} size="sm" alt={name} className={styles.avatar} />
        <div className={styles.bubble}>
          <p className={styles.speaker}>{name}</p>
          <p className={styles.line}>
            <span lang="en">{npc.welcomeBack.text}</span>
            <LineButton
              text={npc.welcomeBack.text}
              rate={npc.speechRate}
              speakKey={`${npc.id}:welcome`}
              label={t('npc.hearLine')}
            />
          </p>
          <p className={styles.meaning} lang="th">
            {npc.welcomeBack.translationTh}
          </p>
        </div>
      </div>
      <p className={styles.note}>
        {reviewCount > 0
          ? t('welcomeBack.noteReview', { days: welcomeBack.days })
          : t('welcomeBack.note', { days: welcomeBack.days })}
      </p>
      {reviewCount > 0 && (
        <Button to="/review?short=1" size="sm" icon={ICONS.review}>
          {t('welcomeBack.shortReview', { count: Math.min(reviewCount, SHORT_REVIEW_COUNT) })}
        </Button>
      )}
    </section>
  )
}
