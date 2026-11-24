// =========================================================
// cloudApi.js — คุยกับ Supabase (ล็อกอิน Google + ตาราง user_progress) (ขั้นที่ 31)
//   ไฟล์นี้โหลดแบบแยก (import()) เฉพาะคนที่ล็อกอินหรือกดปุ่มล็อกอิน → คนไม่ล็อกอินไม่ต้องโหลดไลบรารี
//   ตาราง/สิทธิ์อยู่ใน supabase/schema.sql (RLS: เห็นและแก้ได้เฉพาะแถวของตัวเอง)
// =========================================================
import { createClient } from '@supabase/supabase-js'
import { AUTH_STORAGE_KEY, SUPABASE_KEY, SUPABASE_URL } from './accountConfig'

const TABLE = 'user_progress'
const DUPLICATE = '23505' // มีแถวอยู่แล้ว
const REQUEST_TIMEOUT_MS = 15000

// เน็ตค้าง → เลิกรอ (ไม่งั้นสถานะ "กำลังซิงก์" ค้างตลอด)
function fetchWithTimeout(input, init = {}) {
  if (init.signal || !AbortSignal.timeout) return fetch(input, init)
  return fetch(input, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
}

export const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { flowType: 'pkce', storageKey: AUTH_STORAGE_KEY, detectSessionInUrl: true },
  global: { fetch: fetchWithTimeout },
})

const unwrap = ({ data, error }) => {
  if (error) throw error
  return data
}

export const progressApi = {
  head: async (uid) => unwrap(await client.from(TABLE).select('revision').eq('user_id', uid).maybeSingle()),

  fetch: async (uid) => unwrap(await client.from(TABLE).select('revision, data').eq('user_id', uid).maybeSingle()),

  // @returns false = มีแถวอยู่แล้ว (อีกเครื่องสร้างไปก่อน)
  insert: async (uid, data) => {
    const { error } = await client.from(TABLE).insert({ user_id: uid, data, revision: 1 })
    if (error?.code === DUPLICATE) return false
    if (error) throw error
    return true
  },

  // เขียนเฉพาะเมื่อเลขรุ่นยังเป็นเลขที่เราเห็น → @returns false = มีเครื่องอื่นเขียนไปก่อน
  update: async (uid, revision, data) => {
    const rows = unwrap(
      await client
        .from(TABLE)
        .update({ data, revision: revision + 1 })
        .eq('user_id', uid)
        .eq('revision', revision)
        .select('revision'),
    )
    return rows.length === 1
  },
}

export async function signInWithGoogle(redirectTo) {
  unwrap(await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo, queryParams: { prompt: 'select_account' } } }))
}

// ออกจากระบบเฉพาะเครื่องนี้
export async function signOut() {
  const { error } = await client.auth.signOut({ scope: 'local' })
  if (error) throw error
}

// ลบบัญชีและข้อมูลทั้งหมดบนเซิร์ฟเวอร์ (ฟังก์ชันในฐานข้อมูล ลบได้เฉพาะของตัวเอง)
export const deleteAccount = async () => unwrap(await client.rpc('delete_my_account'))
