// =========================================================
// syncMerge.js — รวมความคืบหน้า "ในเครื่อง" กับ "ในบัญชี" (ขั้นที่ 31) ฟังก์ชันล้วน ทดสอบง่าย
//   snapshot = { progress, reviewQueue } ที่ผ่าน cleanProgress / cleanReviewQueue แล้ว (utils/backup.js)
//   base = snapshot ตอนซิงก์ล่าสุด (null = เพิ่งผูกบัญชีครั้งแรก)
// หลัก: ความคืบหน้ามีแต่เพิ่ม ไม่ถอยหลัง (บทที่จบ การ์ด Stage รวมกัน / คะแนนเอาที่ดีที่สุด)
//   - ตัวเลขสะสม (XP, นาที, ความสนิท): มี base = ของบัญชี + ส่วนที่เครื่องนี้ทำเพิ่มตั้งแต่ซิงก์ล่าสุด / ไม่มี base = ค่าที่มากกว่า
//     (ไม่บวกสองฝั่งตรง ๆ ไม่งั้นซิงก์ซ้ำแล้วตัวเลขพุ่ง)
//   - รีเซ็ต/กู้คืนไฟล์ ไม่ผ่านการรวม — syncEngine แทนที่ทั้งก้อน
// =========================================================
import { addDays, daysBetween } from './date'

// เทียบค่า (ไม่สนลำดับ key — ฐานข้อมูลเรียง key ใหม่)
export function same(a, b) {
  if (a === b) return true
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  const keysA = Object.keys(a)
  if (keysA.length !== Object.keys(b).length) return false
  return keysA.every((key) => Object.hasOwn(b, key) && same(a[key], b[key]))
}

const union = (a, b) => [...new Set([...a, ...b])]
const latest = (a, b) => ((a ?? '') >= (b ?? '') ? a : b) ?? null
const earliest = (a, b) => (a && b ? (a < b ? a : b) : (a ?? b ?? null))

// ตัวเลขสะสม
const total = (local, remote, base) =>
  base === undefined ? Math.max(local, remote) : remote + Math.max(0, local - base)

function mergeTotals(local, remote, base, cap = Infinity) {
  return Object.fromEntries(
    union(Object.keys(remote), Object.keys(local)).map((key) => [
      key,
      Math.min(cap, total(local[key] ?? 0, remote[key] ?? 0, base ? (base[key] ?? 0) : undefined)),
    ]),
  )
}

function mergeLesson(a, b) {
  if (!a || !b) return a ?? b
  return {
    completed: a.completed || b.completed,
    bestScore: Math.max(a.bestScore, b.bestScore),
    attempts: Math.max(a.attempts, b.attempts),
    completedAt: earliest(a.completedAt, b.completedAt),
    lastPlayedAt: latest(a.lastPlayedAt, b.lastPlayedAt),
  }
}

/** streak 2 เครื่อง: เอาวันล่าสุด และถ้าช่วงวันต่อกัน (เรียนสลับเครื่อง) นับต่อกันให้ */
export function mergeStreak(a, b) {
  const best = Math.max(a.best, b.best, a.count, b.count)
  if (!a.lastActiveDate || !b.lastActiveDate) {
    const one = a.lastActiveDate ? a : b
    return { ...one, best }
  }
  const [older, newer] = a.lastActiveDate <= b.lastActiveDate ? [a, b] : [b, a]
  const startOf = (streak) => addDays(streak.lastActiveDate, 1 - Math.max(1, streak.count))
  const olderStart = startOf(older)
  const newerStart = startOf(newer)
  const touching = older.lastActiveDate >= addDays(newerStart, -1)
  const extra = touching ? Math.max(0, daysBetween(olderStart, newerStart)) : 0
  const count = older.lastActiveDate === newer.lastActiveDate ? Math.max(a.count, b.count) : newer.count + Math.min(extra, older.count)
  return { count, lastActiveDate: newer.lastActiveDate, best: Math.max(best, count) }
}

function mergeFreeze(a, b) {
  if ((a.weekId ?? '') === (b.weekId ?? '')) return { ...a, available: Math.min(a.available, b.available) }
  return (a.weekId ?? '') > (b.weekId ?? '') ? a : b
}

function mergeBoss(a, b) {
  if (!a || !b) return a ?? b ?? null
  if (a.weekId !== b.weekId) return a.weekId > b.weekId ? a : b
  return a.done ? a : b
}

const isDefaultRoom = (room) => room.home === null && Object.keys(room.items).length === 0

function mergeRoom(local, remote, base) {
  if (base) return same(local, base) ? remote : local
  return isDefaultRoom(local) ? remote : local
}

// รายการทบทวน: ใครแตะล่าสุดใช้ของคนนั้น เท่ากัน → รอบที่ต่ำกว่า (ได้ทบทวนบ่อยกว่า)
function newerEntry(a, b) {
  const touched = (entry) => [entry.lastReviewedAt, entry.addedAt].filter(Boolean).sort().at(-1) ?? ''
  if (touched(a) !== touched(b)) return touched(a) > touched(b) ? a : b
  return a.box <= b.box ? a : b
}

export function mergeQueue(local, remote, base) {
  const byId = (queue) => new Map((queue ?? []).map((entry) => [entry.id, entry]))
  const here = byId(local)
  const there = byId(remote)
  const before = byId(base)
  return union([...there.keys()], [...here.keys()]).flatMap((id) => {
    const a = here.get(id)
    const b = there.get(id)
    const was = before.get(id)
    if (a && b) {
      if (was && same(a, was)) return [b]
      if (was && same(b, was)) return [a]
      return [newerEntry(a, b)]
    }
    const only = a ?? b
    // เคยมีทั้งสองฝั่ง แล้วอีกฝั่งจำได้แล้ว (เอาออก) และฝั่งนี้ไม่ได้แตะเพิ่ม → เอาออกด้วย
    return was && same(only, was) ? [] : [only]
  })
}

/** รวม 2 ฝั่ง → snapshot ใหม่ (ไม่แก้ของเดิม) */
export function mergeSnapshots(local, remote, base = null) {
  const a = local.progress
  const b = remote.progress
  const was = base?.progress
  const progress = {
    ...b,
    xp: total(a.xp, b.xp, was?.xp),
    streak: mergeStreak(a.streak, b.streak),
    streakFreeze: mergeFreeze(a.streakFreeze, b.streakFreeze),
    unlockedStages: union(b.unlockedStages, a.unlockedStages).sort((x, y) => x - y),
    unlockedPlaces: union(b.unlockedPlaces, a.unlockedPlaces),
    lessonProgress: Object.fromEntries(
      union(Object.keys(b.lessonProgress), Object.keys(a.lessonProgress)).map((id) => [
        id,
        mergeLesson(a.lessonProgress[id], b.lessonProgress[id]),
      ]),
    ),
    collection: union(b.collection, a.collection),
    room: mergeRoom(a.room, b.room, was?.room),
    npcFriendship: mergeTotals(a.npcFriendship, b.npcFriendship, was?.npcFriendship),
    speakingMinutes: mergeTotals(a.speakingMinutes, b.speakingMinutes, was?.speakingMinutes, 1440),
    studyMinutes: mergeTotals(a.studyMinutes, b.studyMinutes, was?.studyMinutes, 1440),
    bossWeek: mergeBoss(a.bossWeek, b.bossWeek),
    lastVisitDate: latest(a.lastVisitDate, b.lastVisitDate),
  }
  return { progress, reviewQueue: mergeQueue(local.reviewQueue, remote.reviewQueue, base?.reviewQueue) }
}
