// =========================================================
// Tile — การ์ดลิงก์ ใช้ซ้ำในหลายหน้า
// (ปุ่มลัดหน้าแรก, รายการ Stage, รายการบทเรียน, รายการมินิเกม ฯลฯ)
//   icon  = ไอคอนเส้นจาก lucide (ส่งเป็น component เช่น ICONS.home)
//   image = ภาพถ่ายย่อ (path ใน public/images) — ใช้แทน icon ได้
//   locked = ยังล็อกอยู่ → ภาพยังเป็นสีจริง แต่จางลงเล็กน้อย + มีรูปกุญแจทับมุมภาพ
//   current = รายการที่แนะนำให้ทำต่อ (บทต่อไป) → กรอบเด่น + aria-current="step"
//   tone = สีพาสเทลของกล่องไอคอน: 'violet' | 'sky' | 'mint' | 'peach' | 'lemon' | 'pink' | 'plain'
// layout: 'row' (แนวนอน ใช้ในรายการ) | 'stack' (แนวตั้ง ปุ่มลัด) | 'feature' (การ์ดใหญ่) | 'cover' (ภาพใหญ่เต็มการ์ด)
//
// TileList — ครอบรายการ Tile เป็น <ul>
// variant: 'list' (เรียงลงมา) | 'columns' (จอกว้าง 2 คอลัมน์) | 'grid' (2–3 คอลัมน์) | 'features' (การ์ดใหญ่ 3 คอลัมน์) | 'gallery' (การ์ดภาพ 2–4 คอลัมน์)
// =========================================================
import { Children } from 'react'
import { Link } from 'react-router-dom'
import { ICONS } from '../utils/icons'
import Picture from './Picture'
import styles from './Tile.module.css'

export default function Tile({
  to,
  icon: Icon,
  image,
  title,
  description,
  badge,
  locked = false,
  current = false,
  tone,
  layout = 'row',
}) {
  const classes = [styles.tile, styles[layout], tone && styles[tone], locked && styles.locked, current && styles.current]
    .filter(Boolean)
    .join(' ')
  const LockIcon = ICONS.locked
  const Chevron = ICONS.chevron
  const isRow = layout === 'row' || layout === 'feature'

  return (
    <Link to={to} className={classes} aria-current={current ? 'step' : undefined}>
      {image ? (
        <span className={styles.thumb}>
          <Picture image={image} size="sm" />
          {locked && (
            <span className={styles.lock}>
              <LockIcon aria-hidden="true" />
            </span>
          )}
        </span>
      ) : (
        Icon && (
          <span className={styles.icon}>
            <Icon aria-hidden="true" />
          </span>
        )
      )}
      <span className={styles.text}>
        <span className={styles.title}>{title}</span>
        {badge && <span className={styles.badge}>{badge}</span>}
        {description && <span className={styles.description}>{description}</span>}
      </span>
      {isRow && <Chevron className={styles.chevron} aria-hidden="true" />}
    </Link>
  )
}

const LIST_CLASS = {
  list: styles.list,
  columns: styles.columns,
  grid: styles.grid,
  features: `${styles.grid} ${styles.features}`,
  gallery: styles.gallery,
}

export function TileList({ variant = 'list', children }) {
  const list = (
    <ul className={LIST_CLASS[variant]}>
      {Children.map(children, (child) => child && <li className={styles.item}>{child}</li>)}
    </ul>
  )
  // gallery ปรับจำนวนช่องตามความกว้างของกล่อง (container query)
  return variant === 'gallery' ? <div className={styles.galleryBox}>{list}</div> : list
}
