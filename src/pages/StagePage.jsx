// =========================================================
// StagePage — รายการบทเรียนของ Stage หนึ่ง (/learn/:stageId)
// =========================================================
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getStage, getLessonsByStage } from '../data'
import { useLocalized } from '../hooks/useLocalized'
import Page from '../components/Page'
import Tile, { TileList } from '../components/Tile'
import ComingSoon from '../components/ComingSoon'
import NotFoundPage from './NotFoundPage'

// Stage ที่ยังไม่มีเนื้อหา จะมีบทเรียนในขั้นไหนของแผน
const CONTENT_STEP = { 5: 7, 6: 8, 7: 9 }

export default function StagePage() {
  const { stageId } = useParams()
  const { t } = useTranslation()
  const loc = useLocalized()

  const stage = getStage(stageId)
  if (!stage) return <NotFoundPage />

  const stageLessons = getLessonsByStage(stage.id)

  return (
    <Page
      title={`${t('learn.stageN', { n: stage.id })} · ${loc(stage, 'name')}`}
      subtitle={loc(stage, 'description')}
      backTo="/learn"
    >
      {stageLessons.length === 0 ? (
        <ComingSoon step={CONTENT_STEP[stage.id]} />
      ) : (
        <TileList>
          {stageLessons.map((lesson) => (
            <Tile
              key={lesson.id}
              to={`/lesson/${lesson.id}`}
              image={lesson.items[0]?.image}
              title={loc(lesson, 'title')}
              description={`${t(`category.${lesson.category}`)} · ${t('common.itemCount', {
                count: lesson.items.length,
              })}`}
            />
          ))}
        </TileList>
      )}
    </Page>
  )
}
