// =========================================================
// LessonSummaryPage — หน้าสรุปท้ายบท (/lesson/:lessonId/summary)
// แสดง: XP ที่ได้, คะแนน, Stage ที่เพิ่งปลดล็อก, ข้อที่ทำได้, ข้อที่ต้องฝึกซ้ำ (+ ปุ่มฝึกซ้ำเฉพาะข้อที่พลาด)
// ผลมาจาก LessonPlayer ทาง navigation state — เข้าหน้านี้ตรง ๆ (ไม่มีผล) → ชวนเริ่มบทเรียน
// ⚠️ Stage 1–3 แสดงแค่ภาพ + ปุ่มฟัง (ไม่แสดงคำภาษาอังกฤษ)
// =========================================================
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cityMap, getStage } from '../data'
import { placesUnlockedBy } from '../utils/places'
import { useLesson } from '../hooks/useLessons'
import { useLocalized } from '../hooks/useLocalized'
import { englishTextMode } from '../utils/display'
import { LESSON_FLOWS } from '../utils/lessonSteps'
import { ICONS } from '../utils/icons'
import Page from '../components/Page'
import Section from '../components/Section'
import Button from '../components/Button'
import Picture from '../components/Picture'
import SpeakButton from '../components/SpeakButton'
import NotFoundPage from './NotFoundPage'
import styles from './LessonSummaryPage.module.css'

const GREAT_SCORE = 80

// ตรวจรูปแบบผลที่ได้จาก state (กันค่าแปลก ๆ)
function readResult(state) {
  if (!state || !Number.isFinite(state.score) || !Array.isArray(state.missedIds)) return null
  const ids = (list) => (Array.isArray(list) ? list.filter((id) => typeof id === 'string') : [])
  return {
    xp: Number.isFinite(state.xp) ? state.xp : 0,
    score: state.score,
    missedIds: ids(state.missedIds),
    itemIds: ids(state.itemIds),
    newlyUnlocked: Array.isArray(state.newlyUnlocked) ? state.newlyUnlocked.filter(Number.isInteger) : [],
  }
}

// withPicture = false → รายการประโยค (บทสนทนา/คำคล้องจองใช้ภาพฉากเดียวกันทั้งบท ไม่ต้องโชว์ภาพซ้ำ)
function ItemGrid({ items, showText, withPicture = true }) {
  return (
    <ul className={withPicture ? styles.items : styles.lines}>
      {items.map((item) => {
        const text = item.target ?? item.word
        return (
          <li key={item.id} className={withPicture ? styles.item : styles.line}>
            {withPicture && <Picture image={item.image} size="fill" />}
            {showText && (
              <span className={styles.itemText} lang="en">
                {text}
              </span>
            )}
            <SpeakButton text={text} id={`${item.id}:summary`} showSlow={false} size="sm" />
          </li>
        )
      })}
    </ul>
  )
}

export default function LessonSummaryPage() {
  const { lessonId } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const loc = useLocalized()

  const lesson = useLesson(lessonId)
  if (!lesson) return <NotFoundPage />
  const stage = getStage(lesson.stageId)
  const result = readResult(state)
  const backTo = `/learn/${stage.id}`

  if (!result) {
    return (
      <Page title={t('lesson.summaryTitle')} subtitle={loc(lesson, 'title')} backTo={backTo}>
        <p className={styles.note}>{t('lesson.noResult')}</p>
        <Button to={`/lesson/${lesson.id}`} size="lg" block>
          {t('lesson.start')}
        </Button>
      </Page>
    )
  }

  // Stage 4 (กดดูข้อความได้) ได้เห็นข้อความในบทแล้ว → สรุปท้ายบทแสดงประโยคเลย / Stage 1–3 ไม่แสดง
  const showText = englishTextMode(stage.showText) !== 'hidden'
  const withPicture = !LESSON_FLOWS[lesson.type]?.sharedImage
  const played = lesson.items.filter((item) => !result.itemIds.length || result.itemIds.includes(item.id))
  const missed = played.filter((item) => result.missedIds.includes(item.id))
  const mastered = played.filter((item) => !result.missedIds.includes(item.id))
  const XpIcon = ICONS.xp
  const UnlockIcon = ICONS.unlocked

  return (
    <Page title={t('lesson.summaryTitle')} subtitle={loc(lesson, 'title')} backTo={backTo}>
      <div className={styles.hero}>
        <p className={styles.headline}>
          {result.score >= GREAT_SCORE ? t('lesson.summaryGreat') : t('lesson.summaryGood')}
        </p>
        <div className={styles.stats}>
          <span className={styles.stat}>
            <XpIcon className={styles.xpIcon} aria-hidden="true" />
            {t('lesson.xpEarned', { xp: result.xp })}
          </span>
          <span className={styles.stat}>{t('lesson.score', { score: result.score })}</span>
        </div>
      </div>

      {result.newlyUnlocked.map((stageId) => (
        <div key={stageId} className={styles.unlocked} role="status">
          <UnlockIcon className={styles.unlockIcon} aria-hidden="true" />
          <span className={styles.unlockedText}>{t('lesson.stageUnlocked', { n: stageId })}</span>
          <Button to={`/learn/${stageId}`} size="sm">
            {t('lesson.goStage')}
          </Button>
        </div>
      ))}

      {/* ผ่าน Stage แล้วเปิดสถานที่ใหม่ในแผนที่เมือง (ขั้นที่ 14) */}
      {placesUnlockedBy(cityMap, result.newlyUnlocked).map((place) => (
        <div key={place.placeId} className={styles.unlocked} role="status">
          <UnlockIcon className={styles.unlockIcon} aria-hidden="true" />
          <span className={styles.unlockedText}>{t('place.unlockedTitle', { name: loc(place, 'name') })}</span>
          <Button to={`/place/${place.placeId}`} size="sm">
            {t('place.visit')}
          </Button>
        </div>
      ))}

      {mastered.length > 0 && (
        <Section title={t('lesson.mastered')}>
          <ItemGrid items={mastered} showText={showText} withPicture={withPicture} />
        </Section>
      )}

      {missed.length > 0 && (
        <Section title={t('lesson.practice')} description={t('lesson.inReview')}>
          <ItemGrid items={missed} showText={showText} withPicture={withPicture} />
        </Section>
      )}

      <div className={styles.actions}>
        {missed.length > 0 && (
          <Button
            size="lg"
            block
            icon={ICONS.review}
            onClick={() =>
              navigate(`/lesson/${lesson.id}`, { state: { onlyItemIds: missed.map((item) => item.id) } })
            }
          >
            {t('lesson.retryMissed')}
          </Button>
        )}
        <Button to={`/lesson/${lesson.id}`} variant={missed.length > 0 ? 'secondary' : 'primary'} block>
          {t('lesson.playAgain')}
        </Button>
        <Button to={backTo} variant="ghost" block>
          {t('lesson.backToStage')}
        </Button>
      </div>
    </Page>
  )
}
