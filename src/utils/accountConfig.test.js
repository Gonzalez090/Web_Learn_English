import { describe, expect, it } from 'vitest'
import { isInAppBrowser, readAuthReturn } from './accountConfig'

describe('readAuthReturn', () => {
  it('สำเร็จ / ยกเลิก / เปิดหน้าปกติ', () => {
    expect(readAuthReturn('?code=abc', '')).toEqual({ hasCode: true, error: null })
    expect(readAuthReturn('?error=access_denied&error_description=x', '')).toEqual({ hasCode: false, error: 'access_denied' })
    expect(readAuthReturn('', '#error=server_error')).toEqual({ hasCode: false, error: 'server_error' })
    expect(readAuthReturn('?group=2', '')).toEqual({ hasCode: false, error: null })
  })
})

describe('isInAppBrowser', () => {
  it.each([
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari Line/14.1.0',
    'Mozilla/5.0 (Linux; Android 14; wv) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36 [FBAN/EMA;FBAV/440]',
    'Mozilla/5.0 (iPhone) AppleWebKit/605 Mobile Instagram 300.0',
    'Mozilla/5.0 (Linux; Android 13; SM-A536E Build/TP1A; wv) AppleWebKit/537.36 Version/4.0 Chrome/130 Mobile Safari/537.36',
  ])('เบราว์เซอร์ในแอป: %s', (userAgent) => expect(isInAppBrowser(userAgent)).toBe(true))

  it.each([
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
  ])('เบราว์เซอร์ปกติ: %s', (userAgent) => expect(isInAppBrowser(userAgent)).toBe(false))
})
