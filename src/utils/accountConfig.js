// =========================================================
// accountConfig.js — ค่าตั้งต้นของระบบบัญชี Google (ขั้นที่ 31)
//   VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY = ค่าสาธารณะ (อยู่ในหน้าเว็บได้ — สิทธิ์จริงคุมด้วย RLS ในฐานข้อมูล)
//   ไม่ได้ตั้งค่า → ระบบบัญชีปิดทั้งหมด เว็บใช้ได้เหมือนเดิม (ไม่โหลดไลบรารี Supabase ด้วย)
// =========================================================
const url = import.meta.env.VITE_SUPABASE_URL ?? ''
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''

export const SUPABASE_URL = url.trim()
export const SUPABASE_KEY = key.trim()
export const isAccountEnabled = /^https:\/\/[^/]+\/?$/.test(SUPABASE_URL) && SUPABASE_KEY.length > 20

export const AUTH_STORAGE_KEY = 'et-auth' // ที่เก็บเซสชันของ Supabase
export const SYNC_STORAGE_KEY = 'et-sync' // สถานะการซิงก์ (utils/syncEngine.js)

export const hasStoredSession = () => {
  try {
    return localStorage.getItem(AUTH_STORAGE_KEY) !== null
  } catch {
    return false
  }
}

// เพิ่งกลับจากหน้า Google (?code=… สำเร็จ / ?error=… ยกเลิก)
export function readAuthReturn(search, hash) {
  const query = new URLSearchParams(search)
  const fragment = new URLSearchParams(hash.replace(/^#/, ''))
  const error = query.get('error') ?? fragment.get('error')
  return { hasCode: query.has('code'), error }
}

// เบราว์เซอร์ในแอป (LINE, Facebook, Instagram, TikTok …) — Google ไม่ให้ล็อกอิน ต้องเปิดใน Chrome/Safari
export const isInAppBrowser = (userAgent) =>
  /\bLine\/|FBAN|FBAV|Instagram|MicroMessenger|BytedanceWebview|musical_ly|; wv\)/i.test(userAgent)
