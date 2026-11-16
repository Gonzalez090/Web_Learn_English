// =========================================================
// PhonicsIntroStep — ขั้น "เสียงใหม่ในบทนี้" (ทั้งบท) ของบท phonics (Stage 6)
//   ทีละเสียงตามลำดับ synthetic phonics: ตัวอักษรใหญ่ (S s) + /s/ + เสียงไทยที่ใกล้เคียง + วิธีออกเสียง (ปาก/ลิ้น)
//   + คำตัวอย่างที่พูดได้แล้ว (ระบายสีตัวอักษรนั้น)
//   เปิดการ์ด → พูดคำตัวอย่างให้ฟังทีละคำ ให้หูจับเสียงที่เหมือนกันในทุกคำ
//   (TTS ออกเสียงหน่วยเสียงเดี่ยวไม่ได้ → ใช้ "s as in sun" + เสียงไทยใกล้เคียงแทน)
// props: lesson (lesson.sounds = id เสียงใน data/phonics.json), onDone
// =========================================================
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RotateCcw } from 'lucide-react'
import phonicsData from '../../data/phonics.json'
import { useSpeech } from '../../hooks/useSpeech'
import { markGrapheme } from '../../utils/reading'
import Button from '../Button'
import stepStyles from './Step.module.css'
import styles from './PhonicsIntroStep.module.css'

const SOUNDS_BY_ID = Object.fromEntries(phonicsData.sounds.map((sound) => [sound.id, sound]))
const GAP_MS = 350 // พักระหว่างคำตัวอย่าง

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// "s" → "S s", "sh" → "Sh sh" / ตัวสะกดพิเศษ (a_e, th ก้อง, schwa) ใช้ป้ายชื่อของมันเอง
const bothCases = (grapheme) => `${grapheme.charAt(0).toUpperCase()}${grapheme.slice(1)} ${grapheme}`
const lettersOf = (sound) => sound.label ?? bothCases(sound.grapheme)

export default function PhonicsIntroStep({ lesson, onDone }) {
  const { t } = useTranslation()
  const { speak, stop, speakingKey } = useSpeech()
  const sounds = (lesson.sounds ?? []).map((id) => SOUNDS_BY_ID[id]).filter(Boolean)
  const [index, setIndex] = useState(0)
  const [replay, setReplay] = useState(0) // กด "ฟังอีกครั้ง" → เล่นคำตัวอย่างใหม่
  const sound = sounds[index]
  const keyOf = (word) => `${lesson.id}:phonics:${word}`

  // เปิดการ์ด → พูดคำตัวอย่างทีละคำ
  useEffect(() => {
    let active = true
    ;(async () => {
      for (const word of sound.examples) {
        if (!active) return
        await speak(word, { key: keyOf(word) })
        await wait(GAP_MS)
      }
    })()
    return () => {
      active = false
    }
    // เล่นใหม่เมื่อเปลี่ยนเสียง หรือกดฟังอีกครั้ง
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, replay])

  // ออกจากขั้นกลางคัน → หยุดเสียง
  useEffect(() => () => stop(), [stop])

  const last = index + 1 >= sounds.length

  return (
    <div className={stepStyles.step}>
      <p className={stepStyles.instruction}>{t('phonics.introInstruction')}</p>
      <p className={styles.count}>{t('phonics.soundN', { n: index + 1, total: sounds.length })}</p>

      <div key={sound.id} className={styles.card}>
        <span className={styles.letters} lang="en">
          {lettersOf(sound)}
        </span>
        {/* ตัวที่ไม่ออกเสียง (e ท้ายคำ) ไม่มี /ipa/ */}
        {sound.ipa && <span className={styles.ipa}>/{sound.ipa}/</span>}
        <p className={styles.like} lang="th">
          {sound.silent ? t('phonics.silent') : t('phonics.soundLike', { sound: sound.soundTh })}
        </p>
        <p className={styles.tip} lang="th">
          {sound.tipTh}
        </p>
      </div>

      <p className={styles.examplesLabel}>{t('phonics.examples')}</p>
      <div className={styles.examples}>
        {sound.examples.map((word) => {
          const part = markGrapheme(word, sound.grapheme)
          const playing = speakingKey === keyOf(word)
          return (
            <button
              key={word}
              type="button"
              lang="en"
              className={playing ? `${styles.example} ${styles.playing}` : styles.example}
              onClick={() => speak(word, { key: keyOf(word) })}
            >
              {part.before}
              {part.match && <span className={styles.mark}>{part.match}</span>}
              {part.after}
            </button>
          )
        })}
      </div>
      <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => setReplay((count) => count + 1)}>
        {t('phonics.playAgain')}
      </Button>

      <div className={stepStyles.actions}>
        <Button block size="lg" onClick={() => (last ? onDone() : setIndex(index + 1))}>
          {t(last ? 'lesson.next' : 'phonics.nextSound')}
        </Button>
      </div>
    </div>
  )
}
