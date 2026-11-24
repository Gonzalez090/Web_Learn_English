// =========================================================
// Section — กล่องหัวข้อย่อยในหน้า (h2 + คำอธิบาย + เนื้อหา)
// card = ครอบด้วยการ์ดขาว (หน้าตั้งค่า)
// =========================================================
import styles from './Section.module.css'

export default function Section({ title, description, card = false, children }) {
  return (
    <section className={card ? `${styles.section} ${styles.card}` : styles.section}>
      {title && <h2 className={styles.title}>{title}</h2>}
      {description && <p className={styles.description}>{description}</p>}
      {children}
    </section>
  )
}
