// =========================================================
// sha1.js — คำนวณ SHA-1 ของข้อความ (UTF-8) → เลขฐาน 16 ยาว 40 ตัว
// ใช้หาชื่อไฟล์เสียงจากข้อความในหน้าเว็บเอง (ไม่ต้องโหลดสารบัญเสียงทั้งก้อน)
// เขียนเองแบบไม่พึ่ง crypto.subtle เพราะ:
//   - ทำงานทันที (ไม่ต้องรอ async) และใช้ได้แม้เปิดผ่าน http ที่ไม่ใช่ localhost
//   - ใช้ได้ทั้งในเบราว์เซอร์และ Node (สคริปต์สร้างเสียง + test)
// ⚠️ ใช้ตั้งชื่อไฟล์เท่านั้น ไม่ใช่งานความปลอดภัย
// =========================================================

const rotateLeft = (value, bits) => (value << bits) | (value >>> (32 - bits))

export function sha1Hex(message) {
  const bytes = new TextEncoder().encode(String(message ?? ''))
  // เติมท้าย: 0x80 + เลข 0 + ความยาวข้อความ (บิต) 64 บิต → ยาวเป็นทวีคูณของ 64 ไบต์
  const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64
  const buffer = new Uint8Array(paddedLength)
  buffer.set(bytes)
  buffer[bytes.length] = 0x80
  const view = new DataView(buffer.buffer)
  const bitLength = bytes.length * 8
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000))
  view.setUint32(paddedLength - 4, bitLength >>> 0)

  const hash = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0]
  const words = new Uint32Array(80)
  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let i = 0; i < 16; i += 1) words[i] = view.getUint32(offset + i * 4)
    for (let i = 16; i < 80; i += 1) words[i] = rotateLeft(words[i - 3] ^ words[i - 8] ^ words[i - 14] ^ words[i - 16], 1)

    let [a, b, c, d, e] = hash
    for (let i = 0; i < 80; i += 1) {
      let f
      let k
      if (i < 20) {
        f = (b & c) | (~b & d)
        k = 0x5a827999
      } else if (i < 40) {
        f = b ^ c ^ d
        k = 0x6ed9eba1
      } else if (i < 60) {
        f = (b & c) | (b & d) | (c & d)
        k = 0x8f1bbcdc
      } else {
        f = b ^ c ^ d
        k = 0xca62c1d6
      }
      const next = (rotateLeft(a, 5) + f + e + k + words[i]) >>> 0
      e = d
      d = c
      c = rotateLeft(b, 30) >>> 0
      b = a
      a = next
    }
    hash[0] = (hash[0] + a) >>> 0
    hash[1] = (hash[1] + b) >>> 0
    hash[2] = (hash[2] + c) >>> 0
    hash[3] = (hash[3] + d) >>> 0
    hash[4] = (hash[4] + e) >>> 0
  }
  return hash.map((part) => part.toString(16).padStart(8, '0')).join('')
}
