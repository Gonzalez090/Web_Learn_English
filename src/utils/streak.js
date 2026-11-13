// =========================================================
// streak.js — เรียนต่อเนื่องรายวัน + Streak Freeze (ส่วนที่ 8.1)
// - วันไหนได้ XP จากการเรียน = วันนั้น "เรียนแล้ว"
// - เรียนวันถัดไป → streak +1 / หายไปเกิน 1 วัน → เริ่มนับใหม่ที่ 1
// - Streak Freeze 1 ครั้งต่อสัปดาห์ (ได้ใหม่ทุกวันจันทร์): พลาดไป 1 วัน streak ยังไม่ขาด
// วันที่ทั้งหมด 'YYYY-MM-DD' ตามเวลาเครื่อง
// =========================================================
import { daysBetween, weekStartKey } from './date'

export const FREEZE_PER_WEEK = 1

// เข้าสัปดาห์ใหม่ → ได้ Freeze ครบอีกครั้ง
export function refreshFreeze(freeze, today) {
  const weekId = weekStartKey(today)
  if (freeze?.weekId === weekId) return freeze
  return { available: FREEZE_PER_WEEK, weekId }
}

/**
 * บันทึกว่าวันนี้เรียนแล้ว
 * @returns { streak: { count, lastActiveDate, best }, streakFreeze, usedFreeze }
 */
export function recordActivity(streak, freeze, today) {
  const fresh = refreshFreeze(freeze, today)
  const count = streak?.count ?? 0
  const best = streak?.best ?? count
  const last = streak?.lastActiveDate ?? null
  const gap = last ? daysBetween(last, today) : null

  // วันนี้นับไปแล้ว หรือเวลาเครื่องถอยหลัง → ไม่เปลี่ยน streak
  if (gap !== null && gap <= 0) return { streak, streakFreeze: fresh, usedFreeze: false }

  let next = 1
  let streakFreeze = fresh
  let usedFreeze = false
  if (gap === 1) {
    next = count + 1
  } else if (gap === 2 && fresh.available > 0) {
    // พลาดไป 1 วัน → ใช้ Freeze แทนวันนั้น
    next = count + 1
    usedFreeze = true
    streakFreeze = { ...fresh, available: fresh.available - 1 }
  }

  return {
    streak: { count: next, lastActiveDate: today, best: Math.max(best, next) },
    streakFreeze,
    usedFreeze,
  }
}

// streak ที่แสดงตอนนี้ (ยังไม่ได้เรียนวันนี้ก็ยังนับ ถ้ายังต่อได้)
export function displayStreak(streak, freeze, today) {
  const last = streak?.lastActiveDate
  if (!last || !streak.count) return 0
  const gap = daysBetween(last, today)
  if (gap <= 1) return streak.count
  if (gap === 2 && refreshFreeze(freeze, today).available > 0) return streak.count
  return 0
}

// วันนี้เรียนไปแล้วหรือยัง
export const studiedToday = (streak, today) => streak?.lastActiveDate === today
