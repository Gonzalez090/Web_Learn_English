// =========================================================
// Toaster — แสดงข้อความแจ้งเตือนสั้น ๆ เหนือแถบเมนูล่าง แล้วหายเองใน 4 วินาที
// (ขึ้นเลเวล / ภารกิจสำเร็จ / ใช้ Streak Freeze / สนิทกับ NPC มากขึ้น / การ์ดวลีใหม่) — ข้อมูลจาก toastStore
// =========================================================
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Snowflake, Trophy, X } from 'lucide-react'
import { dailyMissionPool, getNpc } from '../data'
import { useToastStore } from '../store/toastStore'
import { useLocalized } from '../hooks/useLocalized'
import { titleKeyForLevel } from '../utils/level'
import { unlockedBetween } from '../utils/room'
import { ICONS } from '../utils/icons'
import styles from './Toaster.module.css'

const SHOW_MS = 4000
const MAX_ROOM_NAMES = 3 // ของใหม่ในห้องที่บอกชื่อ (ที่เหลือ = +N) ให้อ่านทันก่อนหาย

// ชนิด → ไอคอน + ข้อความ
function useToastContent(toast) {
  const { t } = useTranslation()
  const loc = useLocalized()

  if (toast.kind === 'levelUp') {
    const titleKey = titleKeyForLevel(toast.level)
    // ข้ามหลายเลเวลได้ในครั้งเดียว → เทียบกับเลเวลก่อนได้ XP (from)
    const from = toast.from ?? toast.level - 1
    const newTitle = titleKey !== titleKeyForLevel(from)
    // ฉายาใหม่ + ของใหม่สำหรับห้อง (ขั้นที่ 20-2) คนละบรรทัด — ไม่มีทั้งคู่ = คำให้กำลังใจ
    const roomItems = unlockedBetween(from, toast.level)
    const names = roomItems.slice(0, MAX_ROOM_NAMES).map((item) => loc(item, 'name')).join(', ')
    const more = roomItems.length - MAX_ROOM_NAMES
    const lines = [
      newTitle && t('toast.newTitle', { title: t(`level.titles.${titleKey}`) }),
      roomItems.length > 0 && t('toast.newRoomItems', { items: more > 0 ? `${names} +${more}` : names }),
    ].filter(Boolean)
    return {
      Icon: Trophy,
      title: t('toast.levelUp', { level: toast.level }),
      text: lines.length ? lines.join('\n') : t('toast.keepGoing'),
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
  if (toast.kind === 'collect') {
    return {
      Icon: toast.rarity ? ICONS.special : ICONS.collection,
      title: toast.rarity ? t('toast.collectSpecial', { kind: t(`collection.rarity.${toast.rarity}`) }) : t('toast.collect'),
      text: toast.text,
      lang: 'en',
    }
  }
  if (toast.kind === 'planDone') {
    return { Icon: ICONS.completed, title: t('toast.planDone'), text: t('toast.planDoneText') }
  }
  return { Icon: Snowflake, title: t('toast.freezeUsed'), text: t('toast.freezeText', { count: toast.count }) }
}

function ToastItem({ toast, dismiss }) {
  const { t } = useTranslation()
  const { Icon, title, text, lang } = useToastContent(toast)

  useEffect(() => {
    const timer = setTimeout(() => dismiss(toast.id), SHOW_MS)
    return () => clearTimeout(timer)
  }, [toast.id, dismiss])

  return (
    <div className={`${styles.toast} ${styles[toast.kind] ?? ''} ${toast.rarity ? styles.special : ''}`}>
      <Icon className={styles.icon} aria-hidden="true" />
      <div className={styles.body}>
        <p className={styles.title}>{title}</p>
        {text && (
          <p className={styles.text} lang={lang}>
            {text}
          </p>
        )}
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
