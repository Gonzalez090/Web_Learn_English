// LessonSummaryPage — หน้าสรุปท้ายบท: XP ที่ได้, วลีใหม่, คำที่ต้องฝึกซ้ำ (ทำในขั้นที่ 4)
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Page from '../components/Page'
import ComingSoon from '../components/ComingSoon'

export default function LessonSummaryPage() {
  const { lessonId } = useParams()
  const { t } = useTranslation()

  return (
    <Page title={t('lesson.summaryTitle')} backTo={`/lesson/${lessonId}`}>
      <ComingSoon step={4} />
    </Page>
  )
}
