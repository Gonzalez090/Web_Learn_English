// =========================================================
// spelling.js — ตรวจงานเขียน Stage 7 (ส่วนที่ 3: ตรวจตัวสะกด, ช่วงแรกยอมรับสะกดตามเสียงเป็น "ใกล้แล้ว")
// (ฟังก์ชันล้วน ไม่แตะเบราว์เซอร์ → ทดสอบได้ / ใส่ .js ใน import เผื่อสคริปต์ Node ใช้)
//
// สถานะของคำที่เขียน (เทียบกับคำที่ถูก):
//   correct  สะกดถูก (ไม่สนตัวพิมพ์ใหญ่/เล็กและเครื่องหมายวรรคตอน)
//   sound    สะกดตามเสียง เช่น kat (cat), fone (phone), nite (night), hav (have) — เด็กเจ้าของภาษาก็เขียนแบบนี้ช่วงแรก
//   close    พิมพ์พลาดนิดเดียว เช่น kiet (kite), freind (friend)
//   missed   ยังไม่ใช่คำนี้ / ยังไม่ได้เขียน
// ระดับการตรวจของบท (lesson.spelling):
//   'sound' (บทแรก ๆ) — sound / close นับว่าผ่าน ขึ้นว่า "ใกล้แล้ว" แล้วโชว์คำที่ถูก (recast ในการเขียน)
//   'exact' (บทหลัง ๆ) — ต้องสะกดตรง; sound / close = "ใกล้แล้ว ลองอีกครั้ง"
// ตัวพิมพ์ใหญ่ต้นประโยค / จุดท้ายประโยค / ' ในรูปย่อ ไม่หักคะแนน แต่มีคำแนะนำเบา ๆ (tips)
// =========================================================
import { normalizeWord } from './compareWords.js'
import { checkKeywords, stem } from './storyCheck.js'

export const SPELLING_MODES = ['sound', 'exact']
// ประโยคที่นับได้ต้องมีอย่างน้อย 3 คำ ("Up, up, up!" / "The kite flew!")
export const MIN_WORDS_PER_SENTENCE = 3

// คำ Dolch 220 คำ (เรียนครบใน Stage 6) — คำที่ผู้เรียนเขียนแล้วอยู่ในชุดนี้ = คำจริงแน่ ๆ ไม่ต้องเสนอคำสะกดอื่น
// (เช่น เขียน went ในเรื่องที่ตัวอย่างใช้ want → ไม่ขึ้นว่า "ใกล้แล้ว: want")
const COMMON_WORDS = new Set(
  `a and away big blue can come down find for funny go help here i in is it jump little look make me my not one play
  red run said see the three to two up we where yellow you all am are at ate be black brown but came did do eat four
  get good have he into like must new no now on our out please pretty ran ride saw say she so soon that there they
  this too under want was well went what white who will with yes after again an any as ask by could every fly from
  give going had has her him his how just know let live may of old once open over put round some stop take thank
  them then think walk were when always around because been before best both buy call cold does don't fast first
  five found gave goes green its made many off or pull read right sing sit sleep tell their these those upon us use
  very wash which why wish work would write your about better bring carry clean cut done draw drink eight fall far
  full got grow hold hot hurt if keep kind laugh light long much myself never only own pick seven shall show six
  small start ten today together try warm`.split(/\s+/),
)

// คำ 1 คำตามที่เขียน → รูปที่ใช้เทียบ: ตัวเล็ก, ' แบบตรง, ตัดเครื่องหมายหน้า/หลังคำ ("Kite!" → "kite", "Don’t," → "don't")
export function cleanWord(word) {
  return String(word ?? '')
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, '')
    .replace(/^'+|'+$/g, '')
}

