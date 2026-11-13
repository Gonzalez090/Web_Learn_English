// =========================================================
// useSpeech — hook สำหรับเล่นเสียงภาษาอังกฤษ (ปกติ/ช้า)
// ใช้:
//   const { supported, speak, stop, speakingKey, voices, activeVoice } = useSpeech()
//   speak('Big dog!', { rate: 'slow', key: 's1-dog:slow' })
// - เสียงที่ผู้ใช้เลือกในหน้าตั้งค่า (voiceURI) ถูกใช้ให้อัตโนมัติ
// - speakingKey บอกว่าปุ่มไหนกำลังเล่นอยู่ (ทั้งแอปเล่นได้ทีละเสียง)
// =========================================================
import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { canSpeak, englishVoices, getSnapshot, pickVoice, speak, stop, subscribe } from '../utils/speech'

export function useSpeech() {
  const { speakingKey, voices, usingLocalFallback } = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const voiceURI = useSettingsStore((state) => state.voiceURI)

  const speakText = useCallback((input, options = {}) => speak(input, { voiceURI, ...options }), [voiceURI])
  const englishList = useMemo(() => englishVoices(voices), [voices])
  // เสียงที่ใช้จริงตอนนี้ (ถ้าเสียงออนไลน์ใช้ไม่ได้ จะเป็นเสียงในเครื่อง)
  const activeVoice = useMemo(
    () => pickVoice(voices, voiceURI, { preferLocal: usingLocalFallback }),
    [voices, voiceURI, usingLocalFallback],
  )

  return {
    supported: canSpeak,
    speak: speakText,
    stop,
    speakingKey,
    voices: englishList,
    activeVoice,
    usingLocalFallback,
  }
}
