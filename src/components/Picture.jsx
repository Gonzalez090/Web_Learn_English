// =========================================================
// Picture — ภาพประกอบเนื้อหา (ภาพถ่ายสมจริงจาก public/images/)
// - ถ้าไม่มีไฟล์ หรือโหลดไม่ได้ → แสดงกรอบว่างพร้อมไอคอน "ไม่มีภาพ" (ไม่ใช้ emoji)
// - Stage 1–3 ให้ส่ง alt เป็นค่าว่าง เพื่อไม่ให้โปรแกรมอ่านหน้าจอบอกคำตอบ
// size: 'xs' (ไอคอนในรายการ) | 'sm' | 'md' | 'lg' | 'fill' (เต็มความกว้าง)
// =========================================================
import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import styles from './Picture.module.css'

export default function Picture({ image, alt = '', size = 'md', className = '' }) {
  // จำว่า "ภาพไหน" โหลดไม่ได้ — ถ้า image เปลี่ยนเป็นภาพใหม่ จะลองโหลดใหม่เอง
  const [failedSrc, setFailedSrc] = useState(null)
  const showImage = Boolean(image) && failedSrc !== image

  return (
    <div className={[styles.frame, styles[size], className].filter(Boolean).join(' ')}>
      {showImage ? (
        <img
          src={image}
          alt={alt}
          className={styles.image}
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => setFailedSrc(image)}
        />
      ) : (
        <ImageOff className={styles.missing} aria-hidden="true" />
      )}
    </div>
  )
}
