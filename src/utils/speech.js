// =========================================================
// speech.js — ตัวกลางควบคุม "เสียงพูด" ทั้งแอป
// ลำดับการเลือกเสียง:
//   1) ไฟล์เสียงคุณภาพสูง (Kokoro) ที่สร้างไว้ล่วงหน้าใน public/audio/
//      ชื่อไฟล์คำนวณจากข้อความ (utils/audioPath.js) → ไม่ต้องโหลดสารบัญเสียงทั้งก้อนเข้าเว็บ
//   2) ข้อความที่ยังไม่มีไฟล์ / เล่นไฟล์ไม่ได้ → เสียงของเบราว์เซอร์ (Web Speech API: speechSynthesis) ทีละประโยค
//   3) เสียงออนไลน์ของเบราว์เซอร์ใช้ไม่ได้ (เน็ตหลุด) → เสียงในเครื่อง
// - มีตัวเดียวทั้งแอป: เริ่มเสียงใหม่ → หยุดเสียงเก่าก่อนเสมอ (เสียงไม่ซ้อนกัน)
// - ตัดข้อความยาวเป็นทีละประโยค (Chrome ตัดเสียงที่ยาวเกินประมาณ 15 วินาที)
// - มีตัวจับเวลากันค้าง เผื่อเบราว์เซอร์ไม่แจ้งว่าพูดจบ (onend ไม่ทำงาน)
// component ให้ใช้ผ่าน hook useSpeech() ไม่เรียกไฟล์นี้ตรง ๆ
// =========================================================
import { audioPathFor } from './audioPath'

// ความเร็วเสียงของเบราว์เซอร์ (1 = ปกติของเครื่อง) — ไฟล์เสียงมีรุ่นช้าแยกไว้แล้ว
export const RATES = { normal: 0.95, slow: 0.65 }

// =========================================================
// ฟังก์ชันล้วน (ไม่แตะเบราว์เซอร์ → เขียน unit test ได้)
// =========================================================

// แยกข้อความเป็นท่อนสั้น ๆ ทีละประโยค — รับได้ทั้งข้อความเดียว และ array หลายบรรทัด
export function splitIntoChunks(input) {
  const lines = Array.isArray(input) ? input : [input]
  return lines
    .flatMap((line) => String(line ?? '').split(/(?<=[.!?])\s+/))
    .map((chunk) => chunk.trim())
    .filter(Boolean)
}

// ชื่อเสียงคุณภาพสูงที่พบบ่อย (เรียงจากดีที่สุด)
const QUALITY_HINTS = [/natural/i, /google us english/i, /samantha/i, /aria|jenny|guy|ava|andrew|emma|brian/i]

// ให้คะแนนเสียง: ไม่ใช่ภาษาอังกฤษ = -1, en-US ได้มากกว่าสำเนียงอื่น, เสียงคุณภาพสูงได้เพิ่ม
// preferLocal = ออฟไลน์อยู่ / เสียงออนไลน์ใช้ไม่ได้ → ดันเสียงที่อยู่ในเครื่อง (localService) ขึ้นก่อน
export function scoreVoice(voice, { preferLocal = false } = {}) {
  if (!voice?.lang) return -1
  const lang = voice.lang.replace('_', '-').toLowerCase()
  if (!lang.startsWith('en')) return -1
  let score = lang === 'en-us' ? 100 : 50
  const hintIndex = QUALITY_HINTS.findIndex((pattern) => pattern.test(voice.name ?? ''))
  if (hintIndex >= 0) score += 40 - hintIndex * 5
  if (preferLocal && voice.localService) score += 200
  return score
}

// รายชื่อเสียงภาษาอังกฤษ เรียงจากดีที่สุด (ใช้แสดงในหน้าตั้งค่า)
export function englishVoices(voices, options) {
  return voices
    .filter((voice) => scoreVoice(voice) >= 0)
    .sort((a, b) => scoreVoice(b, options) - scoreVoice(a, options) || a.name.localeCompare(b.name))
}

