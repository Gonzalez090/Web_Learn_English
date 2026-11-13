// =========================================================
// Button — ปุ่มหลักของเว็บ
// - ส่ง `to` → เป็นลิงก์เปลี่ยนหน้า (react-router)
// - ไม่ส่ง `to` → เป็น <button>
// icon: ไอคอนเส้นจาก lucide (ส่งเป็น component เช่น ICONS.plan)
// variant: 'primary' | 'secondary' | 'ghost' | 'danger'   size: 'sm' | 'md' | 'lg'
// =========================================================
import { Link } from 'react-router-dom'
import styles from './Button.module.css'

export default function Button({
  to,
  variant = 'primary',
  size = 'md',
  block = false,
  icon: Icon,
  className = '',
  children,
  ...rest
}) {
  const classes = [styles.button, styles[variant], styles[size], block && styles.block, className]
    .filter(Boolean)
    .join(' ')

  const content = (
    <>
      {Icon && <Icon className={styles.icon} aria-hidden="true" />}
      <span>{children}</span>
    </>
  )

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" className={classes} {...rest}>
      {content}
    </button>
  )
}
