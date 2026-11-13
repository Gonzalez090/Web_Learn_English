// =========================================================
// random.js — ตัวสุ่มแบบกำหนด seed ได้ (seed เดิม = ผลเดิมทุกครั้ง → เขียน test ได้)
// ใช้ในเกมและบทสนทนาสุ่ม
// =========================================================

// mulberry32: ตัวสุ่มเล็ก ๆ ที่กระจายดีพอสำหรับเกม (ไม่ใช่งานความปลอดภัย)
export function createRandom(seed = Date.now()) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// สลับลำดับ (Fisher–Yates) — คืน array ใหม่ ไม่แก้ของเดิม
export function shuffle(list, random = Math.random) {
  const result = [...list]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// แปลงข้อความเป็นตัวเลข seed (เช่น วันที่ → ภารกิจของวันนั้นสุ่มได้ผลเดิมทุกครั้ง)
export function hashString(text) {
  let hash = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}
