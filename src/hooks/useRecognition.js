// =========================================================
// useRecognition — hook สำหรับฟังเสียงพูดผ่านไมค์ 1 ครั้ง
// ใช้:
//   const { supported, status, ready, interim, error, listen, stop } = useRecognition()
//   const alternatives = await listen()   // [{ transcript, confidence }] หรือ null ถ้าไม่สำเร็จ
// status: 'idle' | 'listening' | 'done' | 'error'
// ready: ระหว่าง 'listening' — false = กำลังเปิดไมค์ (ยังไม่ควรพูด) / true = ไมค์รับเสียงแล้ว พูดได้เลย
// - component ถูกถอดออก (เปลี่ยนหน้า) → ยกเลิกการฟังของตัวเองอัตโนมัติ
// =========================================================
import { useCallback, useEffect, useRef, useState } from 'react'
import { abortListening, isRecognitionSupported, startListening, stopListening } from '../utils/recognition'
import { markPractice } from '../utils/studyActivity'
import { useProgressStore } from '../store/progressStore'

export function useRecognition() {
  const [status, setStatus] = useState('idle')
  const [interim, setInterim] = useState('')
  const [error, setError] = useState(null)
  const [ready, setReady] = useState(false) // ไมค์รับเสียงจริงแล้ว (ระหว่าง status 'listening')
  const tokenRef = useRef(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      abortListening(tokenRef.current)
    }
  }, [])

  const listen = useCallback(async () => {
    markPractice() // นับเวลาเรียนในหน้าฝึก (hooks/useStudyTimer.js)
    setStatus('listening')
    setReady(false)
    setInterim('')
    setError(null)
    const { token, promise } = startListening({
      onInterim: (text) => mountedRef.current && setInterim(text),
      onReady: () => mountedRef.current && setReady(true),
    })
    tokenRef.current = token
    const result = await promise
    if (!mountedRef.current || tokenRef.current !== token) return null

    if (result.ok) {
      // นับนาทีที่พูดภาษาอังกฤษ (ขั้นที่ 18) — ที่เดียวทั้งแอป ทุกหน้าที่ใช้ไมค์ผ่าน hook นี้
      useProgressStore.getState().addSpeakingTime(result.speechMs)
      setStatus('done')
      return result.alternatives
    }
    // ถูกยกเลิกเอง (เช่น กดปุ่มอื่น) ไม่ใช่ error ที่ต้องแจ้งผู้ใช้
    if (result.error === 'aborted') {
      setStatus('idle')
      return null
    }
    setError(result.error)
    setStatus('error')
    return null
  }, [])

  const stop = useCallback(() => stopListening(tokenRef.current), [])

  const reset = useCallback(() => {
    abortListening(tokenRef.current)
    setStatus('idle')
    setInterim('')
    setError(null)
  }, [])

  return { supported: isRecognitionSupported, status, ready, interim, error, listen, stop, reset }
}
