// =========================================================
// PrivacyPage — ความเป็นส่วนตัว (/privacy, ขั้นที่ 31): เก็บอะไร ที่ไหน ลบยังไง
//   (Google ให้ใส่ลิงก์หน้านี้ในหน้าขออนุญาตเข้าสู่ระบบ)
// =========================================================
import { useTranslation } from 'react-i18next'
import Page from '../components/Page'
import Section from '../components/Section'

const PARTS = ['device', 'account', 'mic', 'delete']

export default function PrivacyPage() {
  const { t } = useTranslation()
  return (
    <Page title={t('privacy.title')} subtitle={t('privacy.subtitle')} backTo="/settings">
      {PARTS.map((part) => (
        <Section key={part} card title={t(`privacy.${part}.title`)}>
          <p>{t(`privacy.${part}.text`)}</p>
        </Section>
      ))}
    </Page>
  )
}
