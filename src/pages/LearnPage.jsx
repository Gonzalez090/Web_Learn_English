// =========================================================
// LearnPage — หน้าเรียนพื้นฐาน: รายการ Stage 1–7 พร้อมสถานะ
// (Stage ที่ล็อก กดเข้าไปได้ แต่จะเจอข้อความให้เรียน Stage ก่อนหน้าให้จบก่อน — StagePage)
// =========================================================
import { useTranslation } from 'react-i18next'
import { stages, getLessonsByStage } from '../data'
import { useProgressStore } from '../store/progressStore'
import { useLocalized } from '../hooks/useLocalized'
import { getStageStatus } from '../utils/progress'
import Page from '../components/Page'
import Tile, { TileList } from '../components/Tile'
import StatusBadge from '../components/StatusBadge'

export default function LearnPage() {
  const { t } = useTranslation()
  const loc = useLocalized()
  const unlockedStages = useProgressStore((state) => state.unlockedStages)
  const lessonProgress = useProgressStore((state) => state.lessonProgress)

  return (
    <Page title={t('learn.title')} subtitle={t('learn.subtitle')}>
      <TileList>
        {stages.map((stage) => {
          const status = getStageStatus(stage.id, getLessonsByStage(stage.id), unlockedStages, lessonProgress)
          return (
            <Tile
              key={stage.id}
              to={`/learn/${stage.id}`}
              image={stage.image}
              title={`${t('learn.stageN', { n: stage.id })} · ${loc(stage, 'name')}`}
              description={`${loc(stage, 'age')} — ${loc(stage, 'description')}`}
              badge={<StatusBadge status={status} />}
              locked={status === 'locked'}
            />
          )
        })}
      </TileList>
    </Page>
  )
}
