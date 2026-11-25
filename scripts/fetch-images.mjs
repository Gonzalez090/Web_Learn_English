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
// ขั้นที่ 1ข — ภาพชุดเดียวกัน (ภาพเล่าเรื่อง 3–4 ภาพ / NPC ต้องเป็นคนหน้าเดิม): ภาพที่ช่างภาพถ่ายเซ็ตเดียวกัน
//   มักอัปโหลดต่อกัน → เลขภาพ Pixabay ติดกัน (เลขอยู่ท้ายลิงก์ภาพ เช่น .../tree-watering-child-3335400/)
//   node --env-file=.env.local scripts/fetch-images.mjs series <id> <เลขภาพ Pixabay> [--range 10] [--out <โฟลเดอร์>]
//   → แผ่นรวมภาพของภาพเลขใกล้ ๆ (±range) ที่เป็นของช่างภาพคนเดียวกัน แล้วใช้ pick <id>=เลข เหมือนเดิม (Pixabay เท่านั้น)
//
// ขั้นที่ 2 — เลือก: ย่อภาพที่เลือกเป็น WebP 640x640 ไว้ที่ public/images/<id>.webp
//   node --env-file=.env.local scripts/fetch-images.mjs pick s1-dog=3 s1-cat=1 [--out <โฟลเดอร์>]
//   + บันทึกชื่อช่างภาพ/ที่มาลง src/data/imageCredits.json (ใช้ทำหน้าเครดิตภาพ)
//   ปกติครอปเป็นสี่เหลี่ยมจัตุรัสตรงจุดเด่นของภาพเอง — ถ้าครอปแล้วคนหลุดกรอบ ใส่โหมดท้ายเลขภาพได้:
//     s5-leo-3=3@right   เลื่อนกรอบไปทาง right / left / top / bottom / center
//     s5-teddy-1=1@contain  เห็นทั้งภาพ (ภาพกว้างที่มีคนอยู่คนละฝั่ง) เติมขอบด้วยภาพเดียวกันแบบเบลอ
//     s2-bus=1@white     เห็นทั้งภาพบนพื้นขาว (ภาพสิ่งของพื้นขาว/พื้นโปร่งใส)
//     s1-cup=3@30,60,70  ครอปเอง: จุดกลางกรอบที่ 30% จากซ้าย 60% จากบน, กรอบยาว 70% ของด้านสั้น (ให้สิ่งที่คำพูดถึงเด่น)
//   s2-nose=7@44,39,75,90  เหมือนกัน แต่หมุนภาพตามเข็ม 90 องศาก่อน (90 / 180 / 270 — ภาพที่ถ่ายตะแคง)
//   ครอปใหม่จากภาพต้นฉบับเดิม (ไม่เปลี่ยนภาพ) — ดูต้นฉบับเต็มก่อน: original s1-cup s1-hat / แล้ว recrop s1-cup=contain s1-hat=40,50,90
//
// ใช้ภาพเดิมซ้ำ — คัดลอกภาพ + เครดิตของข้อเดิมไปเป็นภาพของข้อใหม่ (ไม่ต้องใช้ key)
//   node scripts/fetch-images.mjs copy s6-ant=s4-so-tiny s6-pants=s1-pants
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
const CROP_MODES = ['right', 'left', 'top', 'bottom', 'center', 'contain', 'white'] // โหมดครอปที่ใส่ท้ายเลขภาพตอน pick

const CUSTOM_CROP = /^([0-9]{1,3}),([0-9]{1,3}),([0-9]{1,3})(?:,(90|180|270))?$/ // จุดกลาง x%,y%, ขนาด % ของด้านสั้น, (หมุนกี่องศา)
const isCropMode = (mode) => CROP_MODES.includes(mode) || CUSTOM_CROP.test(mode)

