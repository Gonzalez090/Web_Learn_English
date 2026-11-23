// =========================================================
// speakingCheck.js — Speaking Check (ส่วนที่ 9, ขั้นที่ 19) ฟังก์ชันล้วน (ทดสอบได้)
// - ทุก 30 วัน ดูภาพชุดเดิม (game.json speakingCheck.pictures) แล้วพูดบรรยาย 1 นาที
// - สถิติ: คำต่อนาที (จากข้อความที่ถอดเสียงได้), คำไม่ซ้ำ, วลี (chunk) ที่ใช้, จำนวนการหยุดนาน (จากระดับเสียง)
// - กำหนดการ: ครั้งถัดไป = 30 วันหลังครั้งล่าสุด / milestone 30 · 90 · 180 วัน นับจากวันที่อัดครั้งแรก (= วันที่ 1)
// ผลการอัดแต่ละครั้ง (เก็บใน IndexedDB — utils/checkStore.js):
//   { id, date: 'YYYY-MM-DD', createdAt: ms, durationMs, mimeType, blob, transcript,
//     stats: { words, uniqueWords, wpm, chunks: [ข้อความวลี], pauses, voicedMs }, rewarded }
// =========================================================
import { normalizeWord, tokenize } from './compareWords'
import { addDays, daysBetween } from './date'

export const CHECK_INTERVAL_DAYS = 30
export const RECORD_MS = 60000 // พูดบรรยาย 1 นาที
export const LEVEL_INTERVAL_MS = 100 // วัดระดับเสียงทุก 100 ms
export const LONG_PAUSE_MS = 2000 // เงียบตั้งแต่ 2 วินาที (ระหว่างที่พูดอยู่) = หยุดนาน 1 ครั้ง
export const MIN_VOICED_MS = 3000 // พูดจริงไม่ถึง 3 วินาที และได้ยินไม่ถึง MIN_WORDS คำ = สั้นไป ไม่บันทึก
export const MIN_WORDS = 5
export const SPEAKING_CHECK_XP = 50 // อัดตอนถึงกำหนด (พูดเองไม่ดูข้อความ 1 นาที) — อัดก่อนกำหนดไม่ได้ XP

// ---------- กำหนดการ ----------

// เรียงผลการอัดจากเก่า → ใหม่
export const sortChecks = (checks = []) => [...checks].sort((a, b) => a.createdAt - b.createdAt)

/**
 * สถานะของ Speaking Check วันนี้
 * @returns { count, first, latest, due (ถึงกำหนดอัดแล้ว), nextDate, daysLeft, dayNumber (วันที่เท่าไรนับจากครั้งแรก, ยังไม่เคย = 0) }
 */
export function checkSchedule(checks, today) {
  const sorted = sortChecks(checks)
  const first = sorted[0] ?? null
  const latest = sorted.at(-1) ?? null
  if (!latest) return { count: 0, first, latest, due: true, nextDate: today, daysLeft: 0, dayNumber: 0 }
  const nextDate = addDays(latest.date, CHECK_INTERVAL_DAYS)
  const daysLeft = Math.max(0, daysBetween(today, nextDate))
  return {
    count: sorted.length,
    first,
    latest,
    due: daysLeft === 0,
    nextDate,
    daysLeft,
    dayNumber: daysBetween(first.date, today) + 1,
  }
}

/**
 * สถานะ milestone (game.json milestones[] { id, day, … }) ตามวันที่นับจากครั้งแรก
 * @returns milestones + { status: 'reached' | 'next' | 'later', daysLeft }
 *   reached = ผ่านวันนั้นมาแล้ว / next = เป้าถัดไป / later = ยังอีกนาน
 */
export function milestoneStatus(milestones = [], dayNumber = 0) {
  let nextFound = false
  return [...milestones]
    .sort((a, b) => a.day - b.day)
    .map((milestone) => {
      if (dayNumber > 0 && dayNumber >= milestone.day) return { ...milestone, status: 'reached', daysLeft: 0 }
      const daysLeft = dayNumber > 0 ? milestone.day - dayNumber : milestone.day
      const status = nextFound ? 'later' : 'next'
      nextFound = true
      return { ...milestone, status, daysLeft }
    })
}

// ---------- สถิติจากข้อความ ----------

// ข้อความ → คำย่อยที่ใช้เทียบ (ขยายรูปย่อ: there's → there is, gonna → going to)
const tokensOf = (text) => tokenize(text).flatMap((unit) => unit.tokens)

// วลีที่ใช้ (chunk) — entry = 'there is/there are' (/ = แบบไหนก็ได้) → ตรงเมื่อคำเรียงติดกันครบ
// @returns [{ entry, form: แบบที่พูดจริง (แบบแรกที่ตรง) }] เรียงตามรายการ chunks
export function matchChunks(transcript, chunks = []) {
  const joined = ` ${tokensOf(transcript).join(' ')} `
  return chunks.flatMap((entry) => {
    const form = String(entry)
      .split('/')
      .map((text) => text.trim())
      .find((text) => {
        const normalized = text.split(/\s+/).flatMap(normalizeWord).join(' ')
        return normalized && joined.includes(` ${normalized} `)
      })
    return form ? [{ entry, form }] : []
  })
}

export const findChunks = (transcript, chunks = []) => matchChunks(transcript, chunks).map((match) => match.entry)