// ข้อความ → คำตามที่เขียน [{ display, clean }] (ตัดคำที่เป็นเครื่องหมายล้วนทิ้ง)
export function writtenWords(text) {
  return String(text ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .map((display) => ({ display, clean: cleanWord(display) }))
    .filter((word) => word.clean)
}

/**
 * รูปเสียงของคำ (ใช้เทียบว่า "สะกดตามเสียง" หรือเปล่า — ไม่ใช่การออกเสียงจริงทุกคำ)
 * กฎที่เด็กมักเขียนตามเสียง: c/k/ck/q = k, ph = f, igh = i, gh ไม่ออกเสียง, kn/wr ต้นคำ, ตัวซ้อน = ตัวเดียว,
 * e ท้ายคำไม่ออกเสียง, สระคู่ที่พบบ่อย (ee/ea = e, ai/ay = a, oa = o, oo = u), y ท้ายคำ = i
 *   cat/kat → kat, phone/fone → fon, night/nite → nit, have/hav → hav, back/bak → bak, school/skool → skul
 */
export function soundKey(word) {
  let key = cleanWord(word).replace(/[^a-z]/g, '')
  if (!key) return ''
  key = key.replace(/^sch/, 'sk')
  key = key.replace(/t?ch/g, 'C') // ch / tch = เสียงเดียวกัน (ตัวใหญ่ = ใช้แทนเสียงนี้)
  key = key.replace(/igh/g, 'i').replace(/gh(?=t|$)/g, '')
  key = key.replace(/ph/g, 'f').replace(/ck/g, 'k').replace(/wh/g, 'w')
  key = key.replace(/^kn/, 'n').replace(/^wr/, 'r')
  key = key.replace(/qu/g, 'kw').replace(/x/g, 'ks').replace(/q/g, 'k')
  key = key.replace(/c(?=[eiy])/g, 's').replace(/c/g, 'k').replace(/z/g, 's')
  key = key.replace(/ee|ea/g, 'e').replace(/ai|ay/g, 'a').replace(/oa/g, 'o').replace(/oo/g, 'u')
  if (key.length >= 4) key = key.replace(/([^aeiou])e$/, '$1')
  key = key.replace(/([^aeiou])y$/, '$1i')
  return key.replace(/(.)\1+/g, '$1')
}

// ระยะห่างแบบ Damerau (สลับตัวอักษรติดกัน = แก้ 1 ครั้ง เช่น kiet → kite)
export function editDistance(a, b) {
  const rows = a.length + 1
  const cols = b.length + 1
  const d = Array.from({ length: rows }, (_, i) => Array.from({ length: cols }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)))
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
    }
  }
  return d[a.length][b.length]
}

// สลับตัวอักษรติดกันคู่เดียว (teh → the) — นับเป็นพิมพ์พลาดแม้คำสั้น
const isSwap = (a, b) => a.length === b.length && a !== b && editDistance(a, b) === 1 && [...a].sort().join('') === [...b].sort().join('')

const sameList = (a, b) => a.length === b.length && a.every((item, index) => item === b[index])

/**
 * เทียบคำ 1 คำ
 * @returns 'correct' | 'sound' | 'close' | 'missed'
 */
export function spellingStatus(expected, typed) {
  const want = cleanWord(expected)
  const got = cleanWord(typed)
  if (!got) return 'missed'
  if (want === got) return 'correct'
  if (sameList(normalizeWord(want), normalizeWord(got))) return 'correct' // 2 = two, ok = okay
  const key = soundKey(want)
  if (key && key === soundKey(got)) return 'sound'
  // เขียนเป็นคำจริงอีกคำ (hold แทน held, went แทน want) = ยังไม่ใช่คำนี้ ไม่ใช่พิมพ์พลาด
  if (COMMON_WORDS.has(got)) return 'missed'
  // คำยาวยอมให้พิมพ์พลาดได้มากขึ้น (คำ 3 ตัวพลาด 1 ตัวมักกลายเป็นอีกคำ เช่น sit / sat)
  const allowed = want.length >= 8 ? 2 : want.length >= 4 ? 1 : 0
  if (editDistance(want, got) <= allowed || isSwap(want, got)) return 'close'
  return 'missed'
}

// สถานะที่นับว่าผ่านในแต่ละระดับ
const PASSING = { sound: ['correct', 'sound', 'close'], exact: ['correct'] }
export const isPassingStatus = (status, mode = 'exact') => (PASSING[mode] ?? PASSING.exact).includes(status)

// ต้นทุนตอนจับคู่คำ (ยิ่งน้อยยิ่งตรง)
const SUB_COST = { correct: 0, sound: 0.3, close: 0.5, missed: 1.2 }
const MISS_COST = 1 // คำที่ควรมีแต่ไม่ได้เขียน
const EXTRA_COST = 0.7 // คำที่เขียนเกินมา

// จับคู่คำที่ถูกกับคำที่เขียน (DP แบบเดียวกับ compareWords) → { words, extra }
function alignWritten(want, got) {
  const n = want.length
  const m = got.length
  const status = want.map((w) => got.map((g) => spellingStatus(w.clean, g.clean)))
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = 1; i <= n; i += 1) dp[i][0] = i * MISS_COST
  for (let j = 1; j <= m; j += 1) dp[0][j] = j * EXTRA_COST
  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      dp[i][j] = Math.min(
        dp[i - 1][j - 1] + SUB_COST[status[i - 1][j - 1]],
        dp[i - 1][j] + MISS_COST,
        dp[i][j - 1] + EXTRA_COST,
      )
    }
  }

  const words = want.map((w) => ({ text: w.display, typed: '', status: 'missed' }))
  const extra = []
  const written = [] // คำที่เขียน เรียงตามที่เขียน + สถานะ (คำเกิน = 'extra')
  let i = n
  let j = m
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + SUB_COST[status[i - 1][j - 1]]) {
      const wordStatus = status[i - 1][j - 1]
      words[i - 1] = { text: want[i - 1].display, typed: got[j - 1].display, status: wordStatus }
      written.unshift({ text: got[j - 1].display, status: wordStatus })
      i -= 1
      j -= 1
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + MISS_COST) {
      i -= 1
    } else {
      extra.unshift(got[j - 1].display)
      written.unshift({ text: got[j - 1].display, status: 'extra' })
      j -= 1
    }
  }
  return { words, extra, written }
}

