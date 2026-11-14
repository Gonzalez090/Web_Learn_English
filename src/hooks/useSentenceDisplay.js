// =========================================================
// useSentenceDisplay — ตัดสินว่าขั้นของบทเรียนจะแสดงอะไรบ้าง (ข้อความ / คำอ่านไทย / คำแปล)
// ตาม Stage + การตั้งค่าของผู้ใช้ (กติกาเดียวกับ VocabCard)
//   - Stage 1–3: ไม่แสดงข้อความเลย / Stage 4: ซ่อนไว้ กด "ดูข้อความ" / Stage 5+: แสดงเลย
//   - revealed = ข้อนี้เคยกดเปิดอะไรไปแล้วในขั้นก่อน { text, meaning } (ไม่ต้องกดซ้ำทุกขั้น)
//   - allowReveal = false → ไม่มีปุ่มเปิดดู และไม่ใช้ค่าที่เคยเปิดไว้ (ขั้น "ใช้เอง" ปิดข้อความเสมอ)
// ใช้:
//   const display = useSentenceDisplay(stage, { revealed, onReveal })
//   display.textVisible, display.canRevealText, display.revealText(), display.readingVisible,
//   display.meaningVisible, display.canRevealMeaning, display.revealMeaning()
// =========================================================
import { useState } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { englishTextMode, meaningStartsVisible, showThaiReading } from '../utils/display'

export function useSentenceDisplay(stage, { revealed, onReveal, allowReveal = true } = {}) {
  const thaiReadingSetting = useSettingsStore((state) => state.thaiReading)
  const thaiTranslationSetting = useSettingsStore((state) => state.thaiTranslation)
  const [textOpen, setTextOpen] = useState(allowReveal && Boolean(revealed?.text))
  const [meaningOpen, setMeaningOpen] = useState(allowReveal && Boolean(revealed?.meaning))

  const textMode = englishTextMode(stage.showText)
  const textVisible = textMode === 'shown' || (textMode === 'toggle' && textOpen)
  const meaningByDefault = meaningStartsVisible(thaiTranslationSetting)

  return {
    textVisible,
    canRevealText: allowReveal && textMode === 'toggle' && !textOpen,
    revealText: () => {
      setTextOpen(true)
      onReveal?.('text')
    },
    readingVisible: textVisible && showThaiReading(thaiReadingSetting, stage),
    meaningVisible: meaningOpen || meaningByDefault,
    canRevealMeaning: allowReveal && !meaningOpen && !meaningByDefault,
    revealMeaning: () => {
      setMeaningOpen(true)
      onReveal?.('meaning')
    },
  }
}