// เลือกเสียง: ถ้าผู้ใช้เลือกไว้และยังมีในเครื่องนี้ ใช้อันนั้น ไม่งั้นใช้อันที่ดีที่สุด
// แต่ถ้าออฟไลน์ (preferLocal) และเสียงที่เลือกเป็นเสียงออนไลน์ → ใช้เสียงในเครื่องแทน (ไม่งั้นจะเงียบ)
export function pickVoice(voices, preferredURI, { preferLocal = false } = {}) {
  const english = englishVoices(voices, { preferLocal })
  const preferred = preferredURI && english.find((voice) => voice.voiceURI === preferredURI)
  if (preferred && !(preferLocal && !preferred.localService)) return preferred
  return english[0] || null
}

// เสียงในเครื่องที่ดีที่สุด (ใช้ตอนเสียงออนไลน์ใช้ไม่ได้)
export function pickLocalVoice(voices) {
  return englishVoices(voices).find((voice) => voice.localService) ?? null
}

// error แบบไหนแปลว่า "เสียงนี้ใช้ไม่ได้" → ลองใหม่ด้วยเสียงในเครื่อง
// (interrupted / canceled = ถูกสั่งหยุด ไม่ต้องลองใหม่)
const FALLBACK_ERRORS = new Set(['network', 'synthesis-failed', 'synthesis-unavailable', 'voice-unavailable'])
export const shouldFallbackToLocal = (errorCode) => FALLBACK_ERRORS.has(errorCode)

// ไฟล์เสียงของข้อความนี้ (ชื่อไฟล์คำนวณจากข้อความ — ต้องตรงทุกตัวอักษร) — ความเร็วที่ไม่มีไฟล์ได้ null
// (ข้อความที่ไม่ได้สร้างเสียงไว้ จะได้ชื่อไฟล์ที่ไม่มีอยู่จริง → เล่นไม่ได้ → ใช้เสียงเบราว์เซอร์แทน)
export function audioFileFor(text, rate) {
  return rate === 'normal' || rate === 'slow' ? audioPathFor(text, rate) : null
}

// แบ่งสิ่งที่ต้องพูดเป็นช่วง ๆ: 1 บรรทัด = 1 ช่วง (เล่นไฟล์ทั้งบรรทัด → น้ำเสียงต่อเนื่องเป็นธรรมชาติ)
// ถ้าเล่นไฟล์ไม่ได้ ตัวเล่นจะแยกบรรทัดนั้นเป็นทีละประโยคให้เบราว์เซอร์อ่าน
export function planSegments(input, rate, { useFiles = true } = {}) {
  const lines = Array.isArray(input) ? input : [input]
  return lines
    .map((line) => String(line ?? '').trim())
    .filter(Boolean)
    .map((text) => ({ text, file: useFiles ? audioFileFor(text, rate) : null }))
}

// ประมาณเวลาพูด (ms) — คนพูดประมาณ 2.5 คำ/วินาที ที่ความเร็ว 1
export function estimateDurationMs(text, rate) {
  const words = String(text).trim().split(/\s+/).filter(Boolean).length || 1
  return Math.round((words / (2.5 * rate)) * 1000)
}

// ความยาวจริงของไฟล์เสียง (ms) — เกมคาราโอเกะใช้จัดจังหวะคำ; ไม่มีไฟล์/อ่านไม่ได้ → ใช้ค่าประมาณ
const durationCache = new Map()
export function getSpeechDurationMs(text, rate = 'normal') {
  const fallback = estimateDurationMs(text, rate === 'slow' ? 0.75 : 1)
  const file = typeof window !== 'undefined' && typeof window.Audio === 'function' ? audioFileFor(text, rate) : null
  if (!file) return Promise.resolve(fallback)
  if (durationCache.has(file)) return Promise.resolve(durationCache.get(file))
  return new Promise((resolve) => {
    const probe = new window.Audio()
    const done = (ms) => {
      clearTimeout(timer)
      probe.onloadedmetadata = null
      probe.onerror = null
      resolve(ms)
    }
    const timer = setTimeout(() => done(fallback), 2000)
    probe.onloadedmetadata = () => {
      const ms = Number.isFinite(probe.duration) && probe.duration > 0 ? Math.round(probe.duration * 1000) : fallback
      durationCache.set(file, ms)
      done(ms)
    }
    probe.onerror = () => done(fallback)
    probe.preload = 'metadata'
    probe.src = file
  })
}

