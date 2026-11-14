// =========================================================
// PageLoading — ตัวโหลดระหว่างรอเนื้อหาที่แยกไฟล์ไว้ (เช่น บทเรียนของ Stage ที่ยังไม่เคยเปิด)
// ใช้เป็น fallback ของ Suspense ใน AppLayout — โผล่หลังรอเกินเสี้ยววินาทีเท่านั้น (โหลดเร็วจะไม่เห็นกระพริบ)
// =========================================================
import { useTranslation } from 'react-i18next'
import { LoaderCircle } from 'lucide-react'
import styles from './PageLoading.module.css'

export default function PageLoading() {
  const { t } = useTranslation()
  return (
    <div className={styles.loading} role="status">
      <LoaderCircle className={styles.spinner} aria-hidden="true" />
      <span>{t('common.loading')}</span>
    </div>
  )
}
