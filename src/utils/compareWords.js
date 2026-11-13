// =========================================================
// compareWords.js — เทียบ "สิ่งที่ระบบได้ยิน" กับ "คำ/ประโยคเป้าหมาย" แล้วให้คะแนนรายคำ
// (ฟังก์ชันล้วน ไม่แตะเบราว์เซอร์ → ทดสอบได้)
//
// แนวคิด:
//   1) ทำข้อความให้อยู่รูปเดียวกันก่อนเทียบ: ตัวเล็ก, ตัดเครื่องหมาย, รูปย่อ = รูปเต็ม
//      (I'm = I am, gonna = going to), ตัวเลข = คำ (2 = two)
//   2) จับคู่คำเป้าหมายกับคำที่ได้ยินแบบ DP (เหมือนเทียบข้อความว่าต่างกันตรงไหน)
//      - ตรงกัน = correct, ออกเสียงใกล้เคียง = close, ไม่มี/ผิด = missed
//      - คำเกินที่พูดเพิ่ม (um, like, please) ไม่หักคะแนน
//   3) ระบบรับเสียงส่งคำที่อาจได้ยินมาหลายแบบ → เลือกแบบที่ได้คะแนนดีที่สุด
//   4) โหมดผ่อนปรน (Stage 2–3): คำใกล้เคียงได้คะแนนมากขึ้น + ยอมรับคำใน acceptAlso
// =========================================================

// เกณฑ์ผ่าน (ตามแผน): ผ่อนปรน 60%, ปกติ 70%
export const PASS_SCORE = { lenient: 60, normal: 70 }

// รูปย่อ / คำพูดแบบเจ้าของภาษา → รูปเต็ม (ใช้ทั้งฝั่งเป้าหมายและฝั่งที่ได้ยิน)
const EXPANSIONS = {
  "i'm": ['i', 'am'],
  "you're": ['you', 'are'],
  "we're": ['we', 'are'],
  "they're": ['they', 'are'],
  "he's": ['he', 'is'],
  "she's": ['she', 'is'],
  "it's": ['it', 'is'],
  "that's": ['that', 'is'],
  "what's": ['what', 'is'],
  "where's": ['where', 'is'],
  "who's": ['who', 'is'],
  "there's": ['there', 'is'],
  "here's": ['here', 'is'],
  "how's": ['how', 'is'],
  "let's": ['let', 'us'],
  "don't": ['do', 'not'],
  "doesn't": ['does', 'not'],
  "didn't": ['did', 'not'],
  "can't": ['can', 'not'],
  cannot: ['can', 'not'],
  "won't": ['will', 'not'],
  "isn't": ['is', 'not'],
  "aren't": ['are', 'not'],
  "wasn't": ['was', 'not'],
  "weren't": ['were', 'not'],
  "haven't": ['have', 'not'],
  "hasn't": ['has', 'not'],
  "couldn't": ['could', 'not'],
  "shouldn't": ['should', 'not'],
  "wouldn't": ['would', 'not'],
  "i'll": ['i', 'will'],
  "you'll": ['you', 'will'],
  "we'll": ['we', 'will'],
  "it'll": ['it', 'will'],
  "i've": ['i', 'have'],
  "you've": ['you', 'have'],
  "we've": ['we', 'have'],
  "i'd": ['i', 'would'],
  "you'd": ['you', 'would'],
  gonna: ['going', 'to'],
  wanna: ['want', 'to'],
  gotta: ['got', 'to'],
  gimme: ['give', 'me'],
  lemme: ['let', 'me'],
  kinda: ['kind', 'of'],
  ok: ['okay'],
}

