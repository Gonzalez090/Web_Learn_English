// ReviewPage — ทบทวนวันนี้ (Spaced Repetition 1 → 3 → 7 → 14 วัน) (ทำในขั้นที่ 16)
import { useTranslation } from 'react-i18next'
import Page from '../components/Page'
import ComingSoon from '../components/ComingSoon'

export default function ReviewPage() {
  const { t } = useTranslation()

  return (
    <Page title={t('review.title')} backTo="/">
      <ComingSoon step={16} />
    </Page>
  )
}
