// =========================================================
// NpcCard — คนประจำสถานที่ (NPC) ในหน้าสถานที่ (ส่วนที่ 7 — ขั้นที่ 15)
//   ภาพ + ชื่อ + บทบาท + นิสัย/สไตล์การพูด → ระดับความสนิท + แถบความคืบหน้า ("คุยอีก N ครั้ง")
//   → "เรื่องที่คุยกันได้": ระดับละ 1 คู่ (NPC พูด → เราตอบ) — ปลดล็อกตามระดับความสนิท (ยิ่งสนิท ยิ่งคุยเรื่องส่วนตัว)
//      ฟังบท NPC ได้ (ป้าโรสพูดช้า = เสียงช้า) / ฝึกพูดประโยคตอบผ่านไมค์ — ผ่านครั้งแรกต่อประโยค = XP พูดตาม
//   ความสนิทเพิ่มจากการคุยบทสนทนาสุ่มกับคนนี้จนจบ (TalkPage) — ไม่ใช่จากการกดฝึกในการ์ด
// props: npc (world.json npcs[]), points (แต้มความสนิท)
// =========================================================
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { CornerDownRight, Lock } from 'lucide-react'
import { useLocalized } from '../hooks/useLocalized'
import { useProgressStore } from '../store/progressStore'
import { friendshipProgress } from '../utils/friendship'
import { XP } from '../utils/lessonSteps'
import { ICONS } from '../utils/icons'
import Picture from './Picture'
import MicButton from './MicButton'
import LineButton from './lesson/LineButton'
import styles from './NpcCard.module.css'

// แถบความสนิท: ระดับ + คุยอีกกี่ครั้งถึงระดับถัดไป
export function FriendshipMeter({ points }) {
  const { t } = useTranslation()
  const { level, next, remaining, ratio } = friendshipProgress(points)
  const HeartIcon = ICONS.friendship
  return (
    <div className={styles.meter}>
      <p className={styles.meterTop}>
        <HeartIcon className={styles.heart} aria-hidden="true" />
        <span className={styles.levelName}>{t(`npc.level.${level}`)}</span>
      </p>
      <div
        className={styles.bar}
        role="progressbar"
        aria-label={t('npc.friendship')}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(ratio * 100)}
      >
        <span className={styles.fill} style={{ width: `${ratio * 100}%` }} />
      </div>
      <p className={styles.meterNote}>
        {next === null ? t('npc.maxLevel') : t('npc.toNext', { count: remaining, level: t(`npc.level.${next}`) })}
      </p>
    </div>
  )
}

export default function NpcCard({ npc, points = 0 }) {
  const { t } = useTranslation()
  const loc = useLocalized()
  const addXp = useProgressStore((state) => state.addXp)
  const trackEvent = useProgressStore((state) => state.trackEvent)
  const passedRef = useRef(new Set()) // ประโยคตอบที่พูดผ่านแล้วในหน้านี้ (ได้ XP ครั้งเดียว)
  const { level } = friendshipProgress(points)

  function handleReply(index, result) {
    if (!result.passed || passedRef.current.has(index)) return
    passedRef.current.add(index)
    addXp(XP.speak)
    trackEvent('speakPass')
  }

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <Picture image={npc.image} size="sm" alt={loc(npc, 'name')} className={styles.avatar} />
        <div className={styles.who}>
          <h3 className={styles.name}>{loc(npc, 'name')}</h3>
          <p className={styles.role}>{loc(npc, 'role')}</p>
          <p className={styles.style}>{loc(npc, 'personality')}</p>
        </div>
      </header>

      <FriendshipMeter points={points} />

      <div className={styles.chats}>
        <p className={styles.label}>{t('npc.chats')}</p>
        <ol className={styles.chatList}>
          {npc.levels.map((entry, index) =>
            index <= level ? (
              <li key={entry.npc.text} className={styles.chat}>
                <div className={styles.line}>
                  <span className={styles.lineText}>
                    <span className={styles.speaker}>{loc(npc, 'name')}</span>
                    <span lang="en">{entry.npc.text}</span>
                    <span className={styles.meaning} lang="th">
                      {entry.npc.translationTh}
                    </span>
                  </span>
                  <LineButton
                    text={entry.npc.text}
                    rate={npc.speechRate}
                    fileVoice={npc.voice}
                    speakKey={`${npc.id}:l${index}`}
                    label={t('npc.hearLine')}
                  />
                </div>
                <div className={`${styles.line} ${styles.reply}`}>
                  <CornerDownRight className={styles.replyIcon} aria-hidden="true" />
                  <span className={styles.lineText}>
                    <span className={styles.speaker}>{t('npc.youReply')}</span>
                    <span lang="en">{entry.reply.text}</span>
                    <span className={styles.meaning} lang="th">
                      {entry.reply.translationTh}
                    </span>
                  </span>
                  <LineButton text={entry.reply.text} speakKey={`${npc.id}:r${index}`} label={t('npc.hearReply')} />
                </div>
                <div className={styles.practice}>
                  <MicButton
                    target={entry.reply.text}
                    speakId={`${npc.id}:r${index}:mic`}
                    onResult={(result) => handleReply(index, result)}
                    size="sm"
                  />
                </div>
              </li>
            ) : (
              <li key={entry.npc.text} className={`${styles.chat} ${styles.locked}`}>
                <Lock className={styles.lockIcon} aria-hidden="true" />
                <span>{t('npc.lockedChat', { level: t(`npc.level.${index}`) })}</span>
              </li>
            ),
          )}
        </ol>
      </div>
    </article>
  )
}
