// =========================================================
// accountStore — บัญชี Google + ซิงก์ความคืบหน้า (ขั้นที่ 31) — ไม่บันทึกลง localStorage เอง
//   status: 'off' (ไม่ได้ตั้งค่าระบบบัญชี) | 'guest' | 'loading' | 'signedIn'
//   sync:   'idle' | 'syncing' | 'synced' | 'offline' | 'error' | 'outdated' (เว็บในแท็บนี้เก่ากว่าข้อมูล)
// ซิงก์เมื่อ: เข้าระบบ, ความคืบหน้าเปลี่ยน (ไม่ถี่กว่า 30 วินาที), กลับมาที่แท็บ, ก่อนซ่อนแท็บ, เน็ตกลับมา
// เซิร์ฟเวอร์ล่ม/เน็ตหลุด → เรียนต่อได้ ข้อมูลอยู่ในเครื่อง รอบหน้าซิงก์ใหม่เอง
// =========================================================
import { create } from 'zustand'
import { lessonList, stages } from '../data'
import { cleanProgress, cleanReviewQueue, createBackup } from '../utils/backup'
import { todayKey } from '../utils/date'
import { computeUnlockedStages } from '../utils/progress'
import { createSyncEngine, NewerDataError, SyncAborted } from '../utils/syncEngine'
import {
  AUTH_STORAGE_KEY,
  hasStoredSession,
  isAccountEnabled,
  isInAppBrowser,
  readAuthReturn,
  SYNC_STORAGE_KEY,
} from '../utils/accountConfig'
import { INITIAL_PROGRESS, useProgressStore } from './progressStore'
import { useReviewStore } from './reviewStore'

const PUSH_EVERY_MS = 30_000
const PULL_AFTER_MS = 60_000
const RETRY_MS = 60_000
const SIGN_OUT_SYNC_MS = 6_000

export const useAccountStore = create(() => ({
  status: isAccountEnabled ? (hasStoredSession() ? 'loading' : 'guest') : 'off',
  user: null, // { id, email, name }
  sync: 'idle',
  lastSyncedAt: null, // เวลา (ms) ที่ซิงก์สำเร็จล่าสุด
  error: null, // 'signIn' | 'cancelled' | 'inApp' | 'delete' — ข้อความในไฟล์ภาษา account.error.*
}))

const set = useAccountStore.setState
const get = useAccountStore.getState

// ---------- ความคืบหน้าในเครื่อง ----------
const clean = (data) => ({
  progress: pickSaved(cleanProgress(data?.progress, INITIAL_PROGRESS, todayKey())),
  reviewQueue: cleanReviewQueue(data?.reviewQueue, todayKey()),
})
// เฉพาะช่องที่ซิงก์ (ชุดเดียวกับไฟล์สำรอง — ไม่รวมภารกิจ/แผนของวันนี้)
const pickSaved = (progress) => createBackup(progress, []).progress

const local = {
  snapshot: () => clean({ progress: useProgressStore.getState(), reviewQueue: useReviewStore.getState().reviewQueue }),
  apply: (snapshot, { switched }) => {
    // บทที่จบจากสองเครื่องรวมกันแล้วอาจครบ Stage พอดี
    const { unlockedStages } = computeUnlockedStages(
      stages,
      lessonList,
      snapshot.progress.unlockedStages,
      snapshot.progress.lessonProgress,
    )
    const progress = { ...snapshot.progress, unlockedStages }
    // สลับบัญชี → เริ่มภารกิจ/แผนของวันใหม่ด้วย / บัญชีเดิม → ของวันนี้ในเครื่องคงไว้
    if (switched) useProgressStore.getState().restoreProgress(progress)
    else useProgressStore.setState(progress)
    useReviewStore.getState().restoreReview(snapshot.reviewQueue)
  },
}

