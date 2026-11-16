// =========================================================
// lessonSteps.js — ลำดับขั้นของบทเรียน ตามประเภทบท (ส่วนที่ 4 ของสเปก)
// - wholeSteps      ทำครั้งเดียวทั้งบท (มาก่อนขั้นรายข้อ): listenDialogue / chooseRole / rolePlay / rolePlayOwn (บทสนทนา),
//                   listenStory (ฟังเรื่องเล่าทั้งเรื่อง), listenRhyme (ฟังคำคล้องจองทั้งเพลง)
// - itemSteps       ทำทีละข้อ: lookListen (ดูภาพ + ฟัง ปกติ/ช้า), speak (พูดตาม), listenSentence (ฟังประโยคถาม-ตอบ),
//                   listenContext (ฟังประโยคในบริบท), swap (สลับคำในบริบท), rhymeFill (เติมคำท้ายที่คล้องจอง)
//                   ขั้นใน STEP_NEEDS ทำเฉพาะข้อที่มีข้อมูลของขั้นนั้น (เตรียมใน utils/lessonItems.js)
// - game            มินิเกมแทรกในบท (ทำครั้งเดียวทั้งบท ด้วยคำ/ประโยคของบทนั้น) — keepOrder = เล่นตามลำดับข้อ ไม่สุ่ม
//                   ใส่เป็น array ได้ → เล่นต่อกันหลายเกม (เช่น phonics: ฟังเลือกคำ แล้วอ่านแล้วแตะภาพ)
// - afterGameSteps  ทำทีละข้ออีกรอบหลังเกม: speakOwn (ใช้เอง — ปิดข้อความ ดูภาพแล้วตอบเอง), tellStory (เล่าเรื่องภาพเอง)
//                   ห่างจากตอนฝึกครั้งแรก → ได้ดึงความจำจริง ไม่ใช่พูดซ้ำทันที
// - retry           ลำดับขั้นตอน "ฝึกซ้ำเฉพาะข้อที่พลาด" (ไม่ใส่ = ใช้ลำดับปกติกับข้อที่พลาด)
// - sharedImage     ทุกข้อในบทใช้ภาพฉากเดียวกัน (บทสนทนา/คำคล้องจอง) → แยกข้อด้วยภาพไม่ได้
// - review          ขั้นตอนทบทวนของข้อจากบทนี้: 'tap' (เกม Listen & Tap — ภาพต้องไม่ซ้ำกัน) / 'speak' (พูดตาม)
// Stage 1–3 ใช้แค่ขั้น 1 (ดู+ฟัง), 3 (ฟังช้า/ปกติ), 4 (พูดตาม) + เกม Listen & Tap — ไม่แสดงข้อความ
// Stage 4: ฟัง (เดาจากภาพ → ดูข้อความ → ช้า/ปกติ) → พูดตาม + recast → สลับคำ → เกม Shadow Karaoke → ใช้เอง
// Stage 5 ประโยคในบริบท: ฟัง (ฉาก + เสียงพูดเชื่อม) → พูดตาม → สลับคำ → เกม Word Swap Race → ใช้เอง
// Stage 6 อ่าน: phonics (เสียงใหม่ → ไล่เสียงแล้วอ่านทั้งคำ → Minimal Pair Duel → Read & Tap),
//   sight words (ดู+ฟังคำ → อ่านประโยค → Minimal Pair Duel), อ่านนิทาน (อ่านทีละหน้า → Read & Tap)
//   ขั้นอ่าน (blend / sightWord / readAloud) = ReadAloudStep — ทบทวนแบบ 'read' (อ่านออกเสียงอีกครั้ง)
// เพิ่มประเภทบทใหม่ = เพิ่มค่าตรงนี้ + component ของขั้นใหม่ใน LessonPlayer
// =========================================================

