// SoundPracticePage — โหมดฝึกเสียง th, r/l, v/w + คู่คำเสียงคล้าย (ทำในขั้นที่ 21)
import { useTranslation } from 'react-i18next'
import Page from '../components/Page'
import ComingSoon from '../components/ComingSoon'

export default function SoundPracticePage() {
  const { t } = useTranslation()

  return (
    <Page title={t('sounds.title')} subtitle={t('sounds.subtitle')} backTo="/">
      <ComingSoon step={21} />
    </Page>
  )
}
