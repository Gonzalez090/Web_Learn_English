// =========================================================
// CreditsPage — เครดิตภาพถ่าย (/credits)
// ภาพประกอบทั้งหมดมาจาก Pixabay — แสดงภาพย่อ + ชื่อช่างภาพ + ลิงก์ต้นฉบับ
// ข้อมูลมาจาก src/data/imageCredits.json (สคริปต์ scripts/fetch-images.mjs เป็นคนเขียน)
// =========================================================
import { useTranslation } from 'react-i18next'
// { [id ภาพ]: { provider, sourceId, photographer, photographerUrl, pageUrl } } — หน้านี้โหลดแยกไฟล์ (lazy ใน App.jsx)
import imageCredits from '../data/imageCredits.json'
import Page from '../components/Page'
import Picture from '../components/Picture'
import styles from './CreditsPage.module.css'

const PIXABAY_URL = 'https://pixabay.com/'
const KOKORO_URL = 'https://huggingface.co/hexgrad/Kokoro-82M'

export default function CreditsPage() {
  const { t } = useTranslation()
  const entries = Object.entries(imageCredits)

  return (
    <Page title={t('credits.title')} subtitle={t('credits.subtitle')} backTo="/settings" wide>
      <p className={styles.source}>
        {t('credits.source')}{' '}
        <a href={PIXABAY_URL} target="_blank" rel="noopener noreferrer">
          {t('credits.pixabay')}
        </a>
      </p>
      <p className={styles.source}>
        {t('credits.voiceSource')}{' '}
        <a href={KOKORO_URL} target="_blank" rel="noopener noreferrer">
          {t('credits.kokoro')}
        </a>
      </p>

      <ul className={styles.list}>
        {entries.map(([id, credit]) => (
          <li key={id} className={styles.item}>
            <Picture image={`/images/${id}.webp`} size="xs" />
            <span className={styles.text}>
              <a href={credit.pageUrl} target="_blank" rel="noopener noreferrer" className={styles.photo}>
                {t('credits.photoNumber', { id: credit.sourceId })}
              </a>
              <span className={styles.by}>
                {t('credits.by')}{' '}
                <a href={credit.photographerUrl} target="_blank" rel="noopener noreferrer">
                  {credit.photographer}
                </a>
              </span>
            </span>
          </li>
        ))}
      </ul>
    </Page>
  )
}
