// =========================================================
// ProfilePage — โปรไฟล์: สถิติ, กราฟนาทีที่พูด, Collection, ห้องของตัวละคร
// (สถิติ/กราฟ ขั้นที่ 13 และ 18, Collection/ห้อง ขั้นที่ 20)
// =========================================================
import { useTranslation } from 'react-i18next'
import { ICONS } from '../utils/icons'
import Page from '../components/Page'
import Tile, { TileList } from '../components/Tile'
import ComingSoon from '../components/ComingSoon'

export default function ProfilePage() {
  const { t } = useTranslation()

  return (
    <Page title={t('profile.title')}>
      <TileList>
        <Tile
          to="/profile/speaking-check"
          icon={ICONS.speakingCheck}
          title={t('profile.speakingCheck')}
          description={t('profile.speakingCheckDesc')}
        />
      </TileList>
      <ComingSoon step={13} />
    </Page>
  )
}
