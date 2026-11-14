// =========================================================
// SwapSentence — ประโยคที่สลับคำได้ (ส่วนที่ 2.2 "คำที่ใช้แทนได้ในบริบทนี้")
//   - คำสำคัญ (keywords) เป็นปุ่มขีดเส้นประ → แตะแล้วเปิดรายการคำแทน 3–5 คำ
//     แต่ละคำมี ความหมายไทย + ป้าย register + ปุ่มฟังคำนั้น
//   - แตะคำแทน → สลับเข้าไปในประโยคทันที แล้วเล่นเสียงประโยคใหม่ (ไฟล์ Kokoro มีครบทุกแบบ)
//   - สลับได้ทีละ 1 คำ (เปลี่ยนอีกคำ = คำแรกกลับเป็นคำเดิม) → ประโยคที่ได้มีไฟล์เสียงเสมอ
//   - คำที่ลงเสียงหนักเป็นตัวหนา + ลูกศรทำนองเสียงท้ายประโยค (ส่วนที่ 2.3)
// props:
//   item      { id, target, keywords, stressWords, intonation }
//   choice    { keyword, alternative } | null — คำที่สลับอยู่ตอนนี้ (component แม่ถือไว้)
//   onChoose  เรียกเมื่อเลือกคำใหม่ (null = กลับประโยคเดิม)
//   speakKey  key ของเสียงประโยค (ให้ปุ่ม SpeakButton ของประโยคเดียวกันรู้ว่ากำลังเล่น)
// =========================================================
import { Fragment, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowDownRight, ArrowUpRight, Square, Volume2 } from 'lucide-react'
import { useSpeech } from '../../hooks/useSpeech'
import { abortListening } from '../../utils/recognition'
import { currentSentence, splitKeywords } from '../../utils/swap'
import styles from './SwapSentence.module.css'

const ARROWS = { up: ArrowUpRight, down: ArrowDownRight }

// คำที่ใช้เทียบคำลงเสียงหนัก: ตัวเล็ก ตัดเครื่องหมายหัว-ท้าย
const bare = (word) =>
  String(word ?? '')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, '')

// ข้อความธรรมดา (ไม่ใช่คำสำคัญ) — คำลงเสียงหนักเป็นตัวหนา
function PlainText({ text, stressed }) {
  return text.split(/(\s+)/).map((token, index) =>
    stressed.has(bare(token)) && token.trim() ? (
      <strong key={index} className={styles.stress}>
        {token}
      </strong>
    ) : (
      <Fragment key={index}>{token}</Fragment>
    ),
  )
}

// ปุ่มฟังคำแทน 1 คำ (กดซ้ำตอนเล่น = หยุด)
function WordSound({ word, speakKey }) {
  const { t } = useTranslation()
  const { speak, stop, speakingKey } = useSpeech()
  const playing = speakingKey === speakKey
  const Icon = playing ? Square : Volume2
  return (
    <button
      type="button"
      className={playing ? `${styles.sound} ${styles.playing}` : styles.sound}
      aria-label={playing ? t('speech.stop') : t('swap.playWord', { word })}
      onClick={() => {
        if (playing) return stop()
        abortListening()
        return speak(word, { key: speakKey })
      }}
    >
      <Icon className={styles.soundIcon} aria-hidden="true" />
    </button>
  )
}

export default function SwapSentence({ item, choice, onChoose, speakKey }) {
  const { t } = useTranslation()
  const { speak } = useSpeech()
  const panelId = useId()
  const [openKeyword, setOpenKeyword] = useState(null)
  const keywords = item.keywords ?? []
  const text = currentSentence(item, choice)
  const stressed = new Set((item.stressWords ?? []).map(bare))
  const Arrow = ARROWS[item.intonation]

  // คำที่เป็นปุ่ม: คำสำคัญเดิม หรือคำที่สลับเข้าไปแล้ว
  const parts = splitKeywords(
    text,
    keywords.map((keyword) => ({
      word: choice?.keyword === keyword.word ? choice.alternative : keyword.word,
      key: keyword.word,
    })),
  )
  const open = keywords.find((keyword) => keyword.word === openKeyword)

  function choose(keyword, alternative) {
    const next = alternative ? { keyword: keyword.word, alternative: alternative.word } : null
    onChoose(next)
    setOpenKeyword(null)
    abortListening()
    speak(currentSentence(item, next), { key: speakKey })
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.sentence} lang="en">
        {parts.map((part, index) =>
          part.key ? (
            <button
              key={index}
              type="button"
              className={[
                styles.keyword,
                choice?.keyword === part.key ? styles.swapped : '',
                openKeyword === part.key ? styles.active : '',
              ].join(' ')}
              aria-expanded={openKeyword === part.key}
              aria-controls={panelId}
              aria-label={t('swap.keywordHint', { word: part.text })}
              onClick={() => setOpenKeyword(openKeyword === part.key ? null : part.key)}
            >
              {part.text}
            </button>
          ) : (
            <PlainText key={index} text={part.text} stressed={stressed} />
          ),
        )}
        {Arrow && (
          <span className={styles.arrowWrap} role="img" aria-label={t(`sentence.intonation.${item.intonation}`)}>
            <Arrow className={styles.arrow} aria-hidden="true" />
          </span>
        )}
      </p>

      {open && (
        <div className={styles.panel} id={panelId} role="group" aria-label={t('swap.choose')}>
          <p className={styles.panelTitle}>{t('swap.choose')}</p>
          <ul className={styles.options}>
            <li className={styles.option}>
              <button
                type="button"
                className={!choice || choice.keyword !== open.word ? `${styles.pick} ${styles.current}` : styles.pick}
                onClick={() => choose(open, null)}
              >
                <span className={styles.word} lang="en">
                  {open.word}
                </span>
                <span className={styles.meaning}>{t('swap.original')}</span>
              </button>
              <WordSound word={open.word} speakKey={`${item.id}:word:${open.word}:normal`} />
            </li>
            {open.alternatives.map((alternative) => (
              <li key={alternative.word} className={styles.option}>
                <button
                  type="button"
                  className={
                    choice?.keyword === open.word && choice.alternative === alternative.word
                      ? `${styles.pick} ${styles.current}`
                      : styles.pick
                  }
                  onClick={() => choose(open, alternative)}
                >
                  <span className={styles.word} lang="en">
                    {alternative.word}
                  </span>
                  <span className={styles.meaning} lang="th">
                    {alternative.meaningTh}
                  </span>
                  <span className={styles.tag}>{t(`register.${alternative.register}`)}</span>
                </button>
                <WordSound word={alternative.word} speakKey={`${item.id}:word:${alternative.word}:normal`} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
