// =========================================================
// RecordingPlayer — เล่นไฟล์เสียงที่อัดไว้ (Blob จาก IndexedDB) ด้วยตัวเล่นของเบราว์เซอร์
//   กดเล่น → หยุดเสียงอื่นของเว็บก่อน (เล่นได้ทีละเสียง) / ถอดออก → คืนหน่วยความจำของไฟล์
// props: blob, label (ชื่อสำหรับโปรแกรมอ่านหน้าจอ)
// =========================================================
import { useEffect, useRef } from 'react'
import { stop as stopSpeech } from '../../utils/speech'
import styles from './Speaking.module.css'

// ตัวเล่นที่กำลังเล่นอยู่ (กดเล่นอีกอัน → อันเก่าหยุด)
let playingElement = null

export default function RecordingPlayer({ blob, label }) {
  const audioRef = useRef(null)

  // ผูกไฟล์เข้ากับตัวเล่นโดยตรง (ไม่ต้องเก็บ URL ใน state) — เปลี่ยนไฟล์/ถอดออก → คืนหน่วยความจำ
  useEffect(() => {
    const element = audioRef.current
    if (!element || !blob) return undefined
    const objectUrl = URL.createObjectURL(blob)
    // ไฟล์ webm จาก MediaRecorder ไม่มีความยาวในหัวไฟล์ (duration = Infinity → ตัวเล่นขึ้น 0:00 เลื่อนตำแหน่งไม่ได้)
    // → กระโดดไปท้ายไฟล์ให้เบราว์เซอร์คำนวณความยาว แล้วกลับมาที่ 0
    const resetPosition = () => {
      element.removeEventListener('timeupdate', resetPosition)
      element.currentTime = 0
    }
    const fixDuration = () => {
      if (element.duration !== Infinity) return
      element.addEventListener('timeupdate', resetPosition)
      element.currentTime = 1e101
    }
    element.addEventListener('loadedmetadata', fixDuration)
    element.src = objectUrl
    return () => {
      element.removeEventListener('loadedmetadata', fixDuration)
      element.removeEventListener('timeupdate', resetPosition)
      element.pause()
      element.removeAttribute('src')
      URL.revokeObjectURL(objectUrl)
      if (playingElement === element) playingElement = null
    }
  }, [blob])

  const handlePlay = (event) => {
    stopSpeech()
    if (playingElement && playingElement !== event.currentTarget) playingElement.pause()
    playingElement = event.currentTarget
  }

  if (!blob) return null
  return <audio ref={audioRef} className={styles.player} controls preload="metadata" aria-label={label} onPlay={handlePlay} />
}