const meta = {
  read: () => {
    try {
      return JSON.parse(localStorage.getItem(SYNC_STORAGE_KEY)) ?? {}
    } catch {
      return {}
    }
  },
  write: (value) => localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(value)),
}

// ---------- โหลดไลบรารีเมื่อต้องใช้ ----------
let cloud = null
const loadCloud = async () => {
  cloud ??= await import('../utils/cloudApi')
  return cloud
}
const lazyApi = Object.fromEntries(
  ['head', 'fetch', 'insert', 'update'].map((name) => [name, async (...args) => (await loadCloud()).progressApi[name](...args)]),
)

const engine = createSyncEngine({ api: lazyApi, meta, local, clean, empty: () => clean({}) })

// หลายแท็บ: ซิงก์ทีละแท็บ และอ่านค่าล่าสุดจาก localStorage ก่อนเสมอ
function exclusively(task) {
  const run = () => {
    useProgressStore.persist.rehydrate()
    useReviewStore.persist.rehydrate()
    return task()
  }
  return navigator.locks ? navigator.locks.request(SYNC_STORAGE_KEY, run) : run()
}

// ---------- ซิงก์ ----------
let running = null
let wantPull = false
let pushTimer = null
let lastAttempt = 0
let lastPull = 0

const uidNow = () => get().user?.id ?? null

async function runSync(pull) {
  const uid = uidNow()
  if (!uid) return
  lastAttempt = Date.now()
  set({ sync: 'syncing' })
  try {
    await exclusively(() => engine.sync(uid, { pull, isCurrent: () => uidNow() === uid }))
    if (pull) lastPull = Date.now()
    set({ sync: 'synced', lastSyncedAt: Date.now() })
  } catch (error) {
    if (error instanceof SyncAborted) return
    if (error instanceof NewerDataError) {
      set({ sync: 'outdated' })
      return
    }
    set({ sync: navigator.onLine === false ? 'offline' : 'error' })
    schedule(RETRY_MS)
  }
}

/** ซิงก์ตอนนี้ (ถ้ากำลังซิงก์อยู่ → ต่อคิวอีก 1 รอบ) */
export function syncNow({ pull = true } = {}) {
  clearTimeout(pushTimer)
  pushTimer = null
  if (running) {
    wantPull ||= pull
    return running.then(() => (wantPull ? syncNow({ pull: true }) : undefined))
  }
  wantPull = false
  running = runSync(pull).finally(() => {
    running = null
    // ระหว่างซิงก์ ผู้เรียนทำเพิ่ม → ส่งรอบหน้า
    if (uidNow() && get().sync === 'synced' && engine.isDirty()) schedule(PUSH_EVERY_MS)
  })
  return running
}

function schedule(delay) {
  if (pushTimer !== null || !uidNow()) return
  pushTimer = setTimeout(() => {
    pushTimer = null
    if (document.visibilityState === 'hidden' && !engine.isDirty()) return
    syncNow({ pull: get().sync !== 'synced' })
  }, delay)
}

function onProgressChange() {
  if (!uidNow() || running || get().sync === 'outdated') return
  schedule(Math.max(1000, PUSH_EVERY_MS - (Date.now() - lastAttempt)))
}

// ---------- เซสชัน ----------
const toUser = (user) => ({
  id: user.id,
  email: user.email ?? '',
  name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? '',
})

let connected = false
async function connect() {
  if (connected) return
  connected = true
  set({ status: 'loading' })
  try {
    const { client } = await loadCloud()
    client.auth.onAuthStateChange((event, session) => {
      const user = session?.user
      if (!user) {
        set({ status: 'guest', user: null, sync: 'idle', lastSyncedAt: null })
        return
      }
      const isNew = uidNow() !== user.id
      set({ status: 'signedIn', user: toUser(user), error: null })
      // ห้ามเรียก Supabase ในนี้ตรง ๆ (ไลบรารีล็อกอยู่) → ต่อคิวออกไป
      if (isNew) setTimeout(() => syncNow({ pull: true }))
    })
    const { error } = await client.auth.initialize()
    if (error && !uidNow()) set({ status: 'guest', error: 'signIn' })
  } catch {
    // โหลดไลบรารีไม่ได้ (เน็ตหลุด) → ยังเรียนได้ ลองใหม่เมื่อเน็ตกลับมา
    connected = false
    set({ status: 'guest', sync: 'offline' })
  }
}

