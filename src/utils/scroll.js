// =========================================================
// scroll.js — เลื่อนจอให้เห็นกล่องที่กำลังทำงานอยู่ (บทสนทนายาวกว่าจอมือถือ)
// - เลื่อนแค่พอให้เห็น (block: 'nearest') → ถ้าเห็นอยู่แล้วไม่ขยับ
// - ผู้ใช้ตั้งค่าลดการเคลื่อนไหว (prefers-reduced-motion) → เลื่อนทันที ไม่ไหล
// =========================================================
export function scrollIntoViewGently(element) {
  if (!element?.scrollIntoView) return
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  element.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' })
}
