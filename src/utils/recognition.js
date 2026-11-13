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

const RecognitionClass =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : undefined

export const isRecognitionSupported = typeof RecognitionClass === 'function'

let activeSession = null // { recognition, token }

/**
 * เริ่มฟัง 1 ครั้ง (พูดจบแล้วระบบหยุดเอง หรือกด stopListening)
 * @param onInterim ฟังก์ชันรับข้อความระหว่างพูด (แสดงสด ๆ ว่ากำลังได้ยินอะไร)
 * @param maxListenMs ฟังนานสุดกี่ ms
 * @returns Promise<{ ok: true, alternatives: [{ transcript, confidence }] } | { ok: false, error }>
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
      finish(alternatives.length ? { ok: true, alternatives } : { ok: false, error: 'no-speech' })

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
