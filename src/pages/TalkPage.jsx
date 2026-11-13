// TalkPage — บทสนทนาสุ่มแบบชีวิตจริง (/talk/:scenarioId) (ทำในขั้นที่ 11–12)
import { useTranslation } from 'react-i18next'
import Page from '../components/Page'
import ComingSoon from '../components/ComingSoon'

export default function TalkPage() {
  const { t } = useTranslation()

  return (
    <Page title={t('talk.title')} backTo="/">
      <ComingSoon step={11} />
    </Page>
  )
}
