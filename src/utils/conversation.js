// =========================================================
// conversation.js — บทสนทนาสุ่มแบบชีวิตจริง (ส่วนที่ 6) — ไม่มี AI: template + สุ่ม
//   scenarios.json: สถานการณ์ → turns เรียงตามลำดับ
//     npc  { id, speaker: 'npc', variants: [{ text, th }] }          บทอีกฝ่าย 3+ แบบ สุ่ม 1 แบบต่อรอบ
//     user { id, speaker: 'user', hintTh, userOptions: [{ text, register }], requiredWords, acceptedAnswers, freeAnswer }
//   slots: { drink: [{ en, th, key? }] } — ช่องสุ่มค่า {drink} ในข้อความ: สุ่มครั้งเดียวต่อบทสนทนา → ใช้ค่าเดิมทั้งบท
//     en = แทนในภาษาอังกฤษ / th = แทนในคำใบ้/คำแปลไทย / key = คำสำคัญที่ใช้ตรวจ (ไม่ใส่ = en)
//   seed เดิม = บทสนทนาเดิมทุกครั้ง (สุ่มอีกรอบ = seed ใหม่) → ทดสอบซ้ำได้
//   เสียง: สร้างไฟล์ให้ทุกค่าที่สุ่มได้ (expandScenarioTexts) → ข้อความต้องได้จาก fillSlots ตัวเดียวกันทุกที่
// (ฟังก์ชันล้วน → ทดสอบได้)
// =========================================================
import { createRandom } from './random.js'
import { compareSpeech } from './compareWords.js'
import { checkKeywords } from './storyCheck.js'
import { RECAST_OPENERS } from './recast.js'

const SLOT_RE = /\{(\w+)\}/g

// ชื่อช่องที่อยู่ในข้อความ (ไม่ซ้ำ)
export const slotsIn = (text) => [...new Set([...String(text ?? '').matchAll(SLOT_RE)].map((match) => match[1]))]

/**
 * แทนค่าช่องในข้อความ — ภาษาอังกฤษขึ้นต้นตัวใหญ่เสมอ ("{nights}, is that right?" → "Two nights, is that right?")
 * @param lang 'en' | 'th'
 */
export function fillSlots(text, values, lang = 'en') {
  const source = String(text ?? '')
  const filled = source.replace(SLOT_RE, (whole, name, offset) => {
    const value = values?.[name]
    if (!value) return whole
    if (lang === 'th') return value.th ?? value.en
    // ช่องที่ขึ้นประโยคใหม่กลางข้อความ ("Okay, we're here. {price}, please.") → ตัวใหญ่ด้วย (ขั้นที่ 28-2)
    const startsSentence = /(^|[.!?]\s+)$/.test(source.slice(0, offset))
    return startsSentence ? value.en[0].toUpperCase() + value.en.slice(1) : value.en
  })
  return lang === 'en' && filled ? filled[0].toUpperCase() + filled.slice(1) : filled
}

// คำสำคัญที่มีช่อง: "{drink}" → key ของค่าที่สุ่มได้ (เช่น latte)
const fillKeyword = (entry, values) =>
  String(entry).replace(SLOT_RE, (whole, name) => values?.[name]?.key ?? values?.[name]?.en ?? whole)

// ค่าแรกของทุกช่อง (ใช้กับรายการทบทวน — ข้อความต้องคงที่)
export const defaultSlotValues = (scenario) =>
  Object.fromEntries(Object.entries(scenario.slots ?? {}).map(([name, values]) => [name, values[0]]))

export const randomSeed = () => Math.floor(Math.random() * 1_000_000_000)

// เหตุการณ์ไม่คาดคิด (twist) เกิด 30% ของรอบ (สเปกส่วนที่ 6) — สุ่มด้วยตัวสุ่มแยก → บทหลักของ seed เดิมไม่เปลี่ยนเพราะ twist
export const TWIST_CHANCE = 0.3

