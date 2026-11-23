// =========================================================
// MicButton — ปุ่ม 🎤 พูดตาม (ส่วนที่ 2.1 ของสเปก)
//   แตะ → ไมค์เริ่มฟัง (เสียงที่กำลังเล่นจะหยุดก่อน)
//   แตะอีกครั้งระหว่างฟัง → หยุดฟังแล้วให้คะแนนทันที
//   พูดจบ → เทียบกับคำเป้าหมาย → แสดงผล (SpeechResult)
//   ส่ง recast (Stage 4+) → พูดยังไม่ถูก ระบบทวนประโยคที่ถูกให้ฟังทันที (ส่วนที่ 2.4) แล้วให้ลองใหม่
// props:
//   target     = คำ/ประโยคเป้าหมาย
//   acceptAlso = คำอื่นที่ยอมรับ (ระบบมักได้ยินคำสั้น ๆ เป็นคำใกล้เคียง)
//   lenient    = ตรวจแบบผ่อนปรน (Stage 2–3)
//   showText   = แสดงตัวอักษรภาษาอังกฤษในผลได้ไหม (Stage 1–3 = false)
//   recast     = ข้อในบทเรียน { target, commonErrors } → เปิดการทวนกลับแบบพ่อแม่ (ไม่ส่ง = ไม่ทวน)
//   speakId    = รหัสของปุ่มเสียงทวนกลับ (ไม่ซ้ำกันในหน้า)
//   label      = ข้อความบนปุ่ม (ค่าเริ่มต้น "พูดตาม")
//   evaluate   = (alternatives, attempt) => ผลแบบ compareSpeech — ให้คะแนนแบบอื่นแทนการเทียบทั้งประโยค
//                (เช่น เล่าเรื่องเองจากภาพ ตรวจคำสำคัญ) ผลมี recast ได้ → พูดทวนกลับให้เหมือนกัน
//   wordsLabel = ป้ายหน้าแถวคำในผล (เช่น "คำสำคัญ:")
//   onResult   = เรียกเมื่อได้ผล (ขั้นที่ 4 ใช้ให้ XP / บันทึกข้อที่พลาด)
//   onError    = เรียกเมื่อฟังไม่สำเร็จ ส่งรหัส error (เช่น 'no-speech', 'not-allowed')
//   onInterim  = (ข้อความ) => void  สิ่งที่ได้ยินสด ๆ ระหว่างพูด ('' เมื่อหยุดฟัง) — ขั้นอ่านใช้ไฮไลต์คำที่อ่านถึงแล้ว
// =========================================================
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Mic, Square } from 'lucide-react'
import { useRecognition } from '../hooks/useRecognition'
import { useSpeech } from '../hooks/useSpeech'
import { compareSpeech } from '../utils/compareWords'
import { applyRecast } from '../utils/recast'
import { micErrorMessageKey } from '../utils/recognition'
import { playSfx } from '../utils/sfx'
import SpeechResult from './SpeechResult'
import styles from './MicButton.module.css'

export default function MicButton({
  target,
  acceptAlso = [],
  lenient = false,
  showText = true,
  recast = null,
  speakId = 'mic',
  label,
  evaluate,
  wordsLabel,
  onResult,
  onError,
  onInterim,
  size = 'md',
}) {
  const { t } = useTranslation()
  const { supported, status, interim, error, listen, stop } = useRecognition()
  const { speak } = useSpeech()
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

  // ส่งสิ่งที่ได้ยินสด ๆ ให้ component แม่ (หยุดฟังแล้ว → '')
  const onInterimRef = useRef(onInterim)
  useEffect(() => {
    onInterimRef.current = onInterim
  })
  useEffect(() => {
    onInterimRef.current?.(status === 'listening' ? interim : '')
  }, [status, interim])

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
    let scored = evaluate
      ? evaluate(alternatives, attempts)
      : compareSpeech(target, alternatives, { lenient, acceptAlso })
    if (recast && !evaluate) scored = applyRecast(recast, scored, attempts)
    setResult(scored)
    setAttempts((count) => count + 1)
    // พูดผ่าน → เสียง "ติ๊ง" ทันที (XP/ภารกิจอาจให้ทีหลังตอนกดไปต่อ) — ได้การ์ดพร้อมกัน sfx เลือกเสียงที่สำคัญกว่าเอง
    if (scored.passed) playSfx('pass')
    onResult?.(scored)
    // ทวนประโยคที่ถูกให้ฟังทันที แบบพ่อแม่ ("Yes! He goes to school.")
    if (scored.recast) speak(scored.recast.lines, { key: `${speakId}:recast:normal` })
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
        <span>{listening ? t('mic.listening') : result ? t('mic.again') : (label ?? t('mic.speak'))}</span>
      </button>

      {/* ระหว่างพูด: แสดงสิ่งที่ได้ยินสด ๆ (เฉพาะ Stage ที่แสดงตัวอักษรได้) */}
      {listening && showText && interim && (
        <p className={styles.interim} lang="en" aria-live="polite">
          {interim}
        </p>
      )}

      {status === 'error' && error && (
        <p className={styles.error} role="alert">
          {t(micErrorMessageKey(error))}
        </p>
      )}

      {result && !listening && (
        <SpeechResult
          result={result}
          attempt={attempts - 1}
          showText={showText}
          speakId={speakId}
          wordsLabel={wordsLabel}
        />
      )}
    </div>
  )
}
