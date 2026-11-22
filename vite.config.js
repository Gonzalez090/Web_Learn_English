import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { defineConfig } from 'vite'
import { INDEX_MODULE_ID, STAGE_MODULE_PREFIX, indexModuleCode, stageModuleCode } from './src/data/lessonChunks.js'
import { PHRASES_INDEX_ID, SITUATION_MODULE_PREFIX, phrasesIndexCode, situationModuleCode } from './src/data/phraseChunks.js'
import { SCENARIOS_INDEX_ID, SCENARIO_MODULE_PREFIX, scenariosIndexCode, scenarioModuleCode } from './src/data/scenarioChunks.js'

// =========================================================
// แบ่งข้อมูลบทเรียนเป็นก้อน (โหลดเฉพาะที่ต้องใช้) — รายละเอียดดู src/data/lessonChunks.js
//   import ... from 'virtual:lessons'            → สารบัญ (อยู่ในไฟล์ JS หลัก ขนาดเล็ก)
//   import('virtual:lessons/stage-N')            → เนื้อหาเต็มของ Stage N (ไฟล์ JS แยก โหลดตอนเข้าบท)
// แก้ lessons.json → Vite โหลดโมดูลเหล่านี้ใหม่เอง (addWatchFile)
// =========================================================
// คลังวลี (ขั้นที่ 27) ใช้วิธีเดียวกัน — ดู src/data/phraseChunks.js
//   import ... from 'virtual:phrases'                  → สารบัญสถานการณ์ + คู่ในตำรา vs ใช้จริง
//   import('virtual:phrases/situation-<id>')           → วลีของสถานการณ์นั้น (โหลดตอนเปิดหน้าสถานการณ์)
// บทสนทนาสุ่ม (ขั้นที่ 28-1) — ดู src/data/scenarioChunks.js
//   import ... from 'virtual:scenarios'                → สารบัญสถานการณ์ (ไม่มีบทพูด)
//   import('virtual:scenarios/scenario-<id>')          → บทพูดเต็มของสถานการณ์นั้น
// =========================================================
const dataFile = (name) => fileURLToPath(new URL(`./src/data/${name}`, import.meta.url))

// plugin แบ่งไฟล์ JSON เป็นโมดูลเสมือน: indexId = สารบัญ, prefix + key = ก้อนย่อย
function jsonChunks({ name, file, indexId, prefix, indexCode, chunkCode }) {
  const read = () => JSON.parse(fs.readFileSync(file, 'utf8'))
  return {
    name,
    resolveId(id) {
      return id === indexId || id.startsWith(prefix) ? `\0${id}` : null
    },
    load(id) {
      if (id === `\0${indexId}`) {
        this.addWatchFile(file)
        return indexCode(read())
      }
      if (id.startsWith(`\0${prefix}`)) {
        this.addWatchFile(file)
        return chunkCode(read(), id.slice(prefix.length + 1))
      }
      return null
    },
  }
}

const lessonChunks = () =>
  jsonChunks({
    name: 'lesson-chunks',
    file: dataFile('lessons.json'),
    indexId: INDEX_MODULE_ID,
    prefix: STAGE_MODULE_PREFIX,
    indexCode: indexModuleCode,
    chunkCode: (data, key) => stageModuleCode(data, Number(key)),
  })

const phraseChunks = () =>
  jsonChunks({
    name: 'phrase-chunks',
    file: dataFile('phrases.json'),
    indexId: PHRASES_INDEX_ID,
    prefix: SITUATION_MODULE_PREFIX,
    indexCode: phrasesIndexCode,
    chunkCode: situationModuleCode,
  })

const scenarioChunks = () =>
  jsonChunks({
    name: 'scenario-chunks',
    file: dataFile('scenarios.json'),
    indexId: SCENARIOS_INDEX_ID,
    prefix: SCENARIO_MODULE_PREFIX,
    indexCode: scenariosIndexCode,
    chunkCode: scenarioModuleCode,
  })

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
  plugins: [react(), lessonChunks(), phraseChunks(), scenarioChunks(), securityMetaTags(), mode === 'phone' && basicSsl()].filter(Boolean),
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