/**
 * เลือก twist ของรอบนี้
 * @param twist 'auto' (สุ่ม 30%) | null (ไม่มี) | id ของ twist (บังคับ — ใช้ทดสอบ)
 */
export function pickTwist(scenario, seed, twist = 'auto') {
  const twists = scenario.twists ?? []
  if (!twists.length || twist === null) return null
  if (twist !== 'auto') return twists.find((entry) => entry.id === twist) ?? null
  const random = createRandom((seed ^ 0x5bd1e995) >>> 0)
  return random() < TWIST_CHANCE ? twists[Math.floor(random() * twists.length)] : null
}

// ลำดับ turn ของรอบนี้: แทรก twist ต่อจาก afterTurn และตัดบรรทัดที่ไม่เข้ากับ twist แล้ว (skip)
function turnsWithTwist(scenario, twist) {
  if (!twist) return scenario.turns
  const skip = new Set(twist.skip ?? [])
  return scenario.turns.flatMap((turn) => {
    if (skip.has(turn.id)) return []
    return turn.id === twist.afterTurn ? [turn, ...twist.turns.map((entry) => ({ ...entry, twist: true }))] : [turn]
  })
}

// ทุก turn ของสถานการณ์ (บทหลัก + ทุก twist) — ใช้ทำเสียงและรายการทบทวน
const allTurns = (scenario) => [...scenario.turns, ...(scenario.twists ?? []).flatMap((twist) => twist.turns)]

/**
 * สร้างบทสนทนา 1 รอบ
 * @param options.twist 'auto' | null | id ของ twist
 * @returns { seed, values, twist: { id, title, titleTh } | null,
 *            lines: [npc { id, speaker, target, translationTh, twist? } | user { id, speaker, hintTh, options, requiredWords, acceptedAnswers, freeAnswer, twist? }] }
 */
export function buildConversation(scenario, seed, { twist: twistOption = 'auto' } = {}) {
  const random = createRandom(seed)
  const values = Object.fromEntries(
    Object.entries(scenario.slots ?? {}).map(([name, list]) => [name, list[Math.floor(random() * list.length)]]),
  )
  const twist = pickTwist(scenario, seed, twistOption)
  const lines = turnsWithTwist(scenario, twist).map((turn) => {
    if (turn.speaker === 'npc') {
      const variant = turn.variants[Math.floor(random() * turn.variants.length)]
      return {
        id: turn.id,
        speaker: 'npc',
        target: fillSlots(variant.text, values),
        translationTh: fillSlots(variant.th, values, 'th'),
        twist: Boolean(turn.twist),
      }
    }
    return {
      id: turn.id,
      speaker: 'user',
      hintTh: fillSlots(turn.hintTh, values, 'th'),
      options: turn.userOptions.map((option) => ({ text: fillSlots(option.text, values), register: option.register })),
      requiredWords: (turn.requiredWords ?? []).map((entry) => fillKeyword(entry, values)),
      acceptedAnswers: (turn.acceptedAnswers ?? []).map((answer) => fillSlots(answer, values)),
      freeAnswer: Boolean(turn.freeAnswer),
      twist: Boolean(turn.twist),
    }
  })
  const twistInfo = twist ? { id: twist.id, title: twist.title, titleTh: twist.titleTh } : null
  return { seed, values, twist: twistInfo, lines }
}

const transcriptsOf = (alternatives) =>
  (alternatives ?? [])
    .map((alt) => (typeof alt === 'string' ? alt : alt?.transcript))
    .filter((text) => typeof text === 'string' && text.trim())

/**
 * ตรวจคำตอบของเรา (รูปแบบผลเดียวกับ compareSpeech → แสดงด้วย SpeechResult / MicButton evaluate)
 *   ผ่าน = ใกล้ตัวเลือก/คำตอบที่ยอมรับข้อใดข้อหนึ่ง ≥ 70% หรือ พูดคำสำคัญครบ (พูดแบบของตัวเองก็ได้)
 *   freeAnswer (เช่น บอกชื่อตัวเอง) = พูดอะไรก็ผ่าน
 *   ยังไม่ผ่าน → ทวนกลับด้วยตัวเลือกแรก (recast แบบ "Listen. …")
 * @returns { score, passed, words, heard, matched (ข้อความที่ใกล้ที่สุด), recast }
 */
