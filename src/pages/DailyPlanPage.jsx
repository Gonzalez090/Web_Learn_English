// DailyPlanPage — แผนวันนี้: ทบทวน → บทเรียนใหม่ → บทสนทนาสุ่ม → มินิเกม (ทำในขั้นที่ 18)
import { useTranslation } from 'react-i18next'
import Page from '../components/Page'
import ComingSoon from '../components/ComingSoon'

export default function DailyPlanPage() {
  const { t } = useTranslation()

  return (
    <Page title={t('plan.title')} backTo="/">
      <ComingSoon step={18} />
    </Page>
  )
}
