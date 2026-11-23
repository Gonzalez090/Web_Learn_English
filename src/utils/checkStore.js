// =========================================================
// checkStore.js — เก็บผล Speaking Check (ไฟล์เสียง + วันที่ + สถิติ) ใน IndexedDB ของเบราว์เซอร์ (ขั้นที่ 19)
//   ฐานข้อมูล 'et-speaking-check' → store 'checks' (key = id)
//   ระเบียน: { id, date: 'YYYY-MM-DD', createdAt: ms, durationMs, mimeType, blob, transcript, stats, rewarded }
// - เก็บแค่ในเครื่องนี้ ไม่ส่งไปไหน (ไฟล์เสียงใหญ่เกินกว่าจะเก็บใน localStorage)
// - เบราว์เซอร์ไม่ให้ใช้ IndexedDB (เช่น โหมดส่วนตัวบางแบบ) → ฟังก์ชันโยน error ให้หน้าแจ้งผู้ใช้
// =========================================================
const DB_NAME = 'et-speaking-check'
const DB_VERSION = 1
const STORE = 'checks'

export const isCheckStoreSupported = typeof indexedDB !== 'undefined'

let dbPromise = null

// เปิดฐานข้อมูลครั้งเดียวแล้วใช้ซ้ำ (ครั้งแรกสร้าง store)
function openDb() {
  if (!isCheckStoreSupported) return Promise.reject(new Error('indexeddb-unsupported'))
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' })
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
      request.onblocked = () => reject(new Error('indexeddb-blocked'))
    }).catch((error) => {
      dbPromise = null // ครั้งหน้าลองเปิดใหม่
      throw error
    })
  }
  return dbPromise
}

// ทำงาน 1 ครั้งกับ store แล้วรอให้เสร็จ (readonly / readwrite)
async function withStore(mode, run) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode)
    const request = run(transaction.objectStore(STORE))
    transaction.oncomplete = () => resolve(request?.result)
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error ?? new Error('indexeddb-abort'))
  })
}

// ผลทั้งหมด เรียงจากเก่า → ใหม่
export async function listChecks() {
  const all = (await withStore('readonly', (store) => store.getAll())) ?? []
  return all.sort((a, b) => a.createdAt - b.createdAt)
}

export const saveCheck = (record) => withStore('readwrite', (store) => store.put(record))

export const deleteCheck = (id) => withStore('readwrite', (store) => store.delete(id))

// ลบทุกครั้ง (รีเซ็ตความคืบหน้าแบบลบเสียงด้วย)
export const clearChecks = () => withStore('readwrite', (store) => store.clear())

// รหัสของการอัดใหม่ (เวลา + สุ่มกันชน)
export const newCheckId = (now = Date.now()) => `${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`