// ครอปเอง: กรอบจัตุรัสรอบจุดกลางที่กำหนด (เลื่อนให้อยู่ในภาพเสมอ)
async function cropAround(source, [cx, cy, size, angle]) {
  const buffer = angle ? await sharp(source).rotate(angle).toBuffer() : source
  const { width, height } = await sharp(buffer).metadata()
  const side = Math.round((Math.min(width, height) * Math.min(100, Math.max(10, size))) / 100)
  const fit = (percent, total) => Math.min(total - side, Math.max(0, Math.round((total * percent) / 100 - side / 2)))
  return sharp(buffer)
    .extract({ left: fit(cx, width), top: fit(cy, height), width: side, height: side })
    .resize(OUTPUT_SIZE, OUTPUT_SIZE)
}

// ภาพต้นฉบับ → สี่เหลี่ยมจัตุรัส OUTPUT_SIZE (sharp instance ที่ยังไม่บันทึก)
async function toSquare(source, mode) {
  // พื้นโปร่งใส → พื้นขาว
  const buffer = await sharp(source).flatten({ background: '#ffffff' }).toBuffer()
  if (mode === 'white') return sharp(buffer).resize(OUTPUT_SIZE, OUTPUT_SIZE, { fit: 'contain', background: '#ffffff' })
  const custom = mode?.match(CUSTOM_CROP)
  if (custom) return cropAround(buffer, custom.slice(1).map((value) => Number(value ?? 0)))
  if (mode !== 'contain') {
    const position = mode ?? sharp.strategy.attention // ไม่ใส่โหมด = ให้ sharp หาจุดเด่นของภาพเอง
    return sharp(buffer).resize(OUTPUT_SIZE, OUTPUT_SIZE, { fit: 'cover', position })
  }
  // contain: ภาพเต็มอยู่ตรงกลาง + พื้นหลังเป็นภาพเดียวกันขยายเต็มกรอบแบบเบลอและมืดลงเล็กน้อย
  const background = await sharp(buffer)
    .resize(OUTPUT_SIZE, OUTPUT_SIZE, { fit: 'cover' })
    .blur(24)
    .modulate({ brightness: 0.8 })
    .toBuffer()
  const foreground = await sharp(buffer).resize(OUTPUT_SIZE, OUTPUT_SIZE, { fit: 'inside' }).toBuffer()
  return sharp(background).composite([{ input: foreground, gravity: 'center' }])
}

// ---------- อ่านคำสั่ง ----------
const [command, ...rest] = process.argv.slice(2)
const options = { out: path.join(ROOT, '.image-candidates'), page: 1, query: null, cell: 300, range: 10 }
const args = []
for (let i = 0; i < rest.length; i++) {
  if (rest[i] === '--out') options.out = path.resolve(rest[++i])
  else if (rest[i] === '--page') options.page = Number(rest[++i])
  else if (rest[i] === '--q') options.query = rest[++i]
  else if (rest[i] === '--cell') options.cell = Math.max(120, Number(rest[++i]) || 300) // ขนาดช่องในแผ่นรวมภาพ (px)
  else if (rest[i] === '--range') options.range = Math.min(30, Math.max(1, Number(rest[++i]) || 10)) // series: ±กี่เลขภาพ
  else args.push(rest[i])
}

// ---------- แหล่งภาพ (provider) ----------
// ผลจาก Pixabay → รูปแบบกลาง
const pixabayCandidate = (hit) => ({
  provider: 'pixabay',
  sourceId: hit.id,
  preview: hit.webformatURL,
  full: hit.largeImageURL,
  photographer: hit.user,
  photographerUrl: `https://pixabay.com/users/${hit.user}-${hit.user_id}/`,
  pageUrl: hit.pageURL,
})

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
      return hits.map(pixabayCandidate)
    },
    // ภาพเดียวตามเลขภาพ (ไม่มีภาพเลขนี้ → null)
    async byId(sourceId) {
      const url = new URL('https://pixabay.com/api/')
      url.searchParams.set('key', this.key)
      url.searchParams.set('id', String(sourceId))
      const response = await fetch(url)
      if (!response.ok) return null
      const { hits = [] } = await response.json()
      return hits[0] ? pixabayCandidate(hits[0]) : null
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
// copy ไม่ได้ดาวน์โหลดอะไร → ไม่ต้องใช้ key
if (!provider && command !== 'copy') {
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
      const image = await sharp(buffer).resize(cell, cell, { fit: 'contain', background: '#ffffff' }).composite([{ input: label }]).toBuffer()
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
    await saveCandidates(id, `${id} - "${query}"`, found)
  }
}

