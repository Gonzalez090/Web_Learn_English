// =========================================================
// syncEngine.js — ซิงก์ความคืบหน้ากับบัญชี (ขั้นที่ 31) — ไม่ผูกกับ Supabase/React (รับทุกอย่างเข้ามา → ทดสอบได้)
//   createSyncEngine({ api, meta, local, clean, empty }) → { sync, markReplaced, forget, isDirty }
//   api   = { head(uid) → { revision } | null, fetch(uid) → { revision, data } | null,
//             insert(uid, data) → true | false (มีแถวอยู่แล้ว), update(uid, revision, data) → true | false (มีคนเขียนไปก่อน) }
//   meta  = { read() → object, write(object) }  (localStorage et-sync)
//   local = { snapshot() → snapshot, apply(snapshot, { switched }) }
//   clean = (ข้อมูลดิบ) → snapshot ที่ตรวจชนิดแล้ว / empty() → snapshot ของผู้เรียนใหม่
//
// meta: { owner, revision, epoch, base, replace, stash }
//   owner    = บัญชีที่ความคืบหน้าในเครื่องนี้เป็นของใคร (ออกจากระบบแล้วยังจำไว้)
//   revision = เลขรุ่นของแถวในฐานข้อมูลที่เห็นล่าสุด → เขียนทับได้เฉพาะเมื่อยังเป็นเลขเดิม (กันสองเครื่องเขียนทับกัน)
//   epoch    = เพิ่มทุกครั้งที่รีเซ็ต/กู้คืน → เครื่องอื่นรับของใหม่ทั้งก้อน ไม่เอาของเก่ามารวมกลับ
//   replace  = ตัวเลข (เวลา) เมื่อเครื่องนี้เพิ่งรีเซ็ต/กู้คืน รอเขียนทับบัญชี
//   stash    = { uid: {...} } ของบัญชีอื่นที่เคยใช้เครื่องนี้ (สลับบัญชีแล้วไม่หาย ไม่ปนกัน)
// =========================================================
import { mergeSnapshots, same } from './syncMerge'

const MAX_ATTEMPTS = 5
export const DATA_VERSION = 1

const FRESH = { revision: null, epoch: 0, base: null, replace: 0 }

export class SyncAborted extends Error {}

// ข้อมูลในบัญชีมาจากเว็บรุ่นใหม่กว่า (แท็บเก่าค้าง) → ไม่แตะ จนกว่าจะโหลดเว็บใหม่
export class NewerDataError extends Error {}

