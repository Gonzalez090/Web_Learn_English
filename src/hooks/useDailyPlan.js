// =========================================================
// useDailyPlan — แผนของวันนี้ (ขั้นที่ 18) ใช้ทั้งหน้าแผน (/plan) และการ์ดบนหน้าแรก
// - สร้าง/อัปเดตแผนเมื่อเปิดหน้า เปลี่ยนวัน เปลี่ยนเป้า (et-settings.dailyGoal) หรือจำนวนรายการทบทวนเปลี่ยน
// - คืน null ระหว่างรอ (แผนที่เก็บไว้ยังไม่ใช่ของวันนี้)
// =========================================================
import { useEffect } from 'react'
import { useProgressStore } from '../store/progressStore'
import { useReviewStore } from '../store/reviewStore'
import { useSettingsStore } from '../store/settingsStore'
import { dueEntries } from '../utils/review'
import { todayKey } from '../utils/date'

export function useDailyPlan() {
  const goal = useSettingsStore((state) => state.dailyGoal)
  const queue = useReviewStore((state) => state.reviewQueue)
  const plan = useProgressStore((state) => state.dailyPlan)
  const refreshDailyPlan = useProgressStore((state) => state.refreshDailyPlan)
  const today = todayKey()
  const reviewDue = dueEntries(queue, today).length

  useEffect(() => {
    refreshDailyPlan({ goal, reviewDue })
  }, [refreshDailyPlan, goal, reviewDue, today])

  return plan?.date === today ? plan : null
}
