// =========================================================
// realOrTextbook.js — รอบของมินิเกม "Real or Textbook?" (ส่วนที่ 8.2)
//   1 รอบ = สถานการณ์ (ความหมายไทย) + 2 ประโยค: แบบในตำรา vs แบบที่เจ้าของภาษาพูดจริง → เลือกแบบที่พูดจริง
//   ข้อมูลจาก phrases.json → textbookVsReal[] { id, meaningTh, textbook, real: [{ text, register }], noteTh }
//   แบบพูดจริงมีหลายแบบ → สุ่ม 1 แบบต่อรอบ / ลำดับปุ่มสุ่ม (ไม่ให้คำตอบอยู่ฝั่งเดิมตลอด)
// (ฟังก์ชันล้วน ส่งตัวสุ่มแบบกำหนด seed ได้ → ทดสอบได้)
// =========================================================
import { shuffle } from './random.js'

export const ROT_ROUNDS = 5
// เกมในบทเรียนต้องมีอย่างน้อยกี่รอบ (คู่ของบทนี้ + คู่ของบทก่อน ๆ) — น้อยกว่านี้ไม่แทรกเกม
export const ROT_MIN_ROUNDS = 3
// คู่จากบทก่อน ๆ ที่ใช้เติมรอบ: เอาเฉพาะบทล่าสุด (ยังจำบรรทัดได้)
const ROT_RECENT_POOL = 12

/**
 * คู่ของเกม Real or Textbook? ในบทสนทนา Stage 5 (ขั้นที่ 27-2)
 *   คู่ที่มี lessonId = แบบพูดจริงคือบรรทัดในบทนั้น → เล่นคู่ของบทนี้ก่อน แล้วเติมด้วยคู่ของบทที่เรียนมาก่อน (ตามลำดับบท)
 * @param lessonOrder id บทเรียงตามลำดับเรียน (lessonList)
 * @returns { own, pool } หรือ null = บทนี้ไม่มีคู่ / รวมแล้วไม่ถึง ROT_MIN_ROUNDS
 */
export function lessonRotPairs(lessonId, pairs, lessonOrder) {
  const own = pairs.filter((pair) => pair.lessonId === lessonId)
  if (!own.length) return null
  const position = new Map(lessonOrder.map((id, index) => [id, index]))
  const here = position.get(lessonId) ?? -1
  const earlier = pairs
    .filter((pair) => pair.lessonId && pair.lessonId !== lessonId && (position.get(pair.lessonId) ?? Infinity) < here)
    .sort((a, b) => position.get(a.lessonId) - position.get(b.lessonId))
    .slice(-ROT_RECENT_POOL)
  if (own.length + earlier.length < ROT_MIN_ROUNDS) return null
  return { own, pool: earlier }
}

/**
 * @param pairs  คู่หลักที่ต้องได้เล่นก่อน (เช่น คู่ของสถานการณ์นั้น)
 * @param extra  คู่อื่นที่ใช้เติมให้ครบจำนวนรอบ
 * @returns [{ item, prompt, options: [{ text, kind: 'real' | 'textbook', register? }], answer, noteTh }]
 */
export function buildRotRounds(pairs, { extra = [], count = ROT_ROUNDS, random = Math.random } = {}) {
  const mainIds = new Set(pairs.map((pair) => pair.id))
  const chosen = [...shuffle(pairs, random), ...shuffle(extra.filter((pair) => !mainIds.has(pair.id)), random)].slice(0, count)
  return chosen.map((pair) => {
    const real = pair.real[Math.floor(random() * pair.real.length)]
    const options = shuffle(
      [
        { text: real.text, kind: 'real', register: real.register },
        { text: pair.textbook, kind: 'textbook' },
      ],
      random,
    )
    return { item: pair, prompt: pair.meaningTh, options, answer: real.text, noteTh: pair.noteTh }
  })
}