export const LESSON_FLOWS = {
  // Stage 1 ช่วงฟัง: ฟังอย่างเดียว ไม่บังคับพูด
  listen: { itemSteps: ['lookListen'], game: 'listen-tap', review: ['tap'] },
  // Stage 2 คำเดี่ยว / Stage 3 สองคำ: ฟัง → พูดตาม
  word: { itemSteps: ['lookListen', 'speak'], game: 'listen-tap', review: ['tap', 'speak'] },
  twoWord: { itemSteps: ['lookListen', 'speak'], game: 'listen-tap', review: ['tap', 'speak'] },
  // Stage 4 ประโยคสั้น: ถาม-ตอบ + recast
  sentence: {
    itemSteps: ['listenSentence', 'speak', 'swap'],
    game: 'shadow-karaoke',
    afterGameSteps: ['speakOwn'],
    review: ['tap', 'speak'],
  },
  // Stage 5+ ประโยคในบริบท (ส่วนที่ 2.2 + 2.3)
  context: {
    itemSteps: ['listenContext', 'speak', 'swap'],
    game: 'word-swap-race',
    afterGameSteps: ['speakOwn'],
    review: ['tap', 'speak'],
  },
  // Stage 5 คำคล้องจอง: ฟังทั้งเพลง → เติมคำท้ายที่คล้องจอง → คาราโอเกะตามลำดับบรรทัด (ฝึกจังหวะ)
  //   → ร้องต่อเอง (ได้ยินบรรทัดก่อน แล้วพูดบรรทัดถัดไปโดยไม่ดูข้อความ)
  rhyme: {
    wholeSteps: ['listenRhyme'],
    itemSteps: ['rhymeFill'],
    game: 'shadow-karaoke',
    keepOrder: true,
    afterGameSteps: ['speakOwn'],
    sharedImage: true,
    review: ['speak'],
  },
  // Stage 5 บทสนทนา: ฟังทั้งบท → เลือกว่าจะเป็นใคร → เล่นบทบาท (เห็นบทของเรา) → เล่นอีกรอบโดยซ่อนบทของเรา
  //   ฝึกซ้ำ: บรรทัดที่พลาดแบบ "อีกฝ่ายพูด → เราพูด" (พูดตาม → พูดเอง)
  dialogue: {
    wholeSteps: ['listenDialogue', 'chooseRole', 'rolePlay', 'rolePlayOwn'],
    retry: { itemSteps: ['speak'], afterGameSteps: ['speakOwn'] },
    sharedImage: true,
    review: ['speak'],
  },
  // Stage 5 เล่าเรื่องจากภาพ: ฟังทั้งเรื่อง → พูดตามทีละภาพ → เกม Listen & Tap (ฟังแล้วแตะภาพ) → เล่าเองทีละภาพ (ตรวจคำสำคัญ)
  story: {
    wholeSteps: ['listenStory'],
    itemSteps: ['speak'],
    game: 'listen-tap',
    afterGameSteps: ['tellStory'],
    review: ['tap', 'speak'],
  },
  // Stage 6 phonics: เสียงใหม่ของบท → ไล่เสียงทีละตัวแล้วอ่านทั้งคำ → ฟังแล้วเลือกคำที่ได้ยิน (sit / sat) → อ่านแล้วแตะภาพ
  phonics: {
    wholeSteps: ['phonicsIntro'],
    itemSteps: ['blend'],
    game: ['minimal-pair-duel', 'read-tap'],
    review: ['read'],
  },
  // Stage 6 sight words: ดู + ฟังคำ (จำทั้งคำ) → อ่านประโยคที่มีคำนั้น → ฟังแล้วเลือกคำ (คู่คำหน้าตาคล้าย was / saw)
  sightWords: { itemSteps: ['sightWord'], game: 'minimal-pair-duel', review: ['read'] },
  // Stage 6 อ่านนิทาน: อ่านออกเสียงทีละหน้า (ไฮไลต์คำที่อ่านถึง) → อ่านแล้วแตะภาพ
  reading: { itemSteps: ['readAloud'], game: 'read-tap', review: ['read'] },
}

// ขั้นอ่านของแต่ละประเภทบท → แบบของ ReadAloudStep (ใช้ทั้งในบทและตอนทบทวน)
export const READ_VARIANTS = { blend: 'blend', sightWord: 'sight', readAloud: 'page' }
const READ_VARIANT_OF_TYPE = { phonics: 'blend', sightWords: 'sight', reading: 'page' }
export const readVariantOf = (lesson) => READ_VARIANT_OF_TYPE[lesson?.type] ?? 'page'

// เกมในบท (เป็น array เสมอ)
export const flowGames = (flow) => [].concat(flow?.game ?? [])

// เกมที่เป็นโหมดหนึ่งของมินิเกมอื่น (Read & Tap = Listen & Tap แบบอ่านเอง)
export const GAME_BASE = { 'read-tap': 'listen-tap' }

