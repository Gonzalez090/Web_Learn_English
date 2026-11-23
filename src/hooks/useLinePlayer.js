// =========================================================
// useLinePlayer — เล่นหลายบรรทัดต่อกันทีละบรรทัด และบอกว่ากำลังเล่นบรรทัดไหน (ใช้ไฮไลต์บรรทัด)
// ใช้ในขั้นฟังทั้งบท: บทสนทนา / เรื่องเล่า / คำคล้องจอง
//   const { current, rate, playing, playAll, stopAll } = useLinePlayer(lines)
//     current = บรรทัดที่กำลังเล่น (-1 = ไม่ได้เล่น), rate = ความเร็วของรอบที่กำลังเล่น ('normal' | 'slow' | null)
//   const finished = await playAll({ rate: 'slow', onLine: (index) => … })
//     → true = เล่นจบครบทุกบรรทัด / false = ถูกตัดกลางทาง (กดฟังอย่างอื่น, เปลี่ยนหน้า) หรือเล่นเสียงไม่ได้
//     onLine(index) = บรรทัดนั้นเล่นจบ (หรือเล่นไม่สำเร็จ) แล้ว
//   ไม่ส่ง rate → ความเร็วเริ่มต้นจากหน้าตั้งค่า
// - รหัสเสียงของบรรทัด = lineSpeakKey(line) ทุกความเร็ว → ปุ่มลำโพงของบรรทัดนั้น (LineButton) ขึ้นสถานะ "กำลังเล่น" ไปด้วย
// - เสียงถูกตัด → หยุดเล่นบรรทัดต่อไปทันที (ไม่แย่งเสียงกับปุ่มที่ผู้ใช้เพิ่งกด)
// =========================================================
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSpeech } from './useSpeech'

// รหัสเสียงของบรรทัด (ใช้ร่วมกับ LineButton ของบรรทัดนั้น)
export const lineSpeakKey = (line) => `${line.id}:line`

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const IDLE = { index: -1, rate: null }

export function useLinePlayer(lines, { gapMs = 450 } = {}) {
  const { speak, stop, defaultRate } = useSpeech()
  const [state, setState] = useState(IDLE)
  const runRef = useRef(0) // เพิ่มทุกครั้งที่เริ่ม/หยุด → รอบเก่ารู้ตัวว่าถูกยกเลิก

  // ถอด component (เปลี่ยนขั้น/เปลี่ยนหน้า) → เลิกเล่นบรรทัดต่อไป
  useEffect(
    () => () => {
      runRef.current += 1
    },
    [],
  )

  const playAll = useCallback(
    async ({ rate = defaultRate, from = 0, onLine } = {}) => {
      runRef.current += 1
      const run = runRef.current
      for (let index = from; index < lines.length; index += 1) {
        setState({ index, rate })
        const ok = await speak(lines[index].target, { rate, key: lineSpeakKey(lines[index]) })
        if (runRef.current !== run) return false
        onLine?.(index)
        if (!ok) {
          setState(IDLE)
          return false
        }
        if (index < lines.length - 1) await wait(gapMs)
        if (runRef.current !== run) return false
      }
      setState(IDLE)
      return true
    },
    [lines, speak, gapMs, defaultRate],
  )

  const stopAll = useCallback(() => {
    runRef.current += 1
    setState(IDLE)
    stop()
  }, [stop])

  return { current: state.index, rate: state.rate, playing: state.index >= 0, playAll, stopAll }
}
