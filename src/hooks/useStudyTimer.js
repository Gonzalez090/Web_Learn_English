// =========================================================
// useStudyTimer — นับเวลาเรียนของวัน + ชวนพัก (ใช้ใน AppLayout ที่เดียว)
// - นับเฉพาะตอนเรียนจริง + หน้าเว็บเปิดอยู่ → เพิ่มเวลาทุก 15 วินาที (utils/studyTime.js)
//     'play'     กดเข้าเรียนแล้ว ตัวเล่น/เกมทำงานอยู่ (useStudyActivity) → ยังแตะ/พิมพ์อยู่
//     'practice' หน้าที่ฝึกได้เลยโดยไม่มีปุ่มเริ่ม → เพิ่งกดฟัง/พูด (แค่เลื่อนดูไม่นับ)
//     null       หน้าหลัก/หน้ารายการ/หน้าเริ่ม/หน้าสรุป → ไม่นับ
// - เรียนต่อเนื่องครบ 20 นาที → ชวนพักตอน "ออกจากหน้าเรียน" (จบบท/กลับหน้ารายการ) ไม่ขัดจังหวะกลางบท
// =========================================================
import { useEffect, useSyncExternalStore } from 'react'
import { useProgressStore } from '../store/progressStore'
import { useToastStore } from '../store/toastStore'
import { isActive, subscribeActivity, subscribePractice } from '../utils/studyActivity'
import {
  addToSession,
  countedMs,
  EMPTY_SESSION,
  IDLE_MS,
  isPracticePath,
  needsBreak,
  PRACTICE_IDLE_MS,
  TICK_MS,
} from '../utils/studyTime'

// รอบการเรียนปัจจุบัน (อยู่ในหน่วยความจำ: รีโหลดหน้า = เริ่มรอบใหม่)
let session = EMPTY_SESSION

const INPUT_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchmove']

export function useStudyTimer(pathname) {
  const playing = useSyncExternalStore(subscribeActivity, isActive, isActive)
  let mode = null
  if (playing) mode = 'play'
  else if (isPracticePath(pathname)) mode = 'practice'

  useEffect(() => {
    if (mode === null) {
      if (needsBreak(session, Date.now())) {
        session = EMPTY_SESSION
        useToastStore.getState().show({ kind: 'break' })
      }
      return undefined
    }

    const practice = mode === 'practice'
    const idleMs = practice ? PRACTICE_IDLE_MS : IDLE_MS
    let from = Date.now()
    let lastInput = practice ? -Infinity : from // หน้าฝึก: ยังไม่กดฟัง/พูด = ยังไม่เริ่ม
    let visible = !document.hidden

    // นับช่วงที่ผ่านมา (visible = สถานะของช่วงนั้น ไม่ใช่สถานะใหม่)
    function count() {
      const now = Date.now()
      const ms = countedMs({ from, now, lastInput, visible, idleMs })
      from = now
      if (ms === 0) return
      session = addToSession(session, ms, now)
      useProgressStore.getState().addStudyTime(ms)
    }
    function onInput() {
      lastInput = Date.now()
    }
    // กดฟัง/พูด: ปิดยอดช่วงก่อนหน้าก่อน (ช่วงที่แค่เปิดดูไม่นับย้อนหลัง)
    function onPractice() {
      count()
      onInput()
    }
    function onVisibility() {
      count()
      visible = !document.hidden
      if (visible && !practice) onInput() // กลับมาที่หน้าเว็บ = เริ่มเรียนต่อ
    }

    const timer = setInterval(count, TICK_MS)
    const stopPractice = practice ? subscribePractice(onPractice) : undefined
    if (!practice) for (const name of INPUT_EVENTS) window.addEventListener(name, onInput, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      count()
      clearInterval(timer)
      stopPractice?.()
      for (const name of INPUT_EVENTS) window.removeEventListener(name, onInput)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [mode, pathname])
}