export function createSyncEngine({ api, meta, local, clean, empty }) {
  const read = () => ({ owner: null, stash: {}, ...FRESH, ...meta.read() })
  const patch = (changes) => meta.write({ ...read(), ...changes })

  // เข้าบัญชีที่ไม่ใช่เจ้าของข้อมูลในเครื่อง → เก็บของเดิมไว้ก่อน แล้วหยิบของบัญชีนี้ (หรือเริ่มใหม่)
  function claim(uid) {
    const state = read()
    if (state.owner === uid) return
    if (!state.owner) {
      patch({ owner: uid, ...FRESH }) // เรียนแบบไม่ล็อกอินมาก่อน → รวมเข้าบัญชีนี้
      return
    }
    const { [uid]: mine, ...others } = state.stash
    const { revision, epoch, base, replace } = state
    const stash = { ...others, [state.owner]: { local: local.snapshot(), revision, epoch, base, replace } }
    meta.write({
      owner: uid,
      stash,
      revision: mine?.revision ?? null,
      epoch: mine?.epoch ?? 0,
      base: mine?.base ?? null,
      replace: mine?.replace ?? 0,
    })
    local.apply(mine?.local ?? empty(), { switched: true })
  }

  const isDirty = () => {
    const state = read()
    return Boolean(state.replace) || !state.base || !same(local.snapshot(), state.base)
  }

  const pack = (snapshot, epoch) => ({ v: DATA_VERSION, epoch, ...snapshot })

  /**
   * ซิงก์ 1 รอบ
   * @param pull true = ถามเซิร์ฟเวอร์ด้วยว่ามีของใหม่ไหม / false = แค่ส่งของที่เปลี่ยนขึ้นไป
   * @param isCurrent () → ยังเป็นบัญชีเดิมอยู่ไหม (ออกจากระบบระหว่างรอ → เลิก)
   * @returns 'same' (ไม่มีอะไรเปลี่ยน) | 'pushed' | 'pulled'
   */
  async function sync(uid, { pull = true, isCurrent = () => true } = {}) {
    const guard = () => {
      if (!isCurrent() || read().owner !== uid) throw new SyncAborted()
    }
    if (!isCurrent()) throw new SyncAborted()
    claim(uid)

    let changed = 'same'
    let checkRemote = pull || read().revision === null || Boolean(read().replace)

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      if (checkRemote) {
        const seen = read()
        const head = seen.revision !== null && !seen.replace ? await api.head(uid) : null
        guard()
        if (!head || head.revision !== read().revision) {
          const row = await api.fetch(uid)
          guard()
          if (row) {
            if (receive(row)) changed = 'pulled'
          } else {
            patch({ revision: null, base: null }) // ยังไม่มีแถว (ครั้งแรก / ถูกลบ)
          }
        }
      }

      if (!isDirty()) return changed
      const start = read()
      const snapshot = local.snapshot()
      const epoch = start.replace ? start.epoch + 1 : start.epoch
      const data = pack(snapshot, epoch)
      const ok = start.revision === null ? await api.insert(uid, data) : await api.update(uid, start.revision, data)
      guard()
      if (ok) {
        const now = read()
        patch({
          revision: (start.revision ?? 0) + 1,
          epoch,
          base: snapshot,
          // ระหว่างรอ ผู้ใช้กดรีเซ็ต/กู้คืนอีกครั้ง → ยังต้องเขียนทับรอบหน้า
          replace: now.replace === start.replace ? 0 : now.replace,
        })
        return changed === 'pulled' ? 'pulled' : 'pushed'
      }
      checkRemote = true // มีเครื่องอื่นเขียนไปก่อน → ดึงมารวมแล้วลองใหม่
    }
    throw new Error('sync conflict')
  }

  // ได้แถวจากบัญชี → รวมกับของในเครื่อง (ทำรวดเดียว ไม่มี await คั่น)
  function receive(row) {
    if (Number.isInteger(row.data?.v) && row.data.v > DATA_VERSION) throw new NewerDataError()
    const remote = clean(row.data)
    const remoteEpoch = Number.isInteger(row.data?.epoch) && row.data.epoch >= 0 ? row.data.epoch : 0
    const state = read()
    const here = local.snapshot()
    let next = here
    if (!state.replace) {
      const adopt = state.base !== null && remoteEpoch > state.epoch
      next = adopt ? remote : mergeSnapshots(here, remote, state.base)
    }
    // base = ของในบัญชี (ยังไม่ใช่ผลรวม) → ถ้าส่งขึ้นไม่สำเร็จ รอบหน้าคิดส่วนที่เพิ่มถูก ไม่บวกซ้ำ
    patch({ revision: row.revision, epoch: Math.max(remoteEpoch, state.replace ? state.epoch : remoteEpoch), base: remote })
    if (same(next, here)) return false
    local.apply(next, { switched: false })
    return true
  }

  // รีเซ็ต/กู้คืนไฟล์: ล็อกอินอยู่ → รอบหน้าเขียนทับบัญชี / ไม่ได้ล็อกอิน → ของในเครื่องไม่ใช่ของบัญชีเดิมแล้ว
  function markReplaced(signedIn) {
    if (signedIn) patch({ replace: Date.now() })
    else forget()
  }

  const forget = () => patch({ owner: null, ...FRESH })

  return { sync, markReplaced, forget, isDirty }
}
