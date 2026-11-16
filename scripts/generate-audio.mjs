// =========================================================
// สร้างไฟล์เสียงภาษาอังกฤษล่วงหน้าด้วย Kokoro-82M
// (AI อ่านออกเสียงแบบโอเพนซอร์ส สัญญาอนุญาต Apache-2.0 — ฟรี ใช้เชิงพาณิชย์ได้)
//
// รัน:  npm run audio
//   - ครั้งแรกจะดาวน์โหลดโมเดลจาก Hugging Face (ราว 90MB) เก็บไว้ใน cache ของ node_modules (ไม่เข้า git)
//   - ไม่ต้องมี key / บัญชีใด ๆ
//
// ทำอะไร:
//   1) รวบรวมข้อความที่เว็บต้องพูดจาก src/data/lessons.json + phonics.json + game.json (ฝึกเสียง)
//      (ดู src/data/speechTexts.js)
//   2) สร้างเสียง 2 ความเร็ว: normal (1.0) และ slow (0.75)
//   3) เข้ารหัสเป็น MP3 → public/audio/<hash>.mp3 (ชื่อไฟล์มาจาก hash ของ เสียง+ความเร็ว+ข้อความ)
//   4) เขียนสารบัญ src/data/audioManifest.json ให้เว็บรู้ว่าข้อความไหนใช้ไฟล์ไหน
//   - ข้อความที่มีไฟล์อยู่แล้วจะข้าม (รันซ้ำเร็ว) และลบไฟล์ที่ไม่ได้ใช้แล้วทิ้ง
//   - ไฟล์เยอะ → แบ่งรันพร้อมกันหลายตัวได้: node scripts/generate-audio.mjs --shard 1/3 (และ 2/3, 3/3)
// =========================================================
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { KokoroTTS } from 'kokoro-js'
import { Mp3Encoder } from '@breezystack/lamejs'
import { collectSpeechTexts } from '../src/data/speechTexts.js'
// ชื่อไฟล์ใช้ฟังก์ชันเดียวกับหน้าเว็บ (หน้าเว็บคำนวณชื่อไฟล์เองจากข้อความ) → ต้องตรงกันเสมอ
import { AUDIO_SPEEDS, AUDIO_VOICE, audioPathFor } from '../src/utils/audioPath.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const LESSONS_FILE = path.join(ROOT, 'src', 'data', 'lessons.json')
const PHONICS_FILE = path.join(ROOT, 'src', 'data', 'phonics.json')
const GAME_FILE = path.join(ROOT, 'src', 'data', 'game.json')
const MANIFEST_FILE = path.join(ROOT, 'src', 'data', 'audioManifest.json')
const AUDIO_DIR = path.join(ROOT, 'public', 'audio')

const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX'
const VOICE = AUDIO_VOICE // af_heart: เสียงผู้หญิงอเมริกัน คุณภาพดีที่สุดของ Kokoro (เหมาะกับบทพ่อแม่คุยกับลูก)
const SPEEDS = AUDIO_SPEEDS // { normal: 1.0, slow: 0.75 }
const MP3_KBPS = 64

// ---------- ตัวช่วย ----------

const exists = (file) =>
  fs.access(file).then(
    () => true,
    () => false,
  )

// Float32 PCM (-1..1) → MP3 mono
function encodeMp3(samples, sampleRate) {
  const pcm = new Int16Array(samples.length)
  for (let i = 0; i < samples.length; i += 1) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  const encoder = new Mp3Encoder(1, sampleRate, MP3_KBPS)
  const parts = []
  const blockSize = 1152
  for (let i = 0; i < pcm.length; i += blockSize) {
    const chunk = encoder.encodeBuffer(pcm.subarray(i, i + blockSize))
    if (chunk.length) parts.push(Buffer.from(chunk))
  }
  const end = encoder.flush()
  if (end.length) parts.push(Buffer.from(end))
  return Buffer.concat(parts)
}

// ---------- เริ่มทำงาน ----------
const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf8'))
const { lessons } = await readJson(LESSONS_FILE)
const { sounds: phonicsSounds } = await readJson(PHONICS_FILE)
const { soundPractice } = await readJson(GAME_FILE)
const texts = collectSpeechTexts({ lessons, soundPractice, phonicsSounds })
await fs.mkdir(AUDIO_DIR, { recursive: true })

const manifest = { voice: VOICE, normal: {}, slow: {} }
const todo = []
for (const text of texts) {
  for (const speedKey of Object.keys(SPEEDS)) {
    const audioPath = audioPathFor(text, speedKey)
    const fileName = path.basename(audioPath)
    manifest[speedKey][text] = audioPath
    if (!(await exists(path.join(AUDIO_DIR, fileName)))) todo.push({ text, speedKey, fileName })
  }
}

// --shard i/n → ทำเฉพาะงานลำดับที่ (index % n) === i-1 (รันหลายตัวพร้อมกันได้ ไม่ทำงานซ้ำกัน)
const shardArg = process.argv.indexOf('--shard')
const [shardIndex, shardCount] = shardArg > 0 ? process.argv[shardArg + 1].split('/').map(Number) : [1, 1]
const myJobs = todo.filter((_, index) => index % shardCount === shardIndex - 1)

console.log(`ข้อความทั้งหมด ${texts.length} | ต้องสร้างใหม่ ${todo.length} ไฟล์ | รอบนี้ทำ ${myJobs.length} ไฟล์ (shard ${shardIndex}/${shardCount})`)

if (myJobs.length > 0) {
  console.log(`กำลังโหลดโมเดล ${MODEL_ID} (ครั้งแรกจะดาวน์โหลดราว 90MB)...`)
  const tts = await KokoroTTS.from_pretrained(MODEL_ID, { dtype: 'q8', device: 'cpu' })

  for (const [index, job] of myJobs.entries()) {
    const audio = await tts.generate(job.text, { voice: VOICE, speed: SPEEDS[job.speedKey] })
    const mp3 = encodeMp3(audio.audio, audio.sampling_rate)
    // เขียนไฟล์ชั่วคราวก่อนแล้วค่อยเปลี่ยนชื่อ → หยุดกลางคันก็ไม่มีไฟล์เสียงครึ่ง ๆ กลาง ๆ
    const target = path.join(AUDIO_DIR, job.fileName)
    await fs.writeFile(`${target}.tmp`, mp3)
    await fs.rename(`${target}.tmp`, target)
    console.log(`[${index + 1}/${myJobs.length}] ${job.speedKey.padEnd(6)} ${Math.round(mp3.length / 1024)}KB  ${job.text}`)
  }
}

// ลบไฟล์เสียงที่ไม่ได้ใช้แล้ว (เช่น แก้ข้อความในบทเรียน)
const used = new Set(Object.values(manifest.normal).concat(Object.values(manifest.slow)).map((p) => path.basename(p)))
for (const file of await fs.readdir(AUDIO_DIR)) {
  if (file.endsWith('.mp3') && !used.has(file)) {
    await fs.unlink(path.join(AUDIO_DIR, file))
    console.log(`ลบไฟล์ที่ไม่ใช้แล้ว: ${file}`)
  }
}

// เขียนสารบัญ (เรียง key ให้อ่านง่าย)
const sortKeys = (obj) => Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)))
await fs.writeFile(
  MANIFEST_FILE,
  `${JSON.stringify({ voice: VOICE, normal: sortKeys(manifest.normal), slow: sortKeys(manifest.slow) }, null, 2)}\n`,
)
console.log(`เสร็จแล้ว → ${path.relative(ROOT, MANIFEST_FILE)}`)