const isSentence = (text) => writtenWords(text).length >= 2
const firstLetter = (text) => String(text ?? '').match(/[A-Za-z]/)?.[0] ?? ''
const endsWithStop = (text) => /[.!?]["'”’)]*$/.test(String(text ?? '').trim())

// คำแนะนำเบา ๆ (ไม่หักคะแนน): ตัวใหญ่ต้นประโยค, จุดท้ายประโยค, ' ในรูปย่อ
function writingTips(target, typed, words) {
  const tips = []
  if (isSentence(target)) {
    const want = firstLetter(target)
    const got = firstLetter(typed)
    if (want && got && want === want.toUpperCase() && got !== got.toUpperCase()) tips.push('capital')
    if (endsWithStop(target) && !endsWithStop(typed)) tips.push('period')
  }
  const missingApostrophe = words.some(
    (word) => word.typed && cleanWord(word.text).includes("'") && !cleanWord(word.typed).includes("'"),
  )
  if (missingApostrophe) tips.push('apostrophe')
  return tips
}

// คะแนน: ถูก 1, ใกล้แล้ว 0.75 → 0–100
const WORD_POINTS = { correct: 1, sound: 0.75, close: 0.75, missed: 0 }

function scoreAgainst(target, typed, mode) {
  const want = writtenWords(target)
  const got = writtenWords(typed)
  if (!want.length) return null
  // เขียนรูปเต็มแทนรูปย่อ / ตัวเลขแทนคำ ก็ถูก (do not = don't, 2 = two)
  const expand = (words) => words.flatMap((word) => normalizeWord(word.clean))
  const aligned = sameList(expand(want), expand(got))
    ? {
        words: want.map((w) => ({ text: w.display, typed: w.display, status: 'correct' })),
        extra: [],
        written: got.map((g) => ({ text: g.display, status: 'correct' })),
      }
    : alignWritten(want, got)
  const points = aligned.words.reduce((sum, word) => sum + WORD_POINTS[word.status], 0)
  return {
    ...aligned,
    score: Math.round((points / want.length) * 100),
    passed: got.length > 0 && aligned.extra.length === 0 && aligned.words.every((word) => isPassingStatus(word.status, mode)),
    close: aligned.words.some((word) => word.status === 'sound' || word.status === 'close'),
    answer: target,
  }
}

/**
 * ตรวจคำ/ประโยคที่เขียน (ฟังแล้วพิมพ์ / เติมคำ)
 * @param target    คำตอบที่ถูก
 * @param typed     สิ่งที่ผู้เรียนเขียน
 * @param mode      'sound' | 'exact'
 * @param acceptAlso คำตอบอื่นที่ถูกเหมือนกัน (เช่น Mom / Mum)
 * @returns { words: [{ text, typed, status }] (เรียงตามคำตอบ), written: [{ text, status }] (เรียงตามที่เขียน),
 *            extra: [คำเกิน], score, passed, close, answer, tips }
 */
export function compareSpelling(target, typed, { mode = 'exact', acceptAlso = [] } = {}) {
  let best = null
  for (const candidate of [target, ...acceptAlso]) {
    const result = scoreAgainst(candidate, typed, mode)
    if (!result) continue
    const better =
      !best ||
      (result.passed && !best.passed) ||
      (result.passed === best.passed && result.score - result.extra.length > best.score - best.extra.length)
    if (better) best = result
  }
  if (!best) return { words: [], extra: [], written: [], score: 0, passed: false, close: false, answer: target, tips: [] }
  return { ...best, tips: writingTips(best.answer, typed, best.words) }
}

/**
 * แบ่งประโยคตรงคำที่ให้เติม (แบบฝึกเติมคำ) — เครื่องหมายที่ติดคำนั้นอยู่ไปอยู่ข้างช่องว่าง
 *   splitBlank('They ate on the blanket.', 'blanket') → { before: 'They ate on the', after: '.', found: true }
 */
export function splitBlank(target, blank) {
  const words = String(target ?? '').split(/\s+/).filter(Boolean)
  const index = words.findIndex((word) => cleanWord(word) === cleanWord(blank))
  if (index < 0) return { before: String(target ?? ''), after: '', found: false }
  const [, lead, , trail] = words[index].match(/^([^A-Za-z0-9']*)(.*?)([^A-Za-z0-9']*)$/)
  const before = [...words.slice(0, index), lead].filter(Boolean).join(' ')
  const after = [trail, ...words.slice(index + 1)].filter(Boolean).join(' ')
  return { before, after: trail ? after : after && ` ${after}`, found: true }
}

// แบ่งประโยค: ตัดที่ . ! ? หรือขึ้นบรรทัดใหม่
export function splitSentences(text) {
  return String(text ?? '')
    .split(/[.!?]+|[\r\n]+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => writtenWords(sentence).length > 0)
}

// นับประโยคที่ยาวพอ (≥ 3 คำ)
export const countSentences = (text) =>
  splitSentences(text).filter((sentence) => writtenWords(sentence).length >= MIN_WORDS_PER_SENTENCE).length

// พิมพ์เป็นอักษรไทยอยู่ (ลืมเปลี่ยนแป้นพิมพ์)
export const hasThaiLetters = (text) => /[฀-๿]/.test(String(text ?? ''))

// ตัดเครื่องหมายหน้า/หลังคำ แต่คงตัวพิมพ์ใหญ่ไว้ ("Sam," → "Sam")
const bareWord = (display) => display.replace(/^[^A-Za-z0-9']+|[^A-Za-z0-9']+$/g, '')

// คำในประโยคตัวอย่าง + คำสำคัญ → Map(clean → คำที่แสดง) ใช้เสนอคำที่สะกดถูก
function knownWordsOf(models, requiredWords) {
  const known = new Map()
  const texts = [...models, ...requiredWords.flatMap((entry) => String(entry).split('/'))]
  for (const word of texts.flatMap(writtenWords)) {
    if (!known.has(word.clean)) known.set(word.clean, bareWord(word.display))
  }
  return known
}

/**
 * ตรวจงานเขียนอิสระ (เขียนประโยคบรรยายภาพ / เขียนเรื่องสั้น) — ไม่มี AI ตรวจไวยากรณ์ (สเปกส่วนที่ 3)
 *   ตรวจ: จำนวนประโยค (≥ 3 คำ), คำสำคัญ (utils/storyCheck.js — รับรูปอดีต/พหูพจน์), ตัวสะกด
 *   ตัวสะกด: เทียบเฉพาะกับคำในประโยคตัวอย่าง + คำสำคัญ (ไม่ต้องโหลดพจนานุกรมใหญ่)
 *     คำที่เขียนไม่ตรงคำไหน แต่ใกล้คำในตัวอย่าง → คำแนะนำ "ใกล้แล้ว: kite"
 *     คำ Dolch / รูปอดีต-พหูพจน์ของคำในตัวอย่าง = คำจริง ไม่ต้องแนะนำ
 *   ระดับ 'sound': คำที่สะกดตามเสียงนับเป็นคำสำคัญได้ / 'exact': ต้องสะกดถูก และต้องไม่มีคำที่ควรแก้
 * @param requireAll true = ต้องมีคำสำคัญครบทุกคำ (ประโยคบรรยายภาพ) / false = ≥ 60% (เรื่องสั้น — เหมือนเล่าเรื่องปากเปล่า)
 * @returns { sentences, minSentences, keywords: { words: [{ text, found }], found, needed }, hints: [{ typed, suggestion, status }],
 *            thai, passed }
 */
export function checkFreeWriting(
  text,
  { requiredWords = [], models = [], mode = 'exact', minSentences = 1, requireAll = false } = {},
) {
  const known = knownWordsOf(models, requiredWords)
  const knownStems = new Set([...known.keys()].map(stem))
  const hints = []
  const corrected = writtenWords(text).map(({ display, clean }) => {
    if (known.has(clean) || COMMON_WORDS.has(clean) || knownStems.has(stem(clean))) return clean
    let best = null
    for (const word of known.keys()) {
      const status = spellingStatus(word, clean)
      if (status === 'sound' || status === 'close') {
        best = { word, status }
        if (status === 'sound') break
      }
    }
    if (!best) return clean
    if (!hints.some((hint) => cleanWord(hint.typed) === clean)) {
      hints.push({ typed: bareWord(display), suggestion: known.get(best.word), status: best.status })
    }
    return mode === 'sound' ? best.word : clean
  })

  const keywords = checkKeywords(requiredWords, corrected.join(' '))
  const keywordsOk = requiredWords.length === 0 || (requireAll ? keywords.found === requiredWords.length : keywords.passed)
  const needed = requireAll ? requiredWords.length : keywords.needed
  const sentences = countSentences(text)
  const spellingOk = mode === 'sound' || hints.length === 0
  return {
    sentences,
    minSentences,
    keywords: { words: keywords.words, found: keywords.found, needed },
    hints,
    thai: hasThaiLetters(text),
    passed: sentences >= minSentences && keywordsOk && spellingOk,
  }
}
