// =========================================================
// AccountButton — บัญชีบนแถบบนทุกหน้า (ขั้นที่ 31) → ไปหน้าโปรไฟล์
//   ยังไม่ล็อกอิน: "เข้าสู่ระบบ" (จอแคบเหลือไอคอน) / ล็อกอินแล้ว: วงกลมชื่อ + จุดสถานะการซิงก์
// =========================================================
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LogIn } from 'lucide-react'
import { useAccountStore } from '../../store/accountStore'
import Avatar from '../Avatar'
import styles from './AccountButton.module.css'

export default function AccountButton() {
  const { t } = useTranslation()
  const status = useAccountStore((state) => state.status)
  const user = useAccountStore((state) => state.user)
  const sync = useAccountStore((state) => state.sync)

  if (status === 'off') return null
  if (user) {
    return (
      <Link to="/profile" className={styles.avatar} aria-label={t('account.openProfile', { name: user.name })} title={user.name}>
        <Avatar name={user.name} dot={sync} />
      </Link>
    )
  }
  return (
    <Link to="/profile" className={styles.signIn} aria-label={t('account.signInShort')}>
      <LogIn className={styles.icon} aria-hidden="true" />
      <span className={styles.label}>{t('account.signInShort')}</span>
    </Link>
  )
}
