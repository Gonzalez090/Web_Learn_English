import { describe, it, expect } from 'vitest'
import { checkOrder, makeTiles, placeAt, shuffleTiles } from './wordOrder'
import { createRandom } from './random'

describe('makeTiles / shuffleTiles', () => {
  it('ป้ายคำตามที่เขียน (มีเครื่องหมายติดมา) + id ไม่ซ้ำแม้คำซ้ำ', () => {
    const tiles = makeTiles('Up, up, up! The kite flew!')
    expect(tiles.map((tile) => tile.text)).toEqual(['Up,', 'up,', 'up!', 'The', 'kite', 'flew!'])
    expect(new Set(tiles.map((tile) => tile.id)).size).toBe(6)
  })

  it('สลับแล้วไม่เรียงถูกอยู่แล้ว และ seed เดิมได้ผลเดิม', () => {
    const tiles = makeTiles('Sam got a new kite.')
    for (let seed = 1; seed <= 30; seed += 1) {
      const shuffled = shuffleTiles(tiles, createRandom(seed))
      expect(shuffled.map((tile) => tile.text).join(' ')).not.toBe('Sam got a new kite.')
      expect(shuffled).toHaveLength(5)
    }
    expect(shuffleTiles(tiles, createRandom(7))).toEqual(shuffleTiles(tiles, createRandom(7)))
  })

  it('คำเหมือนกันทั้งประโยค → คืนครบทุกป้าย', () => {
    expect(shuffleTiles(makeTiles('up up'), createRandom(1))).toHaveLength(2)
  })
})

describe('checkOrder', () => {
  it('เรียงถูก = ผ่าน (ไม่สนตัวพิมพ์/เครื่องหมาย)', () => {
    expect(checkOrder(['Sam', 'got', 'a', 'new', 'kite.'], 'Sam got a new kite.').passed).toBe(true)
  })

  it('ยังไม่ถูก → บอกว่าคำไหนอยู่ถูกที่แล้ว', () => {
    const result = checkOrder(['Sam', 'got', 'new', 'a', 'kite.'], 'Sam got a new kite.')
    expect(result.passed).toBe(false)
    expect(result.positions).toEqual([true, true, false, false, true])
    expect(result.answer).toBe('Sam got a new kite.')
  })

  it('ลำดับอื่นที่ยอมรับ', () => {
    const result = checkOrder(['Today', 'we', 'had', 'fun.'], 'We had fun today.', ['Today we had fun.'])
    expect(result.passed).toBe(true)
    expect(result.answer).toBe('Today we had fun.')
  })
})

describe('placeAt', () => {
  it('แทรกใหม่ / ย้ายตำแหน่ง / ตำแหน่งเกินขอบ', () => {
    expect(placeAt(['a', 'b'], 'c', 1)).toEqual(['a', 'c', 'b'])
    expect(placeAt(['a', 'b', 'c'], 'a', 2)).toEqual(['b', 'c', 'a'])
    expect(placeAt(['a', 'b'], 'c', 99)).toEqual(['a', 'b', 'c'])
    expect(placeAt(['a', 'b'], 'b', -3)).toEqual(['b', 'a'])
  })
})