export function checkUserTurn(line, alternatives, { attempt = 0 } = {}) {
  const transcripts = transcriptsOf(alternatives)
  const heard = transcripts[0]?.trim() ?? ''
  const first = line.options[0]?.text ?? ''
  if (line.freeAnswer && heard) return { score: 100, passed: true, words: [], heard, matched: first, recast: null }

  const targets = [...line.options.map((option) => option.text), ...line.acceptedAnswers]
  let best = null
  for (const target of targets) {
    const result = compareSpeech(target, transcripts)
    if (!best || result.score > best.score) best = { ...result, matched: target }
  }
  const required = line.requiredWords
  const keywordsOk =
    required.length > 0 && transcripts.some((text) => checkKeywords(required, text).found === required.length)
  const passed = Boolean(best?.passed) || keywordsOk
  const openers = RECAST_OPENERS.model
  const opener = openers[Math.abs(attempt) % openers.length]
  return {
    ...best,
    heard: best?.heard || heard,
    score: keywordsOk ? Math.max(best?.score ?? 0, 70) : (best?.score ?? 0),
    passed,
    recast: passed ? null : { kind: 'model', opener, correct: first, lines: [opener, first] },
  }
}

// ทุกค่าที่เป็นไปได้ของช่องในข้อความ → ข้อความที่แทนค่าแล้วทุกแบบ (ใช้สร้างไฟล์เสียง)
function expandText(text, slots) {
  let combos = [{}]
  for (const name of slotsIn(text)) {
    const list = slots?.[name] ?? []
    combos = combos.flatMap((combo) => list.map((value) => ({ ...combo, [name]: value })))
  }
  return combos.map((values) => fillSlots(text, values))
}

// ข้อความภาษาอังกฤษที่บทสนทนานี้อาจพูด (บทอีกฝ่ายทุกแบบ + ตัวเลือกของเรา) × ทุกค่าของช่อง
// speaker = 'npc' | 'user' → เฉพาะบรรทัดของฝ่ายนั้น (ขั้นที่ 28-1: บรรทัด NPC ใช้เสียง Kokoro ของ NPC แยกจากเสียงหลัก)
export function expandScenarioTexts(scenario, { speaker = null } = {}) {
  const texts = new Set()
  for (const turn of allTurns(scenario)) {
    if (speaker && turn.speaker !== speaker) continue
    const sources = turn.speaker === 'npc' ? turn.variants.map((variant) => variant.text) : turn.userOptions.map((o) => o.text)
    for (const source of sources) for (const text of expandText(source, scenario.slots)) texts.add(text)
  }
  return [...texts]
}

/**
 * บทสนทนาในรูป "บทเรียน" สำหรับรายการทบทวน (พูดตามบรรทัดของเรา) — id ขึ้นต้น talk-
 *   ข้อ = บรรทัดของเรา: ประโยค = ตัวเลือกแรก (ค่าแรกของช่อง — คงที่ทุกครั้ง), ตัวเลือกอื่น = คำตอบที่ยอมรับ
 */
export const talkLessonId = (scenarioId) => `talk-${scenarioId}`

export function talkReviewLesson(scenario) {
  const values = defaultSlotValues(scenario)
  return {
    id: talkLessonId(scenario.id),
    stageId: 5,
    type: 'talk',
    title: scenario.name,
    titleTh: scenario.nameTh,
    items: allTurns(scenario)
      .filter((turn) => turn.speaker === 'user')
      .map((turn) => {
        const [first, ...others] = turn.userOptions.map((option) => fillSlots(option.text, values))
        return {
          id: turn.id,
          target: first,
          translationTh: fillSlots(turn.hintTh, values, 'th'),
          image: scenario.image,
          register: turn.userOptions[0].register,
          acceptAlso: others,
        }
      }),
  }
}
