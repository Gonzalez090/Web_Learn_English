// =========================================================
// ดึงภาพถ่ายสมจริงมาใช้เป็นภาพประกอบ (รันในเครื่องเท่านั้น ไม่ได้อยู่ในเว็บ)
//
// ต้องมีไฟล์ .env.local (git ไม่เก็บไฟล์นี้) ที่มี key อย่างใดอย่างหนึ่ง:
//   PIXABAY_API_KEY=xxxx   ← ใช้อยู่ตอนนี้ (สมัครฟรี: pixabay.com/api/docs)
//   PEXELS_API_KEY=xxxx    ← สำรองไว้ (ตอนนี้ Pexels ปิดการออก key ใหม่)
//
// ขั้นที่ 1 — ค้นหา: ดาวน์โหลดภาพตัวเลือก + ทำ "แผ่นรวมภาพ" (contact sheet) ไว้ตรวจด้วยตา
//   node --env-file=.env.local scripts/fetch-images.mjs search [id ...] [--out <โฟลเดอร์>] [--page 2] [--q "คำค้นใหม่"] [--cell 200]
//   (ไม่ใส่ id = ทุกตัวใน scripts/image-queries.json)
//
// ขั้นที่ 2 — เลือก: ย่อภาพที่เลือกเป็น WebP 640x640 ไว้ที่ public/images/<id>.webp
//   node --env-file=.env.local scripts/fetch-images.mjs pick s1-dog=3 s1-cat=1 [--out <โฟลเดอร์>]
//   + บันทึกชื่อช่างภาพ/ที่มาลง src/data/imageCredits.json (ใช้ทำหน้าเครดิตภาพ)
// =========================================================
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const QUERIES_FILE = path.join(ROOT, 'scripts', 'image-queries.json')
const CREDITS_FILE = path.join(ROOT, 'src', 'data', 'imageCredits.json')
const IMAGES_DIR = path.join(ROOT, 'public', 'images')

const CANDIDATES = 9 // จำนวนภาพตัวเลือกต่อ 1 รายการ (ตาราง 3x3)
const OUTPUT_SIZE = 640 // ขนาดภาพสุดท้าย (px)

// ---------- อ่านคำสั่ง ----------
const [command, ...rest] = process.argv.slice(2)
const options = { out: path.join(ROOT, '.image-candidates'), page: 1, query: null, cell: 300 }
const args = []
for (let i = 0; i < rest.length; i++) {
  if (rest[i] === '--out') options.out = path.resolve(rest[++i])
  else if (rest[i] === '--page') options.page = Number(rest[++i])
  else if (rest[i] === '--q') options.query = rest[++i]
  else if (rest[i] === '--cell') options.cell = Math.max(120, Number(rest[++i]) || 300) // ขนาดช่องในแผ่นรวมภาพ (px)
  else args.push(rest[i])
}

// ---------- แหล่งภาพ (provider) ----------
// ทุก provider คืนรายการรูปแบบเดียวกัน:
// { provider, sourceId, preview, full, photographer, photographerUrl, pageUrl }
const PROVIDERS = {
  pixabay: {
    key: process.env.PIXABAY_API_KEY,
    async search(query, page) {
      const url = new URL('https://pixabay.com/api/')
      url.searchParams.set('key', this.key)
      url.searchParams.set('q', query.slice(0, 100))
      url.searchParams.set('image_type', 'photo')
      url.searchParams.set('safesearch', 'true')
      url.searchParams.set('per_page', String(CANDIDATES))
      url.searchParams.set('page', String(page))
      const response = await fetch(url)
      if (!response.ok) throw new Error(`Pixabay ${response.status}: ${await response.text()}`)
      const { hits = [] } = await response.json()
      return hits.map((hit) => ({
        provider: 'pixabay',
        sourceId: hit.id,
        preview: hit.webformatURL,
        full: hit.largeImageURL,
        photographer: hit.user,
        photographerUrl: `https://pixabay.com/users/${hit.user}-${hit.user_id}/`,
        pageUrl: hit.pageURL,
      }))
    },
  },
  pexels: {
    key: process.env.PEXELS_API_KEY,
    async search(query, page) {
      const url = new URL('https://api.pexels.com/v1/search')
      url.searchParams.set('query', query)
      url.searchParams.set('per_page', String(CANDIDATES))
      url.searchParams.set('page', String(page))
      const response = await fetch(url, { headers: { Authorization: this.key } })
      if (!response.ok) throw new Error(`Pexels ${response.status}: ${await response.text()}`)
      const { photos = [] } = await response.json()
      return photos.map((photo) => ({
        provider: 'pexels',
        sourceId: photo.id,
        preview: photo.src.medium,
        full: `${photo.src.original}?auto=compress&cs=tinysrgb&w=${OUTPUT_SIZE * 2}`,
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url,
        pageUrl: photo.url,
      }))
    },
  },
}

const provider = Object.values(PROVIDERS).find((p) => p.key)
if (!provider) {
  console.error('ไม่พบ key — สร้างไฟล์ .env.local แล้วใส่ PIXABAY_API_KEY=xxxx ก่อน')
  process.exit(1)
}

