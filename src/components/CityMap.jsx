// =========================================================
// CityMap — แผนที่เมือง 7 สถานที่บนหน้าแรก (ส่วนที่ 7)
//   ปลดล็อกแล้ว → แตะเข้าไปคุย/ฝึกวลีของที่นั้น / ยังล็อก → ภาพสีจริงจางลง + กุญแจ + "ผ่าน Stage N เพื่อปลดล็อก"
//   (แตะที่ล็อกได้ → หน้าสถานที่บอกว่าต้องเรียนอะไรก่อน)
// =========================================================
import { useTranslation } from 'react-i18next'
import { cityMap } from '../data'
import { useLocalized } from '../hooks/useLocalized'
import { useProgressStore } from '../store/progressStore'
import { isPlaceUnlocked } from '../utils/places'
import Tile, { TileList } from './Tile'

export default function CityMap() {
  const { t } = useTranslation()
  const loc = useLocalized()
  const unlockedStages = useProgressStore((state) => state.unlockedStages)

  return (
    <TileList variant="gallery">
      {cityMap.map((place) => {
        const unlocked = isPlaceUnlocked(place, unlockedStages)
        return (
          <Tile
            key={place.placeId}
            to={`/place/${place.placeId}`}
            image={place.image}
            title={loc(place, 'name')}
            description={unlocked ? undefined : t('map.unlockAt', { n: place.unlockAfterStage })}
            locked={!unlocked}
            layout="cover"
          />
        )
      })}
    </TileList>
  )
}
