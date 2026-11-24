// =========================================================
// Avatar — วงกลมตัวอักษรแรกของชื่อ (ไม่โหลดรูปโปรไฟล์จาก Google) / ยังไม่ล็อกอิน = ไอคอนคน
// size: 'sm' (แถบบน) | 'lg' (หัวโปรไฟล์)   dot = สถานะการซิงก์ ('synced' | 'syncing' | 'offline' | 'error' | 'outdated')
// =========================================================
import { User } from 'lucide-react'
import styles from './Avatar.module.css'

export default function Avatar({ name, size = 'sm', dot }) {
  return (
    <span className={`${styles.avatar} ${styles[size]} ${name ? '' : styles.guest}`} aria-hidden="true">
      {name ? Array.from(name)[0].toUpperCase() : <User />}
      {dot && <span className={styles.dot} data-state={dot} />}
    </span>
  )
}
