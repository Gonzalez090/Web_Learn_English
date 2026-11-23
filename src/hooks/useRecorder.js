// =========================================================
// useRecorder — อัดเสียงพูดผ่านไมค์ (Speaking Check ขั้นที่ 19)
//   const { supported, status, elapsedMs, level, liveText, error, start, finish } = useRecorder({ maxMs, onDone })
//   status: 'idle' | 'starting' | 'recording' | 'processing' | 'error'
// - อัดด้วย MediaRecorder (ไฟล์เสียงจริงไว้ฟังย้อนหลัง)
// - วัดระดับเสียงทุก LEVEL_INTERVAL_MS ด้วย Web Audio (ใช้นับการหยุดนาน + แถบระดับเสียง)
// - ถอดเป็นข้อความไปพร้อมกัน (recognition.js startContinuousListening) → คำต่อนาที / วลีที่ใช้
//   (ถอดไม่ได้ เช่น ไม่ใช่ Chrome/Edge หรือไม่มีเน็ต → ยังได้ไฟล์เสียง + การหยุดนาน)
// - ครบ maxMs หรือกด finish() → onDone({ blob, mimeType, durationMs, levels, intervalMs, transcript, transcriptError })
// - component ถูกถอด (เปลี่ยนหน้า) → ปิดไมค์ ทิ้งของที่อัด
// =========================================================
import { useCallback, useEffect, useRef, useState } from 'react'
import { stop as stopSpeech } from '../utils/speech'
import { startContinuousListening } from '../utils/recognition'
import { LEVEL_INTERVAL_MS, RECORD_MS } from '../utils/speakingCheck'

export const isRecordingSupported =
  typeof window !== 'undefined' &&
  typeof window.MediaRecorder === 'function' &&
  typeof navigator !== 'undefined' &&
  Boolean(navigator.mediaDevices?.getUserMedia)

const HEARD_TIMEOUT_MS = 4000 // รอข้อความสุดท้ายจากระบบถอดเสียงหลังหยุดอัดได้นานสุด

// ชนิดไฟล์ที่เบราว์เซอร์อัดได้ (Chrome/Edge/Firefox = webm, Safari = mp4)
const MIME_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
const pickMimeType = () => MIME_TYPES.find((type) => window.MediaRecorder.isTypeSupported?.(type)) ?? ''

// error ของ getUserMedia → รหัสเดียวกับไมค์ฟังเสียง (ใช้ข้อความ mic.* ชุดเดิม)
const micError = (error) =>
  error?.name === 'NotAllowedError' || error?.name === 'SecurityError' ? 'not-allowed' : 'audio-capture'

// ระดับเสียง RMS ของช่วงเวลาสั้น ๆ (0–1)
function rmsOf(analyser, buffer) {
  analyser.getFloatTimeDomainData(buffer)
  let sum = 0
  for (const value of buffer) sum += value * value
  return Math.sqrt(sum / buffer.length)
}

export function useRecorder({ maxMs = RECORD_MS, onDone } = {}) {
  const [status, setStatus] = useState('idle')
  const [elapsedMs, setElapsedMs] = useState(0)
  const [level, setLevel] = useState(0)
  const [liveText, setLiveText] = useState('')
  const [error, setError] = useState(null)
  const sessionRef = useRef(null)
  const onDoneRef = useRef(onDone)
  const mountedRef = useRef(true)

  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  // ปิดไมค์ + ตัวจับเวลา + Web Audio ของรอบนี้
  const release = useCallback((session) => {
    clearInterval(session.timer)
    session.stream.getTracks().forEach((track) => track.stop())
    session.context?.close().catch(() => {})
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      const session = sessionRef.current
      sessionRef.current = null
      if (!session) return
      session.cancelled = true
      if (session.recorder.state !== 'inactive') session.recorder.stop()
      session.listening.stop()
      release(session)
    }
  }, [release])

  // จบการอัด → รวมไฟล์ + รอข้อความที่ถอดได้ → onDone
  const finish = useCallback(() => {
    const session = sessionRef.current
    if (!session || session.finishing) return
    session.finishing = true
    setStatus('processing')
    const durationMs = Math.min(maxMs, Date.now() - session.startedAt)
    clearInterval(session.timer)

    const recorded = new Promise((resolve) => {
      session.recorder.onstop = () => resolve()
      if (session.recorder.state === 'inactive') resolve()
      else session.recorder.stop()
    })
    // ระบบถอดข้อความไม่ตอบ (ค้าง) → ใช้ข้อความล่าสุดที่เห็น ไม่ให้หน้าค้างที่ "กำลังประมวลผล"
    const heardPromise = Promise.race([
      session.listening.stop(),
      new Promise((resolve) => setTimeout(() => resolve({ transcript: session.lastText, error: null }), HEARD_TIMEOUT_MS)),
    ])
    Promise.all([recorded, heardPromise]).then(([, heard]) => {
      release(session)
      if (session.cancelled || !mountedRef.current) return
      sessionRef.current = null
      const mimeType = session.recorder.mimeType || session.mimeType || 'audio/webm'
      setStatus('idle')
      setLevel(0)
      onDoneRef.current?.({
        blob: new Blob(session.chunks, { type: mimeType }),
        mimeType,
        durationMs,
        levels: session.levels,
        intervalMs: LEVEL_INTERVAL_MS,
        transcript: heard.transcript,
        transcriptError: heard.error,
      })
    })
  }, [maxMs, release])

  const start = useCallback(async () => {
    if (!isRecordingSupported || sessionRef.current) return
    stopSpeech()
    setStatus('starting')
    setError(null)
    setElapsedMs(0)
    setLiveText('')

    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
    } catch (failure) {
      if (!mountedRef.current) return
      setError(micError(failure))
      setStatus('error')
      return
    }
    if (!mountedRef.current) {
      stream.getTracks().forEach((track) => track.stop())
      return
    }

    const mimeType = pickMimeType()
    let recorder
    try {
      recorder = new window.MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    } catch {
      stream.getTracks().forEach((track) => track.stop())
      setError('record-failed')
      setStatus('error')
      return
    }

    const session = { stream, recorder, mimeType, chunks: [], levels: [], startedAt: Date.now(), timer: null }
    recorder.ondataavailable = (event) => {
      if (event.data?.size) session.chunks.push(event.data)
    }

    // ระดับเสียง (ใช้ไม่ได้ = ยังอัดได้ แค่ไม่มีแถบระดับเสียง/การหยุดนาน)
    let sample = () => 0
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      session.context = new AudioContextClass()
      const analyser = session.context.createAnalyser()
      analyser.fftSize = 1024
      session.context.createMediaStreamSource(stream).connect(analyser)
      const buffer = new Float32Array(analyser.fftSize)
      sample = () => rmsOf(analyser, buffer)
    } catch {
      session.context = null
    }

    session.lastText = ''
    session.listening = startContinuousListening({
      onText: (text) => {
        session.lastText = text
        if (mountedRef.current) setLiveText(text)
      },
    })
    sessionRef.current = session
    recorder.start(1000)
    setStatus('recording')

    session.timer = setInterval(() => {
      const value = sample()
      session.levels.push(value)
      const elapsed = Date.now() - session.startedAt
      setLevel(value)
      setElapsedMs(Math.min(maxMs, elapsed))
      if (elapsed >= maxMs) finish()
    }, LEVEL_INTERVAL_MS)
  }, [finish, maxMs])

  return { supported: isRecordingSupported, status, elapsedMs, level, liveText, error, start, finish }
}
