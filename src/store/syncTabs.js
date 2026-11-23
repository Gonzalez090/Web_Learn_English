// =========================================================
// syncTabs — เปิดเว็บหลายแท็บพร้อมกัน: แท็บอื่นบันทึก localStorage แล้ว แท็บนี้โหลดค่าล่าสุดตาม
// (ไม่งั้นแท็บที่ถือค่าเก่าจะเขียนทับความคืบหน้าของอีกแท็บ — ตัวนับเวลาเรียนเขียนทุก 15 วินาที)
// เหตุการณ์ 'storage' เกิดเฉพาะในแท็บอื่น ไม่เกิดในแท็บที่เขียนเอง
// =========================================================
import { useProgressStore } from './progressStore'
import { useReviewStore } from './reviewStore'
import { useSettingsStore } from './settingsStore'

export function syncTabs() {
  const stores = [useProgressStore, useReviewStore, useSettingsStore]
  window.addEventListener('storage', (event) => {
    if (!event.newValue) return // ถูกลบ (ล้างข้อมูลเบราว์เซอร์) → ไม่ต้องโหลด
    for (const store of stores) {
      if (store.persist.getOptions().name === event.key) store.persist.rehydrate()
    }
  })
}
