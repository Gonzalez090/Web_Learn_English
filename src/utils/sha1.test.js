import { createHash } from 'node:crypto'
import { describe, it, expect } from 'vitest'
import { sha1Hex } from './sha1'
import { audioPathFor } from './audioPath'
import { collectSpeechTexts } from '../data/speechTexts'
import lessonsData from '../data/lessons.json'
import phonicsData from '../data/phonics.json'
import gameData from '../data/game.json'
import audioManifest from '../data/audioManifest.json'

const nodeSha1 = (text) => createHash('sha1').update(text).digest('hex')

describe('sha1Hex', () => {
  it.each([
    '',
    'abc',
    'af_heart|normal|Big dog!',
    // ความยาวรอบ ๆ ขอบบล็อก 64 ไบต์ (ส่วนเติมท้ายข้ามบล็อก)
    'a'.repeat(55),
    'a'.repeat(56),
    'a'.repeat(63),
    'a'.repeat(64),
    'a'.repeat(1000),
    'ภาษาไทย + emoji-free unicode “quotes” – dash',
  ])('ตรงกับ SHA-1 ของ Node: %#', (text) => {
    expect(sha1Hex(text)).toBe(nodeSha1(text))
  })
})

describe('audioPathFor', () => {
  it('ชื่อไฟล์ตรงกับที่สคริปต์สร้างเสียงใช้ (audioManifest.json) ทุกข้อความ ทั้งปกติและช้า', () => {
    const texts = collectSpeechTexts({
      lessons: lessonsData.lessons,
      soundPractice: gameData.soundPractice,
      phonicsSounds: phonicsData.sounds,
    })
    for (const text of texts) {
      expect(audioPathFor(text, 'normal'), text).toBe(audioManifest.normal[text])
      expect(audioPathFor(text, 'slow'), text).toBe(audioManifest.slow[text])
    }
  })

  it('ตัดช่องว่างหัว-ท้าย / ข้อความว่างหรือความเร็วอื่นไม่มีไฟล์', () => {
    expect(audioPathFor('  Yes! ', 'normal')).toBe(audioPathFor('Yes!', 'normal'))
    expect(audioPathFor('', 'normal')).toBeNull()
    expect(audioPathFor('Yes!', 0.8)).toBeNull()
    expect(audioPathFor('Yes!', 'fast')).toBeNull()
  })
})
