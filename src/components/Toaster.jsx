// =========================================================
// Toaster — แสดงข้อความแจ้งเตือนสั้น ๆ เหนือแถบเมนูล่าง แล้วหายเองใน 4 วินาที
// (ขึ้นเลเวล / ภารกิจสำเร็จ / ใช้ Streak Freeze / สนิทกับ NPC มากขึ้น) — ข้อมูลจาก toastStore
// =========================================================
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Snowflake, Trophy, X } from 'lucide-react'
import { dailyMissionPool, getNpc } from '../data'
import { useToastStore } from '../store/toastStore'
import { useLocalized } from '../hooks/useLocalized'
import { titleKeyForLevel } from '../utils/level'
import { ICONS } from '../utils/icons'
import styles from './Toaster.module.css'

const SHOW_MS = 4000

// ชนิด → ไอคอน + ข้อความ
function useToastContent(toast) {
  const { t } = useTranslation()
  const loc = useLocalized()

  if (toast.kind === 'levelUp') {
    const titleKey = titleKeyForLevel(toast.level)
    const newTitle = titleKey !== titleKeyForLevel(toast.level - 1)
    return {
      Icon: Trophy,
      title: t('toast.levelUp', { level: toast.level }),
      text: newTitle ? t('toast.newTitle', { title: t(`level.titles.${titleKey}`) }) : t('toast.keepGoing'),
    }
  }
  if (toast.kind === 'mission') {
    const mission = dailyMissionPool.find((item) => item.id === toast.missionId)
    return {
      Icon: ICONS.missions,
      title: t('toast.missionDone', { xp: toast.xp }),
      text: mission ? loc(mission, 'title') : '',
    }
  }
  if (toast.kind === 'friendship') {
    const npc = getNpc(toast.npcId)
    return {
      Icon: ICONS.friendship,
      title: t('toast.friendshipUp', { name: npc ? loc(npc, 'name') : '' }),
      text: t('toast.friendshipLevel', { level: t(`npc.level.${toast.level}`) }),
    }
  }
  if (toast.kind === 'bossDone') {
    return { Icon: ICONS.boss, title: t('toast.bossDone', { xp: toast.xp }), text: t('toast.bossDoneText') }
  }
  if (toast.kind === 'planDone') {
    return { Icon: ICONS.completed, title: t('toast.planDone'), text: t('toast.planDoneText') }
  }
  return { Icon: Snowflake, title: t('toast.freezeUsed'), text: t('toast.freezeText', { count: toast.count }) }
}

function ToastItem({ toast, dismiss }) {
  const { t } = useTranslation()
  const { Icon, title, text } = useToastContent(toast)

  useEffect(() => {
    const timer = setTimeout(() => dismiss(toast.id), SHOW_MS)
    return () => clearTimeout(timer)
  }, [toast.id, dismiss])

  return (
    <div className={`${styles.toast} ${styles[toast.kind] ?? ''}`}>
      <Icon className={styles.icon} aria-hidden="true" />
      <div className={styles.body}>
        <p className={styles.title}>{title}</p>
        {text && <p className={styles.text}>{text}</p>}
      </div>
      <button type="button" className={styles.close} aria-label={t('toast.dismiss')} onClick={() => dismiss(toast.id)}>
        <X aria-hidden="true" />
      </button>
    </div>
  )
}

export default function Toaster() {
  const toasts = useToastStore((state) => state.toasts)
  const dismiss = useToastStore((state) => state.dismiss)

  return (
    <div className={styles.region} role="status" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} dismiss={dismiss} />
      ))}
    </div>
  )
}