// ตัวเลขที่ระบบรับเสียงชอบเขียนเป็นตัวเลข → คำ
const NUMBER_WORDS = {
  0: 'zero', 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine',
  10: 'ten', 11: 'eleven', 12: 'twelve', 13: 'thirteen', 14: 'fourteen', 15: 'fifteen', 16: 'sixteen',
  17: 'seventeen', 18: 'eighteen', 19: 'nineteen', 20: 'twenty', 30: 'thirty', 40: 'forty', 50: 'fifty',
  60: 'sixty', 70: 'seventy', 80: 'eighty', 90: 'ninety', 100: 'hundred',
}

// 1 คำ (ตามที่เขียน) → คำย่อย ๆ ที่ใช้เทียบ เช่น "Don't," → ['do', 'not'], "bye-bye" → ['bye', 'bye']
export function normalizeWord(word) {
  const cleaned = String(word ?? '')
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, '')
    .replace(/^'+|'+$/g, '')
  if (!cleaned) return []
  return cleaned.split(/-+/).flatMap((part) => {
    const piece = part.replace(/[^a-z0-9']/g, '')
    if (!piece) return []
    if (EXPANSIONS[piece]) return EXPANSIONS[piece]
    if (/^\d+$/.test(piece) && NUMBER_WORDS[Number(piece)]) return [NUMBER_WORDS[Number(piece)]]
    return [piece]
  })
}

// ประโยค → [{ display: คำตามที่เขียน, tokens: คำที่ใช้เทียบ }] (ตัดคำที่เป็นเครื่องหมายล้วนทิ้ง)
export function tokenize(text) {
  return String(text ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .map((display) => ({ display, tokens: normalizeWord(display) }))
    .filter((unit) => unit.tokens.length > 0)
}

// ระยะห่างแบบ Levenshtein (ต้องแก้กี่ตัวอักษรถึงจะเหมือนกัน)
export function levenshtein(a, b) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i]
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost)
    }
    previous = current
  }
  return previous[b.length]
}

// ความคล้ายของ 2 คำ (0 ไม่เหมือนเลย – 1 เหมือนกันทุกตัว)
export function similarity(a, b) {
  if (a === b) return 1
  const longest = Math.max(a.length, b.length)
  return longest === 0 ? 1 : 1 - levenshtein(a, b) / longest
}

// จับคู่คำเป้าหมายกับคำที่ได้ยิน → สถานะของคำเป้าหมายแต่ละคำ
function alignTokens(target, heard, closeThreshold) {
  const n = target.length
  const m = heard.length
  const MISS = 1 // คำเป้าหมายที่ไม่ได้พูด
  const EXTRA = 0.25 // คำที่พูดเกิน (ใช้แค่ช่วยจับคู่ ไม่หักคะแนน)
  const subCost = (a, b) => {
    if (a === b) return 0
    return similarity(a, b) >= closeThreshold ? 0.4 : 1.2
  }

  // dp[i][j] = ต้นทุนต่ำสุดเมื่อจับคู่ target[0..i) กับ heard[0..j)
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = 1; i <= n; i += 1) dp[i][0] = i * MISS
  for (let j = 1; j <= m; j += 1) dp[0][j] = j * EXTRA
  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      dp[i][j] = Math.min(
        dp[i - 1][j - 1] + subCost(target[i - 1], heard[j - 1]),
        dp[i - 1][j] + MISS,
        dp[i][j - 1] + EXTRA,
      )
    }
  }

  // ย้อนรอยหาว่าแต่ละคำเป้าหมายจับคู่กับอะไร
  const statuses = new Array(n).fill('missed')
  let i = n
  let j = m
  while (i > 0 && j > 0) {
    const sub = subCost(target[i - 1], heard[j - 1])
    if (dp[i][j] === dp[i - 1][j - 1] + sub) {
      statuses[i - 1] = sub === 0 ? 'correct' : sub < 1 ? 'close' : 'missed'
      i -= 1
      j -= 1
    } else if (dp[i][j] === dp[i - 1][j] + MISS) {
      statuses[i - 1] = 'missed'
      i -= 1
    } else {
      j -= 1
    }
  }
  return statuses
}

