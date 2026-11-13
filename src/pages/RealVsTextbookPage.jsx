// RealVsTextbookPage — คำในตำรา vs คำที่เจ้าของภาษาใช้จริง (ทำในขั้นที่ 10)
import { useTranslation } from 'react-i18next'
import Page from '../components/Page'
import ComingSoon from '../components/ComingSoon'

export default function RealVsTextbookPage() {
  const { t } = useTranslation()

  return (
    <Page title={t('phrases.realVsTextbook')} subtitle={t('phrases.realVsTextbookDesc')} backTo="/phrases">
      <ComingSoon step={10} />
    </Page>
  )
}
