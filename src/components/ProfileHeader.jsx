// =========================================================
// ProfileHeader — หัวหน้าโปรไฟล์ (ขั้นที่ 31)
//   ล็อกอินแล้ว: วงกลมชื่อ + ชื่อ + อีเมล + เลเวล/ฉายา + สถานะการซิงก์ + ปุ่มซิงก์ / ออกจากระบบ
//   ยังไม่ล็อกอิน: บอกว่าข้อมูลอยู่แค่เครื่องนี้ + ปุ่มเข้าสู่ระบบด้วย Google
//   ไม่ได้ตั้งค่าระบบบัญชี → ไม่แสดง
// =========================================================
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LogOut, RefreshCw } from 'lucide-react'
import { signIn, signOut, syncNow, useAccountStore } from '../store/accountStore'
import { useProgressStore } from '../store/progressStore'
import { levelProgress } from '../utils/level'
import Avatar from './Avatar'
import Button from './Button'
import GoogleButton from './GoogleButton'
import SyncStatus from './SyncStatus'
import styles from './ProfileHeader.module.css'

export default function ProfileHeader() {
  const { t } = useTranslation()
  const status = useAccountStore((state) => state.status)
  const user = useAccountStore((state) => state.user)
  const sync = useAccountStore((state) => state.sync)
  const error = useAccountStore((state) => state.error)
  const [leaving, setLeaving] = useState(false)
  const { level, titleKey } = levelProgress(useProgressStore((state) => state.xp))

  if (status === 'off') return null

  return (
    <section className={styles.card} aria-label={t('account.title')}>
      <div className={styles.who}>
        <Avatar name={user?.name} size="lg" />
        <div className={styles.text}>
          <h2 className={styles.name}>{user ? user.name : t('account.guestName')}</h2>
          <p className={styles.note}>{user ? user.email : t('account.guestNote')}</p>
          <p className={styles.level}>
            {t('level.short', { level })} · {t(`level.titles.${titleKey}`)}
          </p>
        </div>
      </div>

      {user ? (
        <div className={styles.side}>
          <SyncStatus />
          <div className={styles.actions}>
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              disabled={sync === 'syncing' || leaving}
              onClick={() => (sync === 'outdated' ? window.location.reload() : syncNow())}
            >
              {t(sync === 'outdated' ? 'account.reload' : 'account.syncNow')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={LogOut}
              disabled={leaving}
              onClick={async () => {
                setLeaving(true)
                await signOut()
                setLeaving(false)
              }}
            >
              {t(leaving ? 'account.leaving' : 'account.signOut')}
            </Button>
          </div>
          <p className={styles.small}>{t('account.signOutNote')}</p>
        </div>
      ) : (
        <div className={styles.side}>
          <p className={styles.note}>{t('account.why')}</p>
          <GoogleButton block onClick={signIn} disabled={status === 'loading'} loading={status === 'loading'} />
          {error && (
            <p className={styles.error} role="alert">
              {t(`account.error.${error}`)}
            </p>
          )}
          <p className={styles.small}>
            {t('account.optional')}{' '}
            <Link to="/privacy" className={styles.link}>
              {t('privacy.title')}
            </Link>
          </p>
        </div>
      )}
    </section>
  )
}