// ชื่อวลีที่แสดง (i → I) — ส่ง entry ทั้งก้อนได้ (ใช้แบบแรก)
export const chunkLabel = (entry) =>
  String(entry ?? '')
    .split('/')[0]
    .trim()
    .replace(/\bi\b/g, 'I')

// ---------- สถิติจากระดับเสียง ----------

// ค่าที่ตำแหน่งร้อยละ p ของชุดตัวเลข (เรียงแล้ว)
const percentile = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))]

/**
 * แยกช่วงพูด / ช่วงเงียบจากระดับเสียง (RMS 0–1 ทุก intervalMs)
 * เกณฑ์ปรับตามเครื่อง: เสียงพื้น (ร้อยละ 10) + 20% ของช่วงถึงเสียงดัง (ร้อยละ 95) — ไมค์ดัง/เบาต่างกันก็ใช้ได้
 * @returns { voicedMs, pauses (เงียบ ≥ minPauseMs ระหว่างที่พูดอยู่ — ไม่นับเงียบก่อนเริ่มพูด/หลังพูดจบ), longestPauseMs }
 */
export function analyzeLevels(levels = [], { intervalMs = LEVEL_INTERVAL_MS, minPauseMs = LONG_PAUSE_MS } = {}) {
  const empty = { voicedMs: 0, pauses: 0, longestPauseMs: 0 }
  if (!levels.length) return empty
  const sorted = [...levels].sort((a, b) => a - b)
  const floor = percentile(sorted, 0.1)
  const peak = percentile(sorted, 0.95)
  if (peak - floor < 0.005) return empty // เงียบทั้งหมด (หรือเสียงเท่ากันตลอด) = ไม่ได้พูด
  const threshold = Math.max(0.004, floor + (peak - floor) * 0.2)
  const voiced = levels.map((level) => level >= threshold)
  const firstVoiced = voiced.indexOf(true)
  const lastVoiced = voiced.lastIndexOf(true)

  let pauses = 0
  let longest = 0
  let run = 0
  for (let index = firstVoiced; index <= lastVoiced; index += 1) {
    if (voiced[index]) {
      if (run * intervalMs >= minPauseMs) pauses += 1
      longest = Math.max(longest, run * intervalMs)
      run = 0
    } else {
      run += 1
    }
  }
  return { voicedMs: voiced.filter(Boolean).length * intervalMs, pauses, longestPauseMs: longest }
}

/**
 * สถิติของการอัด 1 ครั้ง
 * @param transcript ข้อความที่ถอดเสียงได้ ('' = ถอดไม่ได้ → words/uniqueWords/wpm/chunks = null)
 * @param durationMs ความยาวที่อัดจริง
 */
export function computeStats({ transcript = '', durationMs = 0, levels = [], intervalMs = LEVEL_INTERVAL_MS, chunks = [] }) {
  const units = tokenize(transcript)
  const { voicedMs, pauses } = analyzeLevels(levels, { intervalMs })
  const hasText = units.length > 0
  const minutes = Math.max(durationMs, 1000) / 60000
  return {
    words: hasText ? units.length : null,
    uniqueWords: hasText ? new Set(units.flatMap((unit) => unit.tokens)).size : null,
    wpm: hasText ? Math.round(units.length / minutes) : null,
    // วลีนับจากข้อความ → ถอดไม่ได้ = ไม่มีข้อมูล (null) ไม่ใช่ 0 / แสดงแบบที่พูดจริง ('on the blanket' ไม่ใช่ 'on the grass')
    chunks: hasText ? matchChunks(transcript, chunks).map((match) => chunkLabel(match.form)) : null,
    pauses,
    voicedMs,
  }
}

// สั้นเกินกว่าจะเป็นผลวัด (ไม่บันทึก ให้ลองใหม่)
export const isTooShort = (stats) => stats.voicedMs < MIN_VOICED_MS && (stats.words ?? 0) < MIN_WORDS

// ---------- เทียบผล ----------

// ตัวเลขที่ยิ่งมากยิ่งดี / ยิ่งน้อยยิ่งดี (การหยุดนาน)
export const STAT_KEYS = ['wpm', 'words', 'uniqueWords', 'chunks', 'pauses']
const LOWER_IS_BETTER = new Set(['pauses'])

// ค่าตัวเลขของสถิติ (chunks = จำนวนวลี) — ไม่มีค่า = null
export const statValue = (stats, key) => {
  const value = stats?.[key]
  if (Array.isArray(value)) return value.length
  return Number.isFinite(value) ? value : null
}

/**
 * เทียบสถิติ 2 ครั้ง
 * @returns { [key]: { from, to, delta, better (true = ดีขึ้น, false = แย่ลง, null = เท่าเดิม/ไม่มีข้อมูล) } }
 */
export function compareStats(fromStats, toStats) {
  return Object.fromEntries(
    STAT_KEYS.map((key) => {
      const from = statValue(fromStats, key)
      const to = statValue(toStats, key)
      if (from === null || to === null) return [key, { from, to, delta: null, better: null }]
      const delta = to - from
      const better = delta === 0 ? null : LOWER_IS_BETTER.has(key) ? delta < 0 : delta > 0
      return [key, { from, to, delta, better }]
    }),
  )
}
