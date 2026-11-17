// =========================================================
// realOrTextbook.js — รอบของมินิเกม "Real or Textbook?" (ส่วนที่ 8.2)
//   1 รอบ = สถานการณ์ (ความหมายไทย) + 2 ประโยค: แบบในตำรา vs แบบที่เจ้าของภาษาพูดจริง → เลือกแบบที่พูดจริง
//   ข้อมูลจาก phrases.json → textbookVsReal[] { id, meaningTh, textbook, real: [{ text, register }], noteTh }
//   แบบพูดจริงมีหลายแบบ → สุ่ม 1 แบบต่อรอบ / ลำดับปุ่มสุ่ม (ไม่ให้คำตอบอยู่ฝั่งเดิมตลอด)
// (ฟังก์ชันล้วน ส่งตัวสุ่มแบบกำหนด seed ได้ → ทดสอบได้)
// =========================================================
import { shuffle } from './random.js'

export const ROT_ROUNDS = 5

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