/** เรียกครั้งเดียวตอนเปิดเว็บ (main.jsx) */
export function startAccount() {
  if (!isAccountEnabled) return
  const { hasCode, error } = readAuthReturn(window.location.search, window.location.hash)
  if (error) {
    set({ error: error === 'access_denied' ? 'cancelled' : 'signIn' })
    window.history.replaceState(window.history.state, '', window.location.pathname)
  }
  if (hasCode || hasStoredSession()) connect()

  useProgressStore.subscribe(onProgressChange)
  useReviewStore.subscribe(onProgressChange)
  document.addEventListener('visibilitychange', () => {
    if (!uidNow()) return
    if (document.visibilityState === 'hidden') {
      if (engine.isDirty()) syncNow({ pull: false })
    } else if (Date.now() - lastPull > PULL_AFTER_MS) {
      syncNow({ pull: true })
    }
  })
  window.addEventListener('online', () => {
    if (uidNow()) syncNow({ pull: true })
    else if (hasStoredSession()) connect()
  })
  // แท็บอื่นเพิ่งล็อกอิน
  window.addEventListener('storage', (event) => {
    if (event.key === AUTH_STORAGE_KEY && event.newValue) connect()
  })
}

// ---------- ปุ่มต่าง ๆ ----------
export async function signIn() {
  if (isInAppBrowser(navigator.userAgent)) {
    set({ error: 'inApp' })
    return
  }
  set({ error: null, status: 'loading' })
  try {
    const { signInWithGoogle } = await loadCloud()
    await signInWithGoogle(`${window.location.origin}/profile`)
    // กำลังไปหน้า Google — กด Back กลับมา (bfcache) ปุ่มต้องกดได้อีก
    window.addEventListener('pageshow', () => !uidNow() && set({ status: 'guest' }), { once: true })
  } catch {
    set({ status: 'guest', error: 'signIn' })
  }
}

// ออกจากระบบ: ส่งของที่ค้างขึ้นบัญชีก่อน (รอไม่นาน) — ความคืบหน้ายังอยู่ในเครื่อง
export async function signOut() {
  set({ status: 'loading' })
  await Promise.race([syncNow({ pull: false }), new Promise((done) => setTimeout(done, SIGN_OUT_SYNC_MS))])
  try {
    await (await loadCloud()).signOut()
  } catch {
    // เซิร์ฟเวอร์ไม่ตอบ → ลืมเซสชันในเครื่องนี้แทน
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }
  set({ status: 'guest', user: null, sync: 'idle', lastSyncedAt: null })
}

// ลบบัญชี + ข้อมูลบนเซิร์ฟเวอร์ (ความคืบหน้าในเครื่องยังอยู่) @returns สำเร็จไหม
export async function deleteAccount() {
  const uid = uidNow()
  try {
    const api = await loadCloud()
    if (running) await running
    await api.deleteAccount()
    set({ user: null, status: 'guest', sync: 'idle', lastSyncedAt: null })
    if (meta.read().owner === uid) engine.forget()
    await api.signOut().catch(() => localStorage.removeItem(AUTH_STORAGE_KEY))
    return true
  } catch {
    return false
  }
}

// รีเซ็ต/กู้คืนจากไฟล์ (ResetSection, BackupSection) → ล็อกอินอยู่ = แทนที่ในบัญชีด้วย
export function progressReplaced() {
  if (!isAccountEnabled) return
  engine.markReplaced(uidNow() !== null || hasStoredSession())
  if (uidNow()) syncNow({ pull: true })
}
