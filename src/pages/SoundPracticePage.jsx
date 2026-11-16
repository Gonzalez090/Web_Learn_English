// =========================================================
// SoundPracticePage — โหมดฝึกเสียง (ส่วนที่ 10.1): รายการเสียงที่คนไทยออกยาก (/sounds)
//   แตะเสียง → /sounds/:soundId (วิธีออกเสียง + ฟังคู่คำ + เกม Minimal Pair Duel)
// =========================================================
import { useTranslation } from 'react-i18next'
import { soundPractice } from '../data'
import { useLocalized } from '../hooks/useLocalized'
import { ICONS } from '../utils/icons'
import Page from '../components/Page'
import Tile, { TileList } from '../components/Tile'
import styles from './SoundPractice.module.css'

export default function SoundPracticePage() {
  const { t } = useTranslation()
  const loc = useLocalized()

  return (
    <Page title={t('sounds.title')} subtitle={t('sounds.subtitle')} backTo="/">
      <TileList>
        {soundPractice.map((set) => (
          <Tile
            key={set.id}
            to={`/sounds/${set.id}`}
            icon={ICONS.sounds}
            title={loc(set, 'title')}
            description={`${loc(set, 'summary')} · ${t('sounds.pairCount', { count: set.pairs.length })}`}
          />
        ))}
      </TileList>
      <p className={styles.note}>{t('sounds.note')}</p>
    </Page>
  )
}
