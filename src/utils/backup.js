// =========================================================
// backup.js — สำรอง / กู้คืนความคืบหน้าเป็นไฟล์ JSON (ขั้นที่ 21ข) ฟังก์ชันล้วน (ทดสอบได้)
//   ไฟล์: { app: 'english-town', version: 1, createdAt: ISO, progress, reviewQueue }
// - สำรอง: XP, streak, บทที่จบ, Stage, การ์ดวลี, ห้อง, ความสนิท NPC, นาทีที่พูด, Boss + รายการทบทวน
//   ไม่สำรอง: ตั้งค่า, เสียง Speaking Check (ไฟล์ใหญ่ อยู่ใน IndexedDB), ภารกิจ/แผนของวันนี้ (สร้างใหม่ทุกวัน)
// - กู้คืน: ไฟล์มาจากภายนอก → หยิบเฉพาะช่องที่รู้จัก ตรวจชนิดทุกช่อง ช่องที่เสีย = ค่าเริ่มต้น
//   (ไฟล์แก้มือ/เสียหายต้องไม่ทำให้เว็บพังทุกครั้งที่เปิด เพราะค่าจะถูกเก็บลง localStorage)
// =========================================================
import { addDays } from './date'
import { REVIEW_INTERVALS } from './review'

export const BACKUP_APP = 'english-town'
export const BACKUP_VERSION = 1
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024

const MAX_XP = 100_000_000
const MAX_ENTRIES = 20_000

// ---------- ตัวตรวจชนิด (ไม่ผ่าน = ค่าสำรอง) ----------
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
const KEY = /^[A-Za-z0-9][\w.:-]{0,119}$/ // id ของบท/ข้อ/วลี (ไม่รับ __proto__)

const toInt = (value, fallback = 0, max = MAX_XP) =>
  Number.isFinite(value) && value >= 0 ? Math.min(max, Math.round(value)) : fallback
const toDate = (value) => (typeof value === 'string' && DATE.test(value) ? value : null)
const toKey = (value) => (typeof value === 'string' && KEY.test(value) ? value : null)
const keyList = (value) =>
  Array.isArray(value) ? [...new Set(value.map(toKey).filter((key) => key !== null))].slice(0, MAX_ENTRIES) : []

// object { key: ค่า } → ตรวจทีละคู่ (clean คืน undefined = ทิ้งคู่นั้น)
function cleanMap(value, isKey, clean) {
  if (!isObject(value)) return {}
  return Object.fromEntries(
    Object.entries(value)
      .slice(0, MAX_ENTRIES)
      .map(([key, entry]) => [key, isKey(key) ? clean(entry) : undefined])
      .filter(([, entry]) => entry !== undefined),
  )
}

const cleanLesson = (entry) => {
  if (!isObject(entry)) return undefined
  return {
    completed: entry.completed === true,
    bestScore: toInt(entry.bestScore, 0, 100),
    attempts: toInt(entry.attempts, 0, 1_000_000),
    completedAt: toDate(entry.completedAt),
    lastPlayedAt: toDate(entry.lastPlayedAt),
  }
}

// วันที่อนาคต (แก้มือ / นาฬิกาเครื่องเดิมเดินเร็ว) → ไม่เกินเพดาน ไม่งั้น streak ค้าง / ข้อทบทวนไม่ถึงกำหนดสักที
const upTo = (date, limit) => (date && date > limit ? limit : date)

/** ความคืบหน้าจากไฟล์ → ค่าที่ปลอดภัย ใส่ store ได้ (defaults = INITIAL_PROGRESS, today = 'YYYY-MM-DD') */
export function cleanProgress(raw, defaults, today) {
  const source = isObject(raw) ? raw : {}
  const streak = isObject(source.streak) ? source.streak : {}
  const freeze = isObject(source.streakFreeze) ? source.streakFreeze : {}
  const room = isObject(source.room) ? source.room : {}
  const boss = isObject(source.bossWeek) ? source.bossWeek : null
  const bossWeek =
    boss && toDate(boss.weekId) && toKey(boss.scenarioId)
      ? { weekId: boss.weekId, scenarioId: boss.scenarioId, done: boss.done === true }
      : null
  const stages = Array.isArray(source.unlockedStages)
    ? source.unlockedStages.filter((id) => Number.isInteger(id) && id >= 1 && id <= 7)
    : []
  const count = toInt(streak.count, 0, 100_000)

  return {
    ...defaults,
    xp: toInt(source.xp),
    streak: {
      count,
      lastActiveDate: upTo(toDate(streak.lastActiveDate), today),
      best: Math.max(count, toInt(streak.best, 0, 100_000)),
    },
    streakFreeze: { available: toInt(freeze.available, 1, 1), weekId: toDate(freeze.weekId) },
    unlockedStages: [...new Set([1, ...stages])].sort((a, b) => a - b),
    unlockedPlaces: [...new Set([...defaults.unlockedPlaces, ...keyList(source.unlockedPlaces)])],
    lessonProgress: cleanMap(source.lessonProgress, toKey, cleanLesson),
    collection: keyList(source.collection),
    room: { home: toKey(room.home), items: cleanMap(room.items, toKey, (id) => toKey(id) ?? undefined) },
    npcFriendship: cleanMap(source.npcFriendship, toKey, (points) =>
      Number.isFinite(points) && points >= 0 ? toInt(points, 0, 100_000) : undefined,
    ),
    speakingMinutes: cleanMap(source.speakingMinutes, toDate, (minutes) =>
      Number.isFinite(minutes) && minutes >= 0 && minutes <= 1440 ? minutes : undefined,
    ),
    studyMinutes: cleanMap(source.studyMinutes, toDate, (minutes) =>
      Number.isFinite(minutes) && minutes >= 0 && minutes <= 1440 ? minutes : undefined,
    ),
    bossWeek,
    lastVisitDate: upTo(toDate(source.lastVisitDate), today),
  }
}

