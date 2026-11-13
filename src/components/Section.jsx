// =========================================================
// Section — กล่องหัวข้อย่อยในหน้า (h2 + คำอธิบาย + เนื้อหา)
// =========================================================
import styles from './Section.module.css'

export default function Section({ title, description, children }) {
  return (
    <section className={styles.section}>
      {title && <h2 className={styles.title}>{title}</h2>}
      {description && <p className={styles.description}>{description}</p>}
      {children}
    </section>
  )
}
