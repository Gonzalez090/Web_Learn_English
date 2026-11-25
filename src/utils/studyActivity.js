// =========================================================
// studyActivity.js — ตอนนี้ "กำลังเรียนจริง" อยู่ไหม (ใช้กับตัวนับเวลาเรียน hooks/useStudyTimer.js)
// - beginActivity(): ตัวเล่น/เกมเริ่มทำงาน → คืนฟังก์ชันจบ (hooks/useStudyActivity.js เรียกให้)
// - markPractice(): กดฟัง/พูด 1 ครั้ง (useSpeech, useRecognition) — ใช้นับในหน้าที่ฝึกได้เลยโดยไม่มีปุ่มเริ่ม
// =========================================================

let activeCount = 0
const activityListeners = new Set()
const practiceListeners = new Set()

const listenWith = (listeners) => (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
const notify = (listeners) => listeners.forEach((listener) => listener())

export const isActive = () => activeCount > 0
export const subscribeActivity = listenWith(activityListeners)
export const subscribePractice = listenWith(practiceListeners)
export const markPractice = () => notify(practiceListeners)

export function beginActivity() {
  let ended = false
  activeCount += 1
  notify(activityListeners)
  return () => {
    if (ended) return
    ended = true
    activeCount -= 1
    notify(activityListeners)
  }
}
