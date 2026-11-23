// =========================================================
// recognition.js — ตัวคุม "ไมค์ฟังเสียงพูด" ทั้งแอป (Web Speech API: SpeechRecognition)
// - ฟังได้ทีละครั้งทั้งแอป: เริ่มฟังใหม่ → ยกเลิกอันเก่า
// - เริ่มฟัง → หยุดเสียงที่กำลังเล่นก่อน (ไม่ให้ไมค์ได้ยินเสียงของเว็บเอง)
// - ขอคำที่อาจได้ยิน 5 แบบ (maxAlternatives) ไว้ให้ compareWords เลือกแบบที่ดีที่สุด
// - หยุดฟังเองถ้านานเกิน (กันไมค์ค้าง)
// ⚠️ Chrome/Edge ส่งเสียงไปถอดเป็นข้อความที่เซิร์ฟเวอร์ของ Google/Microsoft → ต้องใช้อินเทอร์เน็ต
// component ให้ใช้ผ่าน hook useRecognition() ไม่เรียกไฟล์นี้ตรง ๆ
// =========================================================
import { stop as stopSpeech } from './speech'
import { speechDurationMs } from './speaking'

const RecognitionClass =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : undefined

export const isRecognitionSupported = typeof RecognitionClass === 'function'

// error จากระบบรับเสียง → key ข้อความที่อธิบายให้ผู้ใช้เข้าใจ (ไฟล์ภาษา mic.*)
const ERROR_MESSAGE_KEY = {
  'not-allowed': 'mic.errorPermission',
  'service-not-allowed': 'mic.errorPermission',
  'no-speech': 'mic.errorNoSpeech',
  'audio-capture': 'mic.errorNoMic',
  network: 'mic.errorNetwork',
  unsupported: 'mic.notSupported',
}
export const micErrorMessageKey = (error) => ERROR_MESSAGE_KEY[error] ?? 'mic.errorGeneric'

// ปัญหาที่ผู้ใช้แก้เองในหน้านั้นไม่ได้ → ต้องให้ข้ามได้ทันที ไม่ติดอยู่ในบท/เกม
const BLOCKING_ERRORS = new Set(['not-allowed', 'service-not-allowed', 'audio-capture', 'network', 'unsupported'])
export const isBlockingMicError = (error) => BLOCKING_ERRORS.has(error)

let activeSession = null // { recognition, token }

/**
 * เริ่มฟัง 1 ครั้ง (พูดจบแล้วระบบหยุดเอง หรือกด stopListening)
 * @param onInterim ฟังก์ชันรับข้อความระหว่างพูด (แสดงสด ๆ ว่ากำลังได้ยินอะไร)
 * @param maxListenMs ฟังนานสุดกี่ ms
 * @returns Promise<{ ok: true, alternatives: [{ transcript, confidence }], speechMs } | { ok: false, error }>
 *   speechMs = เวลาที่พูดจริง (ms) — นับเป็นนาทีที่พูดภาษาอังกฤษ (utils/speaking.js)
 *   error: 'not-allowed' (ไม่อนุญาตไมค์) | 'no-speech' | 'audio-capture' (ไม่มีไมค์) | 'network'
 *          | 'aborted' (ถูกยกเลิก) | 'unsupported' | อื่น ๆ
 */
export function startListening({ onInterim, maxListenMs = 8000 } = {}) {
  if (!isRecognitionSupported) return { token: null, promise: Promise.resolve({ ok: false, error: 'unsupported' }) }

  abortListening()
  stopSpeech()

  const recognition = new RecognitionClass()
  recognition.lang = 'en-US'
  recognition.interimResults = true
  recognition.maxAlternatives = 5
  recognition.continuous = false

  const token = Symbol('listen')
  activeSession = { recognition, token }

  const promise = new Promise((resolve) => {
    let alternatives = []
    let finished = false
    // ช่วงที่ระบบตรวจพบเสียงพูดจริง (ใช้นับ "นาทีที่พูดภาษาอังกฤษ" — ขั้นที่ 18)
    let speechStart = null
    let speechEnd = null
    recognition.onspeechstart = () => {
      speechStart = Date.now()
    }
    recognition.onspeechend = () => {
      speechEnd = Date.now()
    }
    const finish = (result) => {
      if (finished) return
      finished = true
      clearTimeout(timer)
      if (activeSession?.token === token) activeSession = null
      resolve(result)
    }

    recognition.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i]
        if (result.isFinal) {
          alternatives = Array.from(result, (alt) => ({ transcript: alt.transcript.trim(), confidence: alt.confidence }))
        } else {
          interim += result[0].transcript
        }
      }
      if (interim) onInterim?.(interim.trim())
    }
    recognition.onerror = (event) => finish({ ok: false, error: event.error || 'unknown' })
    recognition.onend = () =>
      finish(
        alternatives.length
          ? {
              ok: true,
              alternatives,
              speechMs: speechDurationMs({ speechStart, speechEnd, transcript: alternatives[0]?.transcript }),
            }
          : { ok: false, error: 'no-speech' },
      )

    // กันไมค์ค้าง: ครบเวลาแล้วสั่งหยุด (ระบบจะส่งผลที่ได้ยินมาให้ก่อนจบ)
    const timer = setTimeout(() => recognition.stop(), maxListenMs)

    try {
      recognition.start()
    } catch {
      finish({ ok: false, error: 'start-failed' })
    }
  })

  return { token, promise }
}

