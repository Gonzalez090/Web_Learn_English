// =========================================================
// SyncStatus — สถานะการซิงก์กับบัญชี (ขั้นที่ 31): กำลังซิงก์ / ซิงก์แล้วเมื่อ … / ออฟไลน์ / ยังซิงก์ไม่ได้
// =========================================================
import { useTranslation } from 'react-i18next'
import { CloudAlert, CloudCheck, CloudOff, RefreshCw } from 'lucide-react'
import { useAccountStore } from '../store/accountStore'
import styles from './SyncStatus.module.css'

const SYNC_ICON = { synced: CloudCheck, offline: CloudOff, error: CloudAlert, outdated: CloudAlert }

// 'ซิงก์แล้ว 14:05 น.'
const timeOf = (ms, language) =>
  new Date(ms).toLocaleTimeString(language === 'th' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit' })

export default function SyncStatus() {
  const { t, i18n } = useTranslation()
  const sync = useAccountStore((state) => state.sync)
  const lastSyncedAt = useAccountStore((state) => state.lastSyncedAt)
  const Icon = SYNC_ICON[sync] ?? RefreshCw
  return (
    <p className={styles.sync} data-state={sync} role="status">
      <Icon className={styles.syncIcon} aria-hidden="true" />
      <span>
        {sync === 'synced'
          ? t('account.sync.synced', { time: timeOf(lastSyncedAt, i18n.language) })
          : t(`account.sync.${sync === 'idle' ? 'syncing' : sync}`)}
      </span>
    </p>
  )
}
