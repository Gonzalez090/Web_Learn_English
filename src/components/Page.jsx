// =========================================================
// Page — โครงหน้ามาตรฐาน: ปุ่มย้อนกลับ (ถ้ามี) + หัวข้อ + คำอธิบาย + เนื้อหา
// backTo: path ที่จะกลับไป (ใช้ path แทน history เพื่อให้กลับถูกที่เสมอ
//         แม้ผู้ใช้เปิดลิงก์ตรงเข้ามา)
// compact: จอเตี้ยย่อหัวหน้า + ระยะห่าง (หน้าบทเรียน/ทบทวน — ให้ปุ่มไม่ตกใต้จอ)
// wide: หน้ารายการหลายคอลัมน์ (จอกว้างใช้พื้นที่เต็ม) — ไม่ส่ง = คอลัมน์เดียวอ่านสบาย
// =========================================================
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ICONS } from '../utils/icons'
import styles from './Page.module.css'

export default function Page({ title, subtitle, backTo, wide = false, compact = false, children }) {
  const { t } = useTranslation()
  const BackIcon = ICONS.back

  return (
    <section className={[styles.page, wide && styles.wide, compact && styles.compact].filter(Boolean).join(' ')}>
      <header className={styles.header}>
        {backTo && (
          <Link to={backTo} className={styles.back} aria-label={t('nav.back')}>
            <BackIcon aria-hidden="true" />
          </Link>
        )}
        <div className={styles.heading}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  )
}
