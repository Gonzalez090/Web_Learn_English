// =========================================================
// Tile — การ์ดลิงก์ ใช้ซ้ำในหลายหน้า
// (ปุ่มลัดหน้าแรก, รายการ Stage, รายการบทเรียน, รายการมินิเกม ฯลฯ)
//   icon  = ไอคอนเส้นจาก lucide (ส่งเป็น component เช่น ICONS.home)
//   image = ภาพถ่ายย่อ (path ใน public/images) — ใช้แทน icon ได้
//   locked = ยังล็อกอยู่ → ภาพยังเป็นสีจริง แต่จางลงเล็กน้อย + มีรูปกุญแจทับมุมภาพ
// layout: 'row' (แนวนอน ใช้ในรายการ) | 'stack' (แนวตั้ง ใช้ในตาราง)
//
// TileList — ครอบรายการ Tile เป็น <ul>
// variant: 'list' (เรียงลงมา) | 'grid' (2–3 คอลัมน์)
// =========================================================
import { Children } from 'react'
import { Link } from 'react-router-dom'
import { ICONS } from '../utils/icons'
import Picture from './Picture'
import styles from './Tile.module.css'

export default function Tile({ to, icon: Icon, image, title, description, badge, locked = false, layout = 'row' }) {
  const classes = [styles.tile, styles[layout], locked && styles.locked].filter(Boolean).join(' ')
  const LockIcon = ICONS.locked

  return (
    <Link to={to} className={classes}>
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
    </Link>
  )
}

export function TileList({ variant = 'list', children }) {
  return (
    <ul className={variant === 'grid' ? styles.grid : styles.list}>
      {Children.map(children, (child) => child && <li className={styles.item}>{child}</li>)}
    </ul>
  )
}
