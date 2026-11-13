// =========================================================
// VocabCard — การ์ดคำศัพท์ (ส่วนที่ 2.1 ของสเปก)
//   ภาพถ่าย
//   → คำภาษาอังกฤษ (Stage 1–3 ไม่แสดง / Stage 4 กดดูได้ / Stage 5+ แสดงเลย)
//   → คำอ่านไทย + พยางค์ที่ลงเสียงหนัก (ตามตั้งค่า)
//   → ความหมายไทย (ซ่อนไว้ กดดูได้ — หรือแสดงเลยถ้าตั้งค่าไว้)
//   → ปุ่มฟัง ปกติ / ช้า
//   (ปุ่ม 🎤 พูดตาม เพิ่มในขั้นที่ 3)
// ใช้ได้ทั้งคำเดี่ยว (item.word) และประโยค (item.target ของ Stage 4)
// =========================================================
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, Languages } from 'lucide-react'
import { useSettingsStore } from '../store/settingsStore'
import { englishTextMode, meaningStartsVisible, showThaiReading } from '../utils/display'
import Picture from './Picture'
import SpeakButton from './SpeakButton'
import ThaiReading from './ThaiReading'
import styles from './VocabCard.module.css'

export default function VocabCard({ item, stage }) {
  const { t } = useTranslation()
  const thaiReadingSetting = useSettingsStore((state) => state.thaiReading)
  const thaiTranslationSetting = useSettingsStore((state) => state.thaiTranslation)
  const [textOpen, setTextOpen] = useState(false)
  const [meaningOpen, setMeaningOpen] = useState(false)

  const english = item.word ?? item.target
  const meaning = item.meaningTh ?? item.translationTh
  const textMode = englishTextMode(stage.showText)
  const textVisible = textMode === 'shown' || (textMode === 'toggle' && textOpen)
  const readingVisible = textVisible && showThaiReading(thaiReadingSetting, stage)
  const meaningVisible = meaningOpen || meaningStartsVisible(thaiTranslationSetting)

  return (
    <article className={styles.card}>
      {/* alt บอกคำตอบได้ → ใส่ alt เฉพาะตอนที่แสดงคำอยู่แล้ว */}
      <Picture image={item.image} size="fill" alt={textVisible ? english : ''} />

      <div className={styles.body}>
        {textMode === 'toggle' && !textOpen && (
          <button type="button" className={styles.reveal} onClick={() => setTextOpen(true)}>
            <Eye className={styles.revealIcon} aria-hidden="true" />
            {t('card.showText')}
          </button>
        )}

        {textVisible && (
          <p className={styles.english} lang="en">
            {english}
          </p>
        )}

        {readingVisible && <ThaiReading reading={item.readingTh} stressSyllable={item.stressSyllable} />}

        {textVisible && (
          <p className={styles.tags}>
            <span className={styles.tag}>{t(`register.${item.register}`)}</span>
            <span className={styles.tag}>{t(`frequency.${item.frequency}`)}</span>
          </p>
        )}

        {meaningVisible ? (
          <p className={styles.meaning} lang="th">
            {meaning}
          </p>
        ) : (
          <button type="button" className={styles.reveal} onClick={() => setMeaningOpen(true)}>
            <Languages className={styles.revealIcon} aria-hidden="true" />
            {t('card.showMeaning')}
          </button>
        )}

        <div className={styles.actions}>
          <SpeakButton text={english} id={item.id} size="sm" />
        </div>
      </div>
    </article>
  )
}