// สถานะของคำย่อย ๆ → สถานะของคำตามที่เขียน (เช่น "don't" = do + not)
function combineStatuses(statuses) {
  if (statuses.every((s) => s === 'correct')) return 'correct'
  if (statuses.every((s) => s === 'missed')) return 'missed'
  return 'close'
}

const sameTokens = (a, b) => a.length === b.length && a.every((token, index) => token === b[index])

// tokens ของ a อยู่ต่อเนื่องกันใน b หรือไม่ (เช่น "yes more milk please" มี "more milk")
const containsTokens = (haystack, needle) =>
  needle.length > 0 &&
  haystack.some((_, start) => needle.every((token, offset) => haystack[start + offset] === token))

/**
 * ให้คะแนนคำพูด 1 แบบ เทียบกับเป้าหมาย
 * @returns { score: 0–100, words: [{ text, status }] }
 */
export function scoreTranscript(target, transcript, { lenient = false, acceptAlso = [] } = {}) {
  const units = tokenize(target)
  const targetTokens = units.flatMap((unit) => unit.tokens)
  const heardTokens = tokenize(transcript).flatMap((unit) => unit.tokens)
  const allCorrect = () => ({
    score: 100,
    words: units.map((unit) => ({ text: unit.display, status: 'correct' })),
  })

  if (targetTokens.length === 0) return { score: 0, words: [] }
  if (heardTokens.length === 0) {
    return { score: 0, words: units.map((unit) => ({ text: unit.display, status: 'missed' })) }
  }

  // ตรงเป้าหมายทุกคำ หรือเป็นคำที่ยอมรับเพิ่ม (acceptAlso)
  const accepted = acceptAlso.map((text) => tokenize(text).flatMap((unit) => unit.tokens))
  if (sameTokens(heardTokens, targetTokens) || accepted.some((tokens) => sameTokens(heardTokens, tokens))) {
    return allCorrect()
  }
  // ผ่อนปรน: พูดคำเป้าหมาย/คำที่ยอมรับ อยู่ในประโยคที่ยาวกว่า ก็นับว่าถูก
  if (lenient && [targetTokens, ...accepted].some((tokens) => containsTokens(heardTokens, tokens))) {
    return allCorrect()
  }

  const closeThreshold = lenient ? 0.5 : 0.67
  const closeWeight = lenient ? 0.8 : 0.5
  const statuses = alignTokens(targetTokens, heardTokens, closeThreshold)
  const points = statuses.reduce((sum, s) => sum + (s === 'correct' ? 1 : s === 'close' ? closeWeight : 0), 0)

  let cursor = 0
  const words = units.map((unit) => {
    const unitStatuses = statuses.slice(cursor, cursor + unit.tokens.length)
    cursor += unit.tokens.length
    return { text: unit.display, status: combineStatuses(unitStatuses) }
  })

  return { score: Math.round((points / targetTokens.length) * 100), words }
}

/**
 * ให้คะแนนจากทุกแบบที่ระบบอาจได้ยิน แล้วเลือกแบบที่ดีที่สุด
 * @param alternatives array ของข้อความ หรือ [{ transcript }]
 * @returns { score, passed, words, heard }
 */
export function compareSpeech(target, alternatives, { lenient = false, acceptAlso = [] } = {}) {
  const transcripts = (alternatives ?? [])
    .map((alt) => (typeof alt === 'string' ? alt : alt?.transcript))
    .filter((text) => typeof text === 'string' && text.trim())

  let best = { ...scoreTranscript(target, '', { lenient, acceptAlso }), heard: '' }
  for (const transcript of transcripts) {
    const result = scoreTranscript(target, transcript, { lenient, acceptAlso })
    if (result.score > best.score) best = { ...result, heard: transcript.trim() }
  }
  if (!best.heard && transcripts.length) best.heard = transcripts[0].trim()

  const passScore = lenient ? PASS_SCORE.lenient : PASS_SCORE.normal
  return { ...best, passed: best.score >= passScore }
}
