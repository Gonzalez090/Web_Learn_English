// =========================================================
// RoomPage — ห้องของตัวละคร (ส่วนที่ 8.1, ขั้นที่ 20-2) → /profile/room (โหลดแยกไฟล์)
//   บนสุด: ภาพบ้าน + ของตกแต่งแต่ละช่องเป็นกรอบรูป (แตะกรอบ = เลือกของช่องนั้น)
//   ล่าง: เลือกช่อง (ChipTabs) → ตัวเลือกของช่อง — แตะชิ้นที่ปลดล็อกแล้วเพื่อใช้, แตะชิ้นที่ใช้อยู่ = เอาออก
//   ชิ้นที่ยังล็อก: ภาพสีจริงจางลง + กุญแจ + "Lv N" (เลเวลคำนวณจาก XP, กติกาอยู่ใน utils/room.js)
//   (บ้านไม่มีช่องว่าง — เลือกหลังล่าสุด = อัตโนมัติ ได้บ้านใหม่แล้วย้ายให้เอง)
// =========================================================
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useProgressStore } from '../store/progressStore'
import { useLocalized } from '../hooks/useLocalized'
import { levelFromXp } from '../utils/level'
import { currentHome, currentItem, HOME_SLOT, homes, isUnlocked, nextUnlock, slots } from '../utils/room'
import { scrollIntoViewGently } from '../utils/scroll'
import { ICONS } from '../utils/icons'
import Page from '../components/Page'
import Section from '../components/Section'
import ChipTabs from '../components/ChipTabs'
import Picture from '../components/Picture'
import styles from './RoomPage.module.css'

export default function RoomPage() {
  const { t } = useTranslation()
  const loc = useLocalized()
  const level = useProgressStore((state) => levelFromXp(state.xp))
  const room = useProgressStore((state) => state.room)
  const chooseRoomItem = useProgressStore((state) => state.chooseRoomItem)
  const [slotId, setSlotId] = useState(HOME_SLOT)
  const optionsRef = useRef(null)

  const home = currentHome(room, level)
  const next = nextUnlock(level)
  const isHome = slotId === HOME_SLOT
  const options = isHome ? homes : slots.find((slot) => slot.id === slotId).items
  const selected = isHome ? home : currentItem(room, slotId, level)
  const LockIcon = ICONS.locked
  const AddIcon = ICONS.add
  const UsedIcon = ICONS.completed
  const unlockedCount = (items) => items.filter((item) => isUnlocked(item, level)).length

  // แตะภาพบ้าน/กรอบ → เปิดตัวเลือกของช่องนั้น แล้วเลื่อนจอไปให้เห็น
  function openSlot(id) {
    setSlotId(id)
    setTimeout(() => scrollIntoViewGently(optionsRef.current), 60)
  }

  function choose(item) {
    if (!isUnlocked(item, level)) return
    // แตะชิ้นที่ใช้อยู่ = เอาออก (บ้านเอาออกไม่ได้)
    if (!isHome && selected?.id === item.id) chooseRoomItem(slotId, null)
    else chooseRoomItem(slotId, item.id)
  }

  return (
    <Page title={t('room.title')} subtitle={t('room.subtitle')} backTo="/profile">
      <div className={styles.scene}>
        <button
          type="button"
          className={styles.home}
          aria-label={t('room.change', { name: loc(home, 'name') })}
          onClick={() => openSlot(HOME_SLOT)}
        >
          <Picture image={home.image} size="fill" className={styles.homePicture} />
          <span className={styles.homeName}>{loc(home, 'name')}</span>
        </button>
        <ul className={styles.frames} aria-label={t('room.decor')}>
          {slots.map((slot) => {
            const item = currentItem(room, slot.id, level)
            return (
              <li key={slot.id}>
                <button
                  type="button"
                  className={item ? styles.frame : `${styles.frame} ${styles.frameEmpty}`}
                  aria-label={item ? t('room.change', { name: loc(item, 'name') }) : t('room.add', { name: loc(slot, 'name') })}
                  onClick={() => openSlot(slot.id)}
                >
                  {item ? (
                    <Picture image={item.image} size="fill" className={styles.framePicture} />
                  ) : (
                    <AddIcon className={styles.addIcon} aria-hidden="true" />
                  )}
                  <span className={styles.frameName}>{loc(item ?? slot, 'name')}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <p className={styles.next}>
        {next
          ? t('room.next', { level: next.level, items: next.items.map((item) => loc(item, 'name')).join(', ') })
          : t('room.complete')}
      </p>

      <Section title={t('room.decorate')} description={t('room.hint')}>
        <ChipTabs
          label={t('room.decorate')}
          value={slotId}
          onChange={setSlotId}
          options={[
            { value: HOME_SLOT, label: t('room.home'), count: `${unlockedCount(homes)}/${homes.length}` },
            ...slots.map((slot) => ({
              value: slot.id,
              label: loc(slot, 'name'),
              count: `${unlockedCount(slot.items)}/${slot.items.length}`,
            })),
          ]}
        />
        <ul ref={optionsRef} className={styles.options}>
          {options.map((item) => {
            const unlocked = isUnlocked(item, level)
            const used = selected?.id === item.id
            const classes = [styles.option, used && styles.optionUsed, !unlocked && styles.optionLocked].filter(Boolean).join(' ')
            return (
              <li key={item.id}>
                <button type="button" className={classes} aria-pressed={used} disabled={!unlocked} onClick={() => choose(item)}>
                  <span className={styles.optionThumb}>
                    <Picture image={item.image} size="fill" className={styles.optionPicture} />
                    {(used || !unlocked) && (
                      <span className={styles.mark}>{used ? <UsedIcon aria-hidden="true" /> : <LockIcon aria-hidden="true" />}</span>
                    )}
                  </span>
                  <span className={styles.optionName}>{loc(item, 'name')}</span>
                  <span className={styles.optionStatus}>
                    {used ? t('room.using') : unlocked ? t('room.use') : t('room.lockedAt', { level: item.level })}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </Section>
    </Page>
  )
}
