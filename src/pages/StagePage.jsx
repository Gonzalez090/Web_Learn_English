// =========================================================
// StagePage — รายการบทเรียนของ Stage หนึ่ง (/learn/:stageId)
// - Stage ยังล็อก → แจ้งให้เรียน Stage ก่อนหน้าให้จบก่อน
// - บทที่เรียนจบแล้ว → ป้าย "ผ่านแล้ว" + คะแนนดีที่สุด
// =========================================================
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getStage, getLessonsByStage } from '../data'
import { useLocalized } from '../hooks/useLocalized'
import { useProgressStore } from '../store/progressStore'
import Page from '../components/Page'
import Tile, { TileList } from '../components/Tile'
import StatusBadge from '../components/StatusBadge'
import ComingSoon from '../components/ComingSoon'
import LockedNotice from '../components/LockedNotice'
import NotFoundPage from './NotFoundPage'

// Stage ที่ยังไม่มีเนื้อหา จะมีบทเรียนในขั้นไหนของแผน
const CONTENT_STEP = { 5: 7, 6: 8, 7: 9 }

// Stage 5+ มีบทหลายประเภท → บอกประเภทบท (ไฟล์ภาษา lessonType.*) + นับเป็นบรรทัด/ภาพ ตามประเภท
const TYPE_LABELS = new Set(['context', 'dialogue', 'story', 'rhyme'])
const COUNT_KEYS = { dialogue: 'common.lineCount', rhyme: 'common.lineCount', story: 'common.pictureCount' }

export default function StagePage() {
  const { stageId } = useParams()
  const { t } = useTranslation()
  const loc = useLocalized()
  const unlockedStages = useProgressStore((state) => state.unlockedStages)
  const lessonProgress = useProgressStore((state) => state.lessonProgress)

  const stage = getStage(stageId)
  if (!stage) return <NotFoundPage />

  const stageLessons = getLessonsByStage(stage.id)
  const title = `${t('learn.stageN', { n: stage.id })} · ${loc(stage, 'name')}`

  if (!unlockedStages.includes(stage.id)) {
    return (
      <Page title={title} subtitle={loc(stage, 'description')} backTo="/learn">
        <LockedNotice stageId={stage.id} />
      </Page>
    )
  }

  return (
    <Page title={title} subtitle={loc(stage, 'description')} backTo="/learn">
      {stageLessons.length === 0 ? (
        <ComingSoon step={CONTENT_STEP[stage.id]} />
      ) : (
        <TileList>
          {stageLessons.map((lesson) => {
            const progress = lessonProgress[lesson.id]
            const details = [
              TYPE_LABELS.has(lesson.type) && t(`lessonType.${lesson.type}`),
              t(`category.${lesson.category}`),
              t(COUNT_KEYS[lesson.type] ?? 'common.itemCount', { count: lesson.itemCount }),
              progress?.completed && t('learn.bestScore', { score: progress.bestScore }),
            ]
            return (
              <Tile
                key={lesson.id}
                to={`/lesson/${lesson.id}`}
                image={lesson.image}
                title={loc(lesson, 'title')}
                description={details.filter(Boolean).join(' · ')}
                badge={progress?.completed && <StatusBadge status="completed" />}
              />
            )
          })}
        </TileList>
      )}
    </Page>
  )
}