// =========================================================
// ตัวควบคุมเสียง (ใช้ speechSynthesis ของเบราว์เซอร์)
// =========================================================
export const isSupported =
  typeof window !== 'undefined' &&
  'speechSynthesis' in window &&
  typeof window.SpeechSynthesisUtterance === 'function'

// สถานะกลาง (ให้ React อ่านผ่าน useSyncExternalStore)
//   speakingKey  = ปุ่มไหนกำลังเล่นอยู่
//   voices       = รายชื่อเสียงในเครื่อง
//   usingLocalFallback = เสียงออนไลน์ใช้ไม่ได้ (เน็ตหลุด) → ตอนนี้ใช้เสียงในเครื่องแทน
let state = { speakingKey: null, voices: [], usingLocalFallback: false }
const listeners = new Set()

function setState(patch) {
  state = { ...state, ...patch }
  listeners.forEach((listener) => listener())
}

export const subscribe = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const getSnapshot = () => state

// รายชื่อเสียงโหลดช้า (โดยเฉพาะ Chrome) → ฟังเหตุการณ์ voiceschanged
if (isSupported) {
  const loadVoices = () => setState({ voices: window.speechSynthesis.getVoices() })
  loadVoices()
  window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices)
  // เน็ตกลับมา → กลับไปใช้เสียงที่ดีที่สุด (อาจเป็นเสียงออนไลน์) ได้อีก
  window.addEventListener('online', () => setState({ usingLocalFallback: false }))
}

const isOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

let runId = 0 // เพิ่มทุกครั้งที่หยุด/เริ่มใหม่ → รอบเก่าจะรู้ตัวว่าถูกยกเลิก
// เก็บ utterance ที่กำลังพูดไว้ — กัน Chrome เก็บขยะก่อนพูดจบ (ทำให้ onend ไม่ทำงาน)
const activeUtterances = new Set()

// เล่นไฟล์เสียงได้ไหม (เบราว์เซอร์แทบทุกตัวเล่นได้ แม้ไม่มี speechSynthesis)
const hasAudioElement = typeof window !== 'undefined' && typeof window.Audio === 'function'
// พูดได้อย่างน้อยหนึ่งวิธี
export const canSpeak = isSupported || hasAudioElement

let audioElement = null // ตัวเล่นไฟล์เสียงตัวเดียวทั้งแอป
let finishCurrentFile = null // เรียกเพื่อจบไฟล์ที่กำลังเล่น (ตอนสั่งหยุด)

// เล่นไฟล์เสียง 1 ไฟล์ แล้วรอจนจบ → { ok } หรือ { ok: false, error }
function playFile(src) {
  return new Promise((resolve) => {
    audioElement ??= new window.Audio()
    const element = audioElement
    const finish = (result) => {
      if (finishCurrentFile !== finish) return
      finishCurrentFile = null
      element.onended = null
      element.onerror = null
      resolve(result)
    }
    finishCurrentFile = finish
    element.onended = () => finish({ ok: true })
    element.onerror = () => finish({ ok: false, error: 'file' })
    element.src = src
    element.play().catch(() => finish({ ok: false, error: 'file' }))
  })
}

// หยุดเสียงทั้งหมดทันที (ทั้งไฟล์เสียงและเสียงของเบราว์เซอร์)
export function stop() {
  runId += 1
  finishCurrentFile?.({ ok: false, error: 'interrupted' })
  if (audioElement) audioElement.pause()
  if (isSupported) window.speechSynthesis.cancel()
  if (state.speakingKey !== null) setState({ speakingKey: null })
}

// พูด 1 ท่อน แล้วรอจนจบ
function speakChunk(synth, text, rate, voice) {
  return new Promise((resolve) => {
    const utterance = new window.SpeechSynthesisUtterance(text)
    utterance.lang = voice?.lang ?? 'en-US'
    if (voice) utterance.voice = voice
    utterance.rate = rate

    // ผลลัพธ์: { ok: true } = พูดจบปกติ (หรือรอนานเกินจนข้ามไป)
    //          { ok: false, error } = เกิด error / ถูกตัดเสียง
    let finished = false
    const finish = (result) => {
      if (finished) return
      finished = true
      clearTimeout(timer)
      activeUtterances.delete(utterance)
      resolve(result)
    }
    // กันค้าง: ถ้าเกินเวลาที่ควรพูดจบนานมาก ให้ไปต่อเอง
    const timer = setTimeout(() => finish({ ok: true }), estimateDurationMs(text, rate) * 2 + 4000)
    utterance.onend = () => finish({ ok: true })
    utterance.onerror = (event) => finish({ ok: false, error: event.error })

    activeUtterances.add(utterance)
    if (synth.paused) synth.resume()
    synth.speak(utterance)
  })
}

