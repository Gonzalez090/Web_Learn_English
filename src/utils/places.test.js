import { describe, it, expect } from 'vitest'
import { isPlaceUnlocked, nextLockedPlace, placesUnlockedBy, placeStatus, recommendedStage, unlockedPlaceIds } from './places'
import { cityMap } from '../data'

describe('places', () => {
  it('เริ่มต้นมีแค่บ้าน / ผ่าน Stage 1 (Stage 2 เปิด) → ร้านสะดวกซื้อ', () => {
    expect(unlockedPlaceIds(cityMap, [1])).toEqual(['home'])
    expect(unlockedPlaceIds(cityMap, [1, 2])).toEqual(['home', 'store'])
    expect(unlockedPlaceIds(cityMap, [1, 2, 3, 4, 5, 6, 7])).toHaveLength(7)
  })

  it('สถานที่ที่เพิ่งปลดล็อกจาก Stage ที่เพิ่งเปิด', () => {
    expect(placesUnlockedBy(cityMap, [3]).map((place) => place.placeId)).toEqual(['cafe'])
    expect(placesUnlockedBy(cityMap, [])).toEqual([])
    expect(isPlaceUnlocked({ unlockAfterStage: null }, [1])).toBe(true)
  })

  it('Stage ที่แนะนำ: ไม่ก่อน Stage 5 และไม่ก่อน Stage ที่สถานที่เปิด', () => {
    expect(cityMap.map(recommendedStage)).toEqual([5, 5, 5, 5, 5, 6, 7])
  })

  it('สถานะสถานที่: ล็อก → เปิดแล้วแต่ยังไม่ถึง Stage ที่แนะนำ → พร้อมใช้', () => {
    const status = (unlockedStages) => cityMap.map((place) => placeStatus(place, unlockedStages))
    expect(status([1, 2])).toEqual(['early', 'early', 'locked', 'locked', 'locked', 'locked', 'locked'])
    expect(status([1, 2, 3, 4, 5])).toEqual(['ready', 'ready', 'ready', 'ready', 'ready', 'locked', 'locked'])
    expect(status([1, 2, 3, 4, 5, 6, 7])).toEqual(Array(7).fill('ready'))
  })

  it('สถานที่ถัดไปที่จะเปิด', () => {
    expect(nextLockedPlace(cityMap, [1]).placeId).toBe('store')
    expect(nextLockedPlace(cityMap, [1, 2, 3, 4, 5, 6]).placeId).toBe('airport')
    expect(nextLockedPlace(cityMap, [1, 2, 3, 4, 5, 6, 7])).toBeNull()
  })
})