// ขั้นรายข้อที่ทำเฉพาะข้อที่มีข้อมูลของขั้นนั้น
const STEP_NEEDS = { rhymeFill: 'rhymeFill' }

// ประเภทบทที่ตัวเล่นรองรับแล้ว (ที่เหลือจะมาในขั้นถัด ๆ ไป)
export const isPlayable = (lesson) => Boolean(LESSON_FLOWS[lesson?.type])

/**
 * สร้างรายการขั้นของบท
 * @param flow  ค่าจาก LESSON_FLOWS
 * @param items ข้อที่จะเล่น (เตรียมแล้วด้วย prepareLessonItems)
 * @param retry ฝึกซ้ำเฉพาะข้อที่พลาด → ใช้ flow.retry ถ้ามี
 * @returns [{ kind: 'listenDialogue' | …, whole: true }, { kind: 'speak' | …, item }, { kind: 'game', game }, …]
 */
export function buildLessonSteps(flow, items, { retry = false } = {}) {
  const active = retry && flow.retry ? flow.retry : flow
  const applies = (kind, item) => !STEP_NEEDS[kind] || Boolean(item[STEP_NEEDS[kind]])
  const perItem = (kinds = []) =>
    items.flatMap((item) => kinds.filter((kind) => applies(kind, item)).map((kind) => ({ kind, item })))
  return [
    ...(active.wholeSteps ?? []).map((kind) => ({ kind, whole: true })),
    ...perItem(active.itemSteps),
    ...flowGames(active).map((game) => ({ kind: 'game', game })),
    // รอบใช้เอง: ทำครบทุกข้อก่อน แล้วค่อยวนกลับมาข้อแรก (เว้นระยะให้ได้ดึงความจำ)
    ...(active.afterGameSteps ?? []).flatMap((kind) =>
      items.filter((item) => applies(kind, item)).map((item) => ({ kind, item })),
    ),
  ]
}

// ขั้นทบทวนของข้อจากบทประเภทนี้ ('tap' / 'speak' / 'read')
export const reviewKindsOf = (lesson) => LESSON_FLOWS[lesson?.type]?.review ?? []

// XP ตามสเปก 8.1: ฟัง 5, พูดตาม 15, พูดเองไม่ดูข้อความ 25
//   สลับคำ: ลองสลับ = ฟัง 5 (+ พูดประโยคใหม่ผ่าน = พูดตาม 15)
//   เกม: Listen & Tap แตะถูก 1 รอบ = ฟัง 5 / Shadow Karaoke พูดทัน 1 รอบ = พูดตาม 15
//        Word Swap Race สลับถูกตั้งแต่ครั้งแรก 1 คำ = 3 (60 วิ ได้ราว 15–25 คำ → ใกล้เคียงคาราโอเกะ)
//   ฟังทั้งบท (บทสนทนา/เรื่องเล่า/คำคล้องจอง) = ฟัง 5 ต่อบรรทัด/ภาพ
//   เติมคำคล้องจองถูกตั้งแต่ครั้งแรก = ฟัง 5 / เล่นบทบาทผ่าน 1 บรรทัด = พูดตาม 15 (รอบซ่อนบท = 25) / เล่าเรื่องเองผ่าน 1 ภาพ = 25
//   Stage 6: ฟังเสียงใหม่ = ฟัง 5 ต่อเสียง / อ่านออกเสียงผ่าน = พูดตาม 15 / Minimal Pair Duel, Read & Tap ถูกตั้งแต่ครั้งแรก = 5
export const XP = { listen: 5, speak: 15, speakOwn: 25, gameCorrect: 5, swap: 5, raceSwap: 3, rhymeFill: 5 }
export const GAME_ROUND_XP = {
  'listen-tap': XP.gameCorrect,
  'shadow-karaoke': XP.speak,
  'word-swap-race': XP.raceSwap,
  'minimal-pair-duel': XP.gameCorrect,
  'read-tap': XP.gameCorrect,
}

// ลองพูดได้ไม่จำกัด แต่ครบกี่ครั้งแล้วให้กด "ไปต่อ" ได้ (ข้อนั้นเข้ารายการทบทวน)
export const MAX_ATTEMPTS_BEFORE_SKIP = 3
