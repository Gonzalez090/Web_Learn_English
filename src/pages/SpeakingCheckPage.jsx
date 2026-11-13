// SpeakingCheckPage — อัดเสียงบรรยายภาพ 1 นาทีทุก 30 วัน + เทียบผล (ทำในขั้นที่ 19)
import { useTranslation } from 'react-i18next'
import Page from '../components/Page'
import ComingSoon from '../components/ComingSoon'

export default function SpeakingCheckPage() {
  const { t } = useTranslation()

  return (
    <Page title={t('profile.speakingCheck')} subtitle={t('profile.speakingCheckDesc')} backTo="/profile">
      <ComingSoon step={19} />
    </Page>
  )
}
