// =========================================================
// MicButton — ปุ่ม 🎤 พูดตาม (ส่วนที่ 2.1 ของสเปก)
//   แตะ → ไมค์เริ่มฟัง (เสียงที่กำลังเล่นจะหยุดก่อน)
//   แตะอีกครั้งระหว่างฟัง → หยุดฟังแล้วให้คะแนนทันที
//   พูดจบ → เทียบกับคำเป้าหมาย → แสดงผล (SpeechResult)
// props:
//   target     = คำ/ประโยคเป้าหมาย
//   acceptAlso = คำอื่นที่ยอมรับ (ระบบมักได้ยินคำสั้น ๆ เป็นคำใกล้เคียง)
//   lenient    = ตรวจแบบผ่อนปรน (Stage 2–3)
//   showText   = แสดงตัวอักษรภาษาอังกฤษในผลได้ไหม (Stage 1–3 = false)
//   onResult   = เรียกเมื่อได้ผล (ขั้นที่ 4 ใช้ให้ XP / บันทึกข้อที่พลาด)
//   onError    = เรียกเมื่อฟังไม่สำเร็จ ส่งรหัส error (เช่น 'no-speech', 'not-allowed')
// =========================================================
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Mic, Square } from 'lucide-react'
import { useRecognition } from '../hooks/useRecognition'
import { compareSpeech } from '../utils/compareWords'
import SpeechResult from './SpeechResult'
import styles from './MicButton.module.css'

// error จากระบบรับเสียง → key ข้อความที่อธิบายให้ผู้ใช้เข้าใจ
const ERROR_MESSAGE_KEY = {
  'not-allowed': 'mic.errorPermission',
  'service-not-allowed': 'mic.errorPermission',
  'no-speech': 'mic.errorNoSpeech',
  'audio-capture': 'mic.errorNoMic',
  network: 'mic.errorNetwork',
}

export default function MicButton({
  target,
  acceptAlso = [],
  lenient = false,
  showText = true,
  onResult,
  onError,
  size = 'md',
}) {
  const { t } = useTranslation()
  const { supported, status, interim, error, listen, stop } = useRecognition()
  const [result, setResult] = useState(null)
  const [attempts, setAttempts] = useState(0)

  // แจ้ง error ให้ component แม่ครั้งเดียวต่อการฟัง 1 ครั้ง
  // (เก็บ onError ไว้ใน ref → ฟังก์ชันใหม่ทุกครั้งที่ render ไม่ทำให้แจ้งซ้ำ)
  const onErrorRef = useRef(onError)
  useEffect(() => {
    onErrorRef.current = onError
  })
  useEffect(() => {
    if (status === 'error' && error) onErrorRef.current?.(error)
  }, [status, error])

  if (!supported) {
    return (
      <p className={styles.unsupported} role="note">
        {t('mic.notSupported')}
      </p>
    )
  }

  const listening = status === 'listening'

  async function handleClick() {
    if (listening) {
      stop()
      return
    }
    setResult(null)
    const alternatives = await listen()
    if (!alternatives) return
    const scored = compareSpeech(target, alternatives, { lenient, acceptAlso })
    setResult(scored)
    setAttempts((count) => count + 1)
    onResult?.(scored)
  }

  return (
    <div className={`${styles.wrap} ${styles[size]}`}>
      <button
        type="button"
        className={listening ? `${styles.button} ${styles.listening}` : styles.button}
        aria-pressed={listening}
        onClick={handleClick}
      >
        {listening ? <Square className={styles.icon} aria-hidden="true" /> : <Mic className={styles.icon} aria-hidden="true" />}
        <span>{listening ? t('mic.listening') : result ? t('mic.again') : t('mic.speak')}</span>
      </button>

      {/* ระหว่างพูด: แสดงสิ่งที่ได้ยินสด ๆ (เฉพาะ Stage ที่แสดงตัวอักษรได้) */}
      {listening && showText && interim && (
        <p className={styles.interim} lang="en" aria-live="polite">
          {interim}
        </p>
      )}

      {status === 'error' && error && (
        <p className={styles.error} role="alert">
          {t(ERROR_MESSAGE_KEY[error] ?? 'mic.errorGeneric')}
        </p>
      )}

      {result && !listening && <SpeechResult result={result} attempt={attempts - 1} showText={showText} />}
    </div>
  )
}