// ดาวน์โหลดภาพตัวอย่าง → แผ่นรวมภาพ <id>.jpg + รายการตัวเลือก <id>.json (ใช้ตอน pick)
// ภาพไหนโหลดไม่ได้หรือเปิดไม่ได้ ให้ข้ามไป (ไม่หยุดทั้งชุด)
async function saveCandidates(id, title, found) {
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
    console.warn(`${id}: ไม่พบภาพที่ใช้ได้ (${title})`)
    return
  }
  const candidates = usable.map((item) => item.candidate)
  const previews = usable.map((item) => item.buffer)
  await makeContactSheet(previews, title, path.join(options.out, `${id}.jpg`))
  await fs.writeFile(path.join(options.out, `${id}.json`), JSON.stringify(candidates, null, 2))
  console.log(`${id}: ${candidates.length} ภาพ → ${path.join(options.out, `${id}.jpg`)}`)
}

// ---------- คำสั่ง series (ภาพชุดเดียวกันของช่างภาพคนเดียว) ----------
async function runSeries([id, sourceIdText]) {
  const center = Number(sourceIdText)
  if (!id || !Number.isInteger(center)) {
    console.log('ใช้: node --env-file=.env.local scripts/fetch-images.mjs series <id> <เลขภาพ Pixabay> [--range 10]')
    process.exit(1)
  }
  if (!provider.byId) {
    console.error('คำสั่ง series ใช้ได้กับ Pixabay เท่านั้น')
    process.exit(1)
  }
  const origin = await provider.byId(center)
  if (!origin) throw new Error(`ไม่พบภาพเลข ${center}`)
  await fs.mkdir(options.out, { recursive: true })

  // ขอทีละภาพ (ไม่ยิงพร้อมกัน — Pixabay จำกัด 100 ครั้ง/นาที)
  const found = []
  for (let sourceId = center - options.range; sourceId <= center + options.range; sourceId += 1) {
    const candidate = sourceId === center ? origin : await provider.byId(sourceId)
    if (candidate?.photographer === origin.photographer) found.push(candidate)
  }
  await saveCandidates(id, `${id} - ${origin.photographer} #${center} ±${options.range}`, found)
  found.forEach((candidate, index) => console.log(`  ${index + 1}: ${candidate.pageUrl}`))
}