const MAX_RESTARTS = 30 // กันวนเริ่มใหม่ไม่รู้จบ (ระบบตัดเองบ่อยผิดปกติ)

/**
 * ฟังต่อเนื่องยาว ๆ (Speaking Check พูดบรรยาย 1 นาที — ขั้นที่ 19)
 * - Chrome ตัดการฟังเองเมื่อเงียบนาน ๆ → เริ่มใหม่ให้เองจนกว่าจะสั่งหยุด
 * - ไม่หยุดเสียงที่เล่นอยู่ / ไม่ยุ่งกับไฟล์ที่อัด (ตัวอัดเสียงใช้ไมค์แยกกัน)
 * - เปลี่ยนหน้า (abortListening) → หยุดด้วย
 * @param onText ข้อความทั้งหมดที่ได้ยินจนถึงตอนนี้ (รวมส่วนที่ยังไม่แน่นอน)
 * @returns { token, stop(): Promise<{ transcript, error }> }  error = ปัญหาที่ทำให้ถอดข้อความไม่ได้ (null = ปกติ)
 */
export function startContinuousListening({ onText, maxListenMs = 75000 } = {}) {
  if (!isRecognitionSupported) {
    return { token: null, stop: () => Promise.resolve({ transcript: '', error: 'unsupported' }) }
  }
  abortListening()

  const token = Symbol('listen-long')
  const finals = []
  let interim = ''
  let current = null
  let stopped = false
  let finished = false
  let restarts = 0
  let lastError = null
  let resolveDone
  const done = new Promise((resolve) => {
    resolveDone = resolve
  })
  const text = () => [...finals, interim].join(' ').replace(/\s+/g, ' ').trim()

  const finish = () => {
    if (finished) return
    finished = true
    clearTimeout(timer)
    if (activeSession?.token === token) activeSession = null
    if (interim) finals.push(interim.trim())
    interim = ''
    resolveDone({ transcript: text(), error: finals.length ? null : lastError })
  }

  const halt = (abort) => {
    stopped = true
    if (!current) return finish()
    if (abort) current.abort()
    else current.stop()
  }

  const startOne = () => {
    const recognition = new RecognitionClass()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognition.continuous = true
    recognition.onresult = (event) => {
      interim = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i]
        if (result.isFinal) finals.push(result[0].transcript.trim())
        else interim += result[0].transcript
      }
      onText?.(text())
    }
    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return
      lastError = event.error || 'unknown'
      if (isBlockingMicError(lastError)) stopped = true // ไม่ได้รับอนุญาต / ไม่มีเน็ต → เริ่มใหม่ก็ไม่หาย
    }
    recognition.onend = () => {
      current = null
      if (interim) finals.push(interim.trim())
      interim = ''
      if (stopped || restarts >= MAX_RESTARTS) return finish()
      restarts += 1
      startOne()
    }
    current = recognition
    try {
      recognition.start()
    } catch {
      current = null
      lastError = 'start-failed'
      finish()
    }
  }

  // abortListening()/stopListening() จากที่อื่น (เช่น เปลี่ยนหน้า) หยุดรอบนี้ได้ด้วย
  activeSession = { token, recognition: { stop: () => halt(false), abort: () => halt(true) } }
  const timer = setTimeout(() => halt(false), maxListenMs)
  startOne()

  return {
    token,
    stop: () => {
      if (!stopped) halt(false)
      return done
    },
  }
}

// หยุดฟังแล้วเอาผลที่ได้ยินแล้วมาใช้ (เช่น ผู้ใช้กดปุ่มไมค์อีกครั้งเพื่อบอกว่าพูดจบแล้ว)
export function stopListening(token) {
  if (activeSession && (!token || activeSession.token === token)) activeSession.recognition.stop()
}

// ยกเลิกการฟังทันที ไม่เอาผล (เช่น เปลี่ยนหน้า, กดฟังเสียงตัวอย่าง)
export function abortListening(token) {
  if (activeSession && (!token || activeSession.token === token)) {
    const { recognition } = activeSession
    activeSession = null
    recognition.abort()
  }
}

export const isListening = () => activeSession !== null
