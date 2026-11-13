import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { defineConfig } from 'vite'

// =========================================================
// ความปลอดภัยของเว็บจริง (ใส่ตอน build เท่านั้น)
// Content-Security-Policy: อนุญาตให้โหลดสคริปต์/สไตล์/ฟอนต์/ภาพจากเว็บเราเองเท่านั้น
// → ถ้ามีใครพยายามแทรกสคริปต์จากที่อื่น เบราว์เซอร์จะไม่ยอมรัน
// (ตอน npm run dev ไม่ใส่ เพราะ Vite/React Refresh ต้องใช้สคริปต์แบบ inline)
// =========================================================
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "media-src 'self' blob:", // เล่นไฟล์เสียงที่อัดเอง (ขั้นที่ 19)
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

function securityMetaTags() {
  return {
    name: 'security-meta-tags',
    apply: 'build',
    transformIndexHtml(html) {
      return {
        html,
        tags: [
          {
            tag: 'meta',
            attrs: { 'http-equiv': 'Content-Security-Policy', content: CONTENT_SECURITY_POLICY },
            injectTo: 'head-prepend',
          },
          // ลิงก์ออกไปเว็บอื่น ส่งแค่ชื่อเว็บเรา ไม่ส่ง path เต็ม
          { tag: 'meta', attrs: { name: 'referrer', content: 'strict-origin-when-cross-origin' }, injectTo: 'head-prepend' },
        ],
      }
    },
  }
}

// header เพิ่มเติมตอนลองเว็บจริงด้วย npm run preview
// (ตอนเอาขึ้นโฮสต์จริง ให้ตั้ง header ชุดเดียวกันที่โฮสต์ — ดู README)
const PREVIEW_SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'microphone=(self), camera=(), geolocation=(), payment=()',
}

// =========================================================
// ตั้งค่า Vite
// - npm run dev       → http://localhost:5173 (ไมค์ใช้ได้เพราะเป็น localhost)
// - npm run dev:phone → https://<IP เครื่อง>:5173 ให้มือถือในวง Wi-Fi เดียวกันเปิดได้
//   (เบราว์เซอร์อนุญาตไมค์เฉพาะ https หรือ localhost จึงต้องเปิด https ด้วยใบรับรองชั่วคราว)
// - npm run build     → เว็บจริงใน dist/ (ไม่มี source map → คนเปิด F12 ไม่เห็นโค้ดต้นฉบับ/คอมเมนต์)
// =========================================================
export default defineConfig(({ mode }) => ({
  plugins: [react(), securityMetaTags(), mode === 'phone' && basicSsl()].filter(Boolean),
  build: {
    sourcemap: false,
  },
  preview: {
    headers: PREVIEW_SECURITY_HEADERS,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
}))