/**
 * พูดข้อความ (หยุดเสียงเก่าก่อนเสมอ)
 * @param input   ข้อความ หรือ array หลายบรรทัด (จะพูดทีละช่วง เว้นช่วงสั้น ๆ)
 * @param options rate: 'normal' | 'slow' | ตัวเลข, key: รหัสของปุ่มที่กด, voiceURI: เสียงเบราว์เซอร์ที่เลือก,
 *                useFiles: ใช้ไฟล์เสียงที่สร้างไว้ถ้ามี (ค่าเริ่มต้น true — ปุ่มลองเสียงในตั้งค่าส่ง false)
 * @returns true ถ้าพูดจบครบ, false ถ้าถูกหยุดกลางทาง/เล่นไม่ได้
 */
export async function speak(
  input,
  { rate = 'normal', key = null, voiceURI = null, gapMs = 350, useFiles = true } = {},
) {
  if (!canSpeak) return false
  const synth = isSupported ? window.speechSynthesis : null
  const wasBusy = Boolean(synth && (synth.speaking || synth.pending))

  stop()
  const myRun = runId
  // Chrome: สั่งพูดทันทีหลัง cancel บางครั้งไม่มีเสียง → รอสั้น ๆ ก่อน
  if (wasBusy) await wait(80)
  if (myRun !== runId) return false

  const segments = planSegments(input, rate, { useFiles: useFiles && hasAudioElement })
  if (segments.length === 0) return false

  const voices = synth ? (state.voices.length ? state.voices : synth.getVoices()) : []
  // ออฟไลน์ หรือเคยเจอเสียงออนไลน์ใช้ไม่ได้ → เลือกเสียงในเครื่องตั้งแต่แรก
  const preferLocal = state.usingLocalFallback || isOffline()
  let voice = pickVoice(voices, voiceURI, { preferLocal })
  const rateValue = typeof rate === 'number' ? rate : (RATES[rate] ?? RATES.normal)

  setState({ speakingKey: key })
  for (let index = 0; index < segments.length; index += 1) {
    if (myRun !== runId) return false
    const segment = segments[index]

    // 1) มีไฟล์เสียง → เล่นไฟล์
    let result = segment.file ? await playFile(segment.file) : { ok: false }

    // 2) ไม่มีไฟล์ / เล่นไฟล์ไม่ได้ → ให้เบราว์เซอร์อ่านทีละประโยค
    if (!result.ok && myRun === runId && synth) {
      for (const chunk of splitIntoChunks(segment.text)) {
        result = await speakChunk(synth, chunk, rateValue, voice)

        // 3) เสียงออนไลน์ใช้ไม่ได้ (เช่น เน็ตหลุด) → ลองใหม่ด้วยเสียงในเครื่อง และจำไว้จนกว่าเน็ตจะกลับมา
        if (!result.ok && myRun === runId && shouldFallbackToLocal(result.error) && !voice?.localService) {
          const localVoice = pickLocalVoice(voices)
          if (localVoice) {
            voice = localVoice
            setState({ usingLocalFallback: true })
            result = await speakChunk(synth, chunk, rateValue, voice)
          }
        }
        if (!result.ok || myRun !== runId) break
      }
    }

    if (myRun !== runId) return false
    if (!result.ok) {
      // ถูกตัดเสียงจากภายนอก / ไม่มีเสียงไหนใช้ได้ → จบรอบนี้ และคืนสถานะปุ่มให้กดใหม่ได้
      setState({ speakingKey: null })
      return false
    }
    if (index < segments.length - 1 && gapMs) await wait(gapMs)
  }
  setState({ speakingKey: null })
  return true
}
