// =========================================================
// SettingsPage — ตั้งค่า
// ขั้นที่ 1: ภาษาของหน้าเว็บ
// ขั้นที่ 2: เปิด/ปิด คำอ่านไทย และคำแปลไทย
// ขั้นที่ 21: ความเร็วเสียง, เป้าหมายรายวัน, เสียงเอฟเฟกต์, รีเซ็ตความคืบหน้า
// =========================================================
import { useTranslation } from 'react-i18next'
import { Images } from 'lucide-react'
import Page from '../components/Page'
import Section from '../components/Section'
import LanguageToggle from '../components/LanguageToggle'
import ComingSoon from '../components/ComingSoon'
import Tile, { TileList } from '../components/Tile'

export default function SettingsPage() {
  const { t } = useTranslation()

  return (
    <Page title={t('settings.title')} backTo="/">
      <Section title={t('language.label')} description={t('language.hint')}>
        <div>
          <LanguageToggle size="md" />
        </div>
      </Section>
      <ComingSoon step={21} />
      <TileList>
        <Tile to="/credits" icon={Images} title={t('credits.title')} description={t('credits.subtitle')} />
      </TileList>
    </Page>
  )
}