async function download(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`ดาวน์โหลดไม่สำเร็จ ${response.status}: ${url}`)
  return Buffer.from(await response.arrayBuffer())
}

// ---------- แผ่นรวมภาพ 3 คอลัมน์ พร้อมเลขกำกับ ----------
async function makeContactSheet(buffers, title, file) {
  const cell = options.cell
  const header = 40
  const cols = 3
  const rows = Math.ceil(buffers.length / cols)
  const tiles = await Promise.all(
    buffers.map(async (buffer, index) => {
      const label = Buffer.from(
        `<svg width="${cell}" height="${cell}"><rect x="8" y="8" width="44" height="44" rx="10" fill="#2563eb"/>` +
          `<text x="30" y="40" font-size="28" font-family="Arial" font-weight="bold" fill="#fff" text-anchor="middle">${index + 1}</text></svg>`,
      )
      const image = await sharp(buffer).resize(cell, cell, { fit: 'cover' }).composite([{ input: label }]).toBuffer()
      return { input: image, left: (index % cols) * cell, top: header + Math.floor(index / cols) * cell }
    }),
  )
  const safeTitle = title.replace(/[<&>"]/g, '')
  const titleSvg = Buffer.from(
    `<svg width="${cols * cell}" height="${header}"><text x="10" y="28" font-size="22" font-family="Arial" fill="#111">${safeTitle}</text></svg>`,
  )
  await sharp({ create: { width: cols * cell, height: header + rows * cell, channels: 3, background: '#ffffff' } })
    .composite([{ input: titleSvg, left: 0, top: 0 }, ...tiles])
    .jpeg({ quality: 70 })
    .toFile(file)
}

// ---------- คำสั่ง search ----------
async function runSearch(ids) {
  const queries = JSON.parse(await fs.readFile(QUERIES_FILE, 'utf8'))
  const targets = ids.length ? ids : Object.keys(queries)
  await fs.mkdir(options.out, { recursive: true })

  for (const id of targets) {
    const query = options.query ?? queries[id]
    if (!query) {
      console.warn(`ข้าม ${id}: ไม่มีคำค้นใน image-queries.json`)
      continue
    }
    const found = await provider.search(query, options.page)

    // ดาวน์โหลดภาพตัวอย่าง — ภาพไหนโหลดไม่ได้หรือเปิดไม่ได้ ให้ข้ามไป (ไม่หยุดทั้งชุด)
    const loaded = await Promise.all(
      found.map(async (candidate) => {
        try {
          const buffer = await download(candidate.preview)
          await sharp(buffer).metadata()
          return { candidate, buffer }
        } catch {
          return null
        }
      }),
    )
    const usable = loaded.filter(Boolean)
    if (usable.length === 0) {
      console.warn(`${id}: ไม่พบภาพที่ใช้ได้สำหรับ "${query}"`)
      continue
    }
    const candidates = usable.map((item) => item.candidate)
    const previews = usable.map((item) => item.buffer)
    await makeContactSheet(previews, `${id} - "${query}"`, path.join(options.out, `${id}.jpg`))
    // เก็บข้อมูลตัวเลือกไว้ใช้ตอน pick
    await fs.writeFile(path.join(options.out, `${id}.json`), JSON.stringify(candidates, null, 2))
    console.log(`${id}: ${candidates.length} ภาพ → ${path.join(options.out, `${id}.jpg`)}`)
  }
}

// ---------- คำสั่ง pick ----------
async function runPick(choices) {
  const credits = JSON.parse(await fs.readFile(CREDITS_FILE, 'utf8').catch(() => '{}'))
  await fs.mkdir(IMAGES_DIR, { recursive: true })

  for (const choice of choices) {
    const [id, numberText] = choice.split('=')
    const candidates = JSON.parse(await fs.readFile(path.join(options.out, `${id}.json`), 'utf8'))
    const picked = candidates[Number(numberText) - 1]
    if (!picked) throw new Error(`${id}: ไม่มีภาพหมายเลข ${numberText}`)

    const buffer = await download(picked.full)
    const outFile = path.join(IMAGES_DIR, `${id}.webp`)
    await sharp(buffer)
      .resize(OUTPUT_SIZE, OUTPUT_SIZE, { fit: 'cover', position: sharp.strategy.attention })
      .webp({ quality: 78 })
      .toFile(outFile)

    credits[id] = {
      provider: picked.provider,
      sourceId: picked.sourceId,
      photographer: picked.photographer,
      photographerUrl: picked.photographerUrl,
      pageUrl: picked.pageUrl,
    }
    const { size } = await fs.stat(outFile)
    console.log(`${id} ← #${numberText} โดย ${picked.photographer} (${Math.round(size / 1024)} KB)`)
  }

  // เรียง key ให้อ่านง่าย แล้วบันทึกเครดิต
  const sorted = Object.fromEntries(Object.entries(credits).sort(([a], [b]) => a.localeCompare(b)))
  await fs.writeFile(CREDITS_FILE, `${JSON.stringify(sorted, null, 2)}\n`)
}

if (command === 'search') await runSearch(args)
else if (command === 'pick') await runPick(args)
else {
  console.log('ใช้: node --env-file=.env.local scripts/fetch-images.mjs search [id ...] | pick id=เลข ...')
  process.exit(1)
}