// ---------- คำสั่ง pick ----------
async function runPick(choices) {
  const credits = JSON.parse(await fs.readFile(CREDITS_FILE, 'utf8').catch(() => '{}'))
  await fs.mkdir(IMAGES_DIR, { recursive: true })

  for (const choice of choices) {
    const [id, pickText] = choice.split('=')
    const [numberText, mode] = pickText.split('@')
    if (mode && !isCropMode(mode)) throw new Error(`${id}: โหมดครอป "${mode}" ใช้ไม่ได้ (${CROP_MODES.join(' / ')} / x,y,ขนาด)`)
    const candidates = JSON.parse(await fs.readFile(path.join(options.out, `${id}.json`), 'utf8'))
    const picked = candidates[Number(numberText) - 1]
    if (!picked) throw new Error(`${id}: ไม่มีภาพหมายเลข ${numberText}`)

    const buffer = await download(picked.full)
    const outFile = path.join(IMAGES_DIR, `${id}.webp`)
    const square = await toSquare(buffer, mode)
    await square.webp({ quality: 78 }).toFile(outFile)

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

  await saveCredits(credits)
}

// ---------- คำสั่ง original / recrop (ใช้ภาพต้นฉบับเดิมตามเครดิต) ----------
async function originalOf(id, credits) {
  const credit = credits[id]
  if (!credit) throw new Error(`${id}: ไม่มีเครดิต`)
  if (credit.provider !== 'pixabay' || !provider.byId) throw new Error(`${id}: ใช้ได้กับภาพจาก Pixabay เท่านั้น`)
  const found = await provider.byId(credit.sourceId)
  if (!found) throw new Error(`${id}: ไม่พบภาพเลข ${credit.sourceId} แล้ว`)
  return download(found.full)
}

// ต้นฉบับเต็มภาพ → <out>/original-<id>.jpg
async function runOriginal(ids) {
  const credits = JSON.parse(await fs.readFile(CREDITS_FILE, 'utf8'))
  await fs.mkdir(options.out, { recursive: true })
  for (const id of ids) {
    try {
      const file = path.join(options.out, `original-${id}.jpg`)
      await sharp(await originalOf(id, credits)).flatten({ background: '#ffffff' }).resize(options.cell, options.cell, { fit: 'inside' }).jpeg({ quality: 80 }).toFile(file)
      console.log(file)
    } catch (error) {
      console.warn(error.message)
    }
  }
}

async function runRecrop(choices) {
  const credits = JSON.parse(await fs.readFile(CREDITS_FILE, 'utf8'))
  for (const choice of choices) {
    const [id, mode] = choice.split('=')
    if (!isCropMode(mode)) throw new Error(`${id}: โหมดครอป "${mode}" ใช้ไม่ได้`)
    const square = await toSquare(await originalOf(id, credits), mode)
    await square.webp({ quality: 78 }).toFile(path.join(IMAGES_DIR, `${id}.webp`))
    console.log(`${id} ครอปใหม่ (${mode})`)
  }
}

// เรียง key ให้อ่านง่าย แล้วบันทึกเครดิต
async function saveCredits(credits) {
  const sorted = Object.fromEntries(Object.entries(credits).sort(([a], [b]) => a.localeCompare(b)))
  await fs.writeFile(CREDITS_FILE, `${JSON.stringify(sorted, null, 2)}\n`)
}

// ---------- คำสั่ง copy ----------
// ใช้ภาพเดิมซ้ำกับข้อใหม่ (เช่น Stage 6 อ่านคำ/ประโยคที่เคยเห็นภาพใน Stage 1–5): คัดลอกไฟล์ + เครดิตช่างภาพ
//   copy <id ใหม่>=<id เดิม> ...   (ไม่ต้องใช้ key — ไม่ได้ดาวน์โหลดอะไร)
async function runCopy(pairs) {
  const credits = JSON.parse(await fs.readFile(CREDITS_FILE, 'utf8').catch(() => '{}'))
  for (const pair of pairs) {
    const [id, fromId] = pair.split('=')
    if (!id || !fromId) throw new Error(`"${pair}": ใช้รูปแบบ <id ใหม่>=<id เดิม>`)
    if (!credits[fromId]) throw new Error(`${fromId}: ไม่มีเครดิตของภาพเดิม`)
    await fs.copyFile(path.join(IMAGES_DIR, `${fromId}.webp`), path.join(IMAGES_DIR, `${id}.webp`))
    credits[id] = { ...credits[fromId] }
    console.log(`${id} ← ${fromId} (โดย ${credits[id].photographer})`)
  }
  await saveCredits(credits)
}

if (command === 'search') await runSearch(args)
else if (command === 'series') await runSeries(args)
else if (command === 'pick') await runPick(args)
else if (command === 'copy') await runCopy(args)
else if (command === 'original') await runOriginal(args)
else if (command === 'recrop') await runRecrop(args)
else {
  console.log(
    'ใช้: node --env-file=.env.local scripts/fetch-images.mjs search [id ...] | series <id> <เลขภาพ> | pick id=เลข ... | copy id=idเดิม ...',
  )
  process.exit(1)
}
