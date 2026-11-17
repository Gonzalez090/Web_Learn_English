import { describe, it, expect } from 'vitest'
import { isPlaceUnlocked, placesUnlockedBy, unlockedPlaceIds } from './places'
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
})
