// PlacePage — หน้าสถานที่ในเมือง: NPC, บทสนทนาสุ่ม, คลังวลีของสถานการณ์นั้น (ทำในขั้นที่ 14)
import { useTranslation } from 'react-i18next'
import Page from '../components/Page'
import ComingSoon from '../components/ComingSoon'

export default function PlacePage() {
  const { t } = useTranslation()

  return (
    <Page title={t('place.title')} backTo="/">
      <ComingSoon step={14} />
    </Page>
  )
}
