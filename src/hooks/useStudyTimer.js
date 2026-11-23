// =========================================================
// useStudyTimer — นับเวลาเรียนของวัน + ชวนพัก (ใช้ใน AppLayout ที่เดียว)
// - อยู่หน้าที่เรียนจริง + หน้าเว็บเปิดอยู่ + ยังแตะ/พิมพ์ → เพิ่มเวลาทุก 15 วินาที (utils/studyTime.js)
// - เรียนต่อเนื่องครบ 20 นาที → ชวนพักตอน "ออกจากหน้าเรียน" (จบบท/กลับหน้ารายการ) ไม่ขัดจังหวะกลางบท
// =========================================================
import { useEffect } from 'react'
import { useProgressStore } from '../store/progressStore'
import { useToastStore } from '../store/toastStore'
import { addToSession, countedMs, EMPTY_SESSION, isStudyPath, needsBreak, TICK_MS } from '../utils/studyTime'

// รอบการเรียนปัจจุบัน (อยู่ในหน่วยความจำ: รีโหลดหน้า = เริ่มรอบใหม่)
let session = EMPTY_SESSION

const INPUT_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchmove']

export function useStudyTimer(pathname) {
  useEffect(() => {
    if (!isStudyPath(pathname)) {
      if (needsBreak(session, Date.now())) {
        session = EMPTY_SESSION
        useToastStore.getState().show({ kind: 'break' })
      }
      return undefined
    }

    let from = Date.now()
    let lastInput = from
    let visible = !document.hidden

    // นับช่วงที่ผ่านมา (visible = สถานะของช่วงนั้น ไม่ใช่สถานะใหม่)
    function count() {
      const now = Date.now()
      const ms = countedMs({ from, now, lastInput, visible })
      from = now
      if (ms === 0) return
      session = addToSession(session, ms, now)
      useProgressStore.getState().addStudyTime(ms)
    }
    function onInput() {
      lastInput = Date.now()
    }
    function onVisibility() {
      count()
      visible = !document.hidden
      if (visible) onInput() // กลับมาที่หน้าเว็บ = เริ่มเรียนต่อ
    }

    const timer = setInterval(count, TICK_MS)
    for (const name of INPUT_EVENTS) window.addEventListener(name, onInput, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      count()
      clearInterval(timer)
      for (const name of INPUT_EVENTS) window.removeEventListener(name, onInput)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [pathname])
}