/** รายการทบทวนจากไฟล์ → เฉพาะรายการที่ครบถ้วน id ไม่ซ้ำ */
export function cleanReviewQueue(raw, today) {
  if (!Array.isArray(raw)) return []
  const latestDue = addDays(today, REVIEW_INTERVALS.at(-1))
  const seen = new Set()
  return raw.slice(0, MAX_ENTRIES).flatMap((entry) => {
    if (!isObject(entry)) return []
    const lessonId = toKey(entry.lessonId)
    const itemId = toKey(entry.itemId)
    const dueDate = upTo(toDate(entry.dueDate), latestDue)
    if (!lessonId || !itemId || !dueDate) return []
    const id = `${lessonId}:${itemId}`
    if (seen.has(id)) return []
    seen.add(id)
    const box = toInt(entry.box, 0, REVIEW_INTERVALS.length - 1)
    const reviewedAt = toDate(entry.lastReviewedAt)
    return [
      {
        id,
        lessonId,
        itemId,
        box,
        dueDate,
        addedAt: toDate(entry.addedAt) ?? dueDate,
        ...(reviewedAt && { lastReviewedAt: reviewedAt }),
      },
    ]
  })
}

// ---------- สร้าง / อ่านไฟล์ ----------

// ช่องที่สำรอง (ไม่รวมฟังก์ชันของ store และของที่สร้างใหม่ทุกวัน)
const SAVED_KEYS = [
  'xp',
  'streak',
  'streakFreeze',
  'unlockedStages',
  'unlockedPlaces',
  'lessonProgress',
  'collection',
  'room',
  'npcFriendship',
  'speakingMinutes',
  'studyMinutes',
  'bossWeek',
  'lastVisitDate',
]

export function createBackup(progress, reviewQueue, now = new Date()) {
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    createdAt: now.toISOString(),
    progress: Object.fromEntries(SAVED_KEYS.map((key) => [key, progress[key]])),
    reviewQueue,
  }
}

export const backupFileName = (today) => `english-town-${today}.json`

// ตัวเลขสรุป (ให้ผู้ใช้เทียบก่อนกู้คืน)
export const summarize = (progress, reviewQueue) => ({
  xp: progress.xp,
  lessons: Object.values(progress.lessonProgress).filter((lesson) => lesson?.completed).length,
  cards: progress.collection.length,
  review: reviewQueue.length,
})

/**
 * อ่านไฟล์สำรอง
 * @returns { ok: true, createdAt: Date | null, progress, reviewQueue, summary } | { ok: false, error: 'invalid' | 'newer' }
 */
export function parseBackup(text, defaults, today) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, error: 'invalid' }
  }
  if (!isObject(data) || data.app !== BACKUP_APP || !isObject(data.progress)) return { ok: false, error: 'invalid' }
  if (!Number.isInteger(data.version) || data.version < 1) return { ok: false, error: 'invalid' }
  if (data.version > BACKUP_VERSION) return { ok: false, error: 'newer' }
  const progress = cleanProgress(data.progress, defaults, today)
  const reviewQueue = cleanReviewQueue(data.reviewQueue, today)
  const createdAt = new Date(typeof data.createdAt === 'string' ? data.createdAt : NaN)
  return {
    ok: true,
    createdAt: Number.isNaN(createdAt.getTime()) ? null : createdAt,
    progress,
    reviewQueue,
    summary: summarize(progress, reviewQueue),
  }
}
