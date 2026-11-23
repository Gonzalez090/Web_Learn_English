// =========================================================
// useSpeedScenarios — บทสนทนา Speed Order ที่เล่นได้: สถานที่ปลดล็อกแล้ว + ไม่ล็อกตามความสนิท (ขั้นที่ 17)
// ใช้ในหน้ามินิเกม (/games) และหน้าเกม Speed Order
// =========================================================
import { cityMap, scenarioList } from '../data'
import { useProgressStore } from '../store/progressStore'
import { isScenarioLocked } from '../utils/friendship'
import { isPlaceUnlocked } from '../utils/places'

export function useSpeedScenarios() {
  const unlockedStages = useProgressStore((state) => state.unlockedStages)
  const friendship = useProgressStore((state) => state.npcFriendship)
  return scenarioList.filter((scenario) => {
    if (!scenario.speedOrder || isScenarioLocked(scenario, friendship)) return false
    const place = cityMap.find((entry) => entry.placeId === scenario.placeId)
    return Boolean(place && isPlaceUnlocked(place, unlockedStages))
  })
}
