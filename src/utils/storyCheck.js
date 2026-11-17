// =========================================================
// storyCheck.js — ตรวจ "เล่าเรื่องจากภาพ" ด้วยคำพูดของตัวเอง (Stage 5, ส่วนที่ 3)
//   สเปก: ตรวจว่ามีคำ/วลีสำคัญที่กำหนดไว้หรือไม่ — ไม่เทียบทั้งประโยค (ผู้เรียนเล่าแบบไหนก็ได้)
// requiredWords ของแต่ละภาพ (ใน lessons.json):
//   'kite'        คำเดียว
//   'puppy/dog'   คำไหนก็ได้ (/ = คำที่ใช้แทนกันได้) — ป้ายที่แสดงใช้คำแรก
//   'fell down'   วลี (ต้องพูดติดกัน)
// เทียบแบบผ่อนปรน (เน้นสื่อความหมาย ไม่ใช่ไวยากรณ์): รูปอดีต/พหูพจน์/-ing นับเป็นคำเดียวกัน
//   kick = kicks = kicked = kicking, fly = flies = flew, hold = held — และออกเสียงใกล้เคียงนับได้ (คำยาว ≥ 5 ตัว)
// ผ่าน = พูดคำสำคัญได้ ≥ 60% ของที่กำหนด (2 คำ → ต้องได้ 2, 3 คำ → 2, 4 คำ → 3)
// ผลมีรูปแบบเดียวกับ compareSpeech → แสดงด้วย SpeechResult ได้ (words = คำสำคัญ: พูดแล้ว/ยังไม่ได้พูด)
// (ฟังก์ชันล้วน ใส่ .js ใน import เผื่อสคริปต์ Node ใช้)
// =========================================================
import { normalizeWord, similarity } from './compareWords.js'
import { RECAST_OPENERS } from './recast.js'

export const KEYWORD_PASS_RATIO = 0.6

// กริยาอดีต/รูปพิเศษที่พบบ่อยในการเล่าเรื่อง → รูปปกติ
export const IRREGULAR = {
  went: 'go', gone: 'go', goes: 'go', ran: 'run', ate: 'eat', saw: 'see', seen: 'see', got: 'get', came: 'come',
  made: 'make', found: 'find', took: 'take', gave: 'give', said: 'say', sat: 'sit', slept: 'sleep',
  felt: 'feel', fell: 'fall', threw: 'throw', caught: 'catch', hid: 'hide', built: 'build', drank: 'drink',
  bought: 'buy', brought: 'bring', wore: 'wear', woke: 'wake', rode: 'ride', swam: 'swim', sang: 'sing',
  broke: 'break', flew: 'fly', flies: 'fly', grew: 'grow', knew: 'know', held: 'hold', lost: 'lose',
  met: 'meet', told: 'tell', thought: 'think', heard: 'hear', blew: 'blow', drew: 'draw', stood: 'stand',
  had: 'have', has: 'have', did: 'do', does: 'do', was: 'be', were: 'be', is: 'be', are: 'be', am: 'be',
  children: 'child', mice: 'mouse', feet: 'foot', teeth: 'tooth', men: 'man', women: 'woman',
}

/**
 * รากคำแบบง่าย — ใช้เทียบเท่านั้น (ไม่ใช่คำจริงเสมอ เช่น like → lik)
 * kicked/kicking/kicks → kick, liked/like → lik, puppies → puppy, hugged → hug, flew → fly
 */
export function stem(token) {
  let word = IRREGULAR[token] ?? token
  if (word.length > 4 && word.endsWith('ies')) word = `${word.slice(0, -3)}y`
  else if (word.length > 4 && word.endsWith('ing')) word = word.slice(0, -3)
  else if (word.length > 3 && word.endsWith('ed')) word = word.slice(0, -2)
  else if (word.length > 3 && /(s|x|z|ch|sh)es$/.test(word)) word = word.slice(0, -2)
  else if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) word = word.slice(0, -1)
  word = word.replace(/([b-df-hj-np-tv-z])\1$/, '$1') // hugg → hug, runn → run
  if (word.length > 3) word = word.replace(/e$/, '') // like/liked → lik, kite/kites → kit
  return word
}

// ข้อความ → รากคำทีละคำ (รูปย่อขยายก่อน เช่น it's → it is)
const stemsOf = (text) =>
  String(text ?? '')
    .split(/\s+/)
    .flatMap(normalizeWord)
    .map(stem)

// คำสำคัญ 1 รายการ → ทางเลือก (แต่ละทางเลือกเป็นรากคำเรียงกัน)
export const parseKeyword = (entry) =>
  String(entry ?? '')
    .split('/')
    .map(stemsOf)
    .filter((stems) => stems.length > 0)

// ป้ายที่แสดง = คำแรกก่อน /
export const keywordLabel = (entry) => String(entry ?? '').split('/')[0].trim()

// รากคำที่ได้ยินตรงกับรากคำที่ต้องการไหม (คำยาวยอมให้ออกเสียงใกล้เคียง)
const matches = (heard, wanted) =>
  heard !== undefined && (heard === wanted || (wanted.length >= 5 && similarity(heard, wanted) >= 0.8))

const containsPhrase = (heard, phrase) =>
  heard.some((_, start) => phrase.every((wanted, offset) => matches(heard[start + offset], wanted)))

/**
 * ตรวจคำสำคัญจากคำพูด 1 แบบ
 * @returns { words: [{ text, found }], found, needed, score: 0–100, passed }
 */
export function checkKeywords(requiredWords, transcript) {
  const list = requiredWords ?? []
  const heard = stemsOf(transcript)
  const words = list.map((entry) => ({
    text: keywordLabel(entry),
    found: parseKeyword(entry).some((phrase) => containsPhrase(heard, phrase)),
  }))
  const found = words.filter((word) => word.found).length
  const needed = list.length ? Math.max(1, Math.ceil(list.length * KEYWORD_PASS_RATIO)) : 0
  return {
    words,
    found,
    needed,
    score: list.length ? Math.round((found / list.length) * 100) : 0,
    passed: list.length > 0 && found >= needed,
  }
}

/**
 * ตรวจจากทุกแบบที่ระบบอาจได้ยิน แล้วเลือกแบบที่ได้คำสำคัญมากที่สุด
 * ยังไม่ผ่าน → ทวนกลับแบบพ่อแม่ ("Listen." + ประโยคที่เจ้าของภาษาเล่า) เหมือนบทอื่น (ส่วนที่ 2.4)
 * @param model   ประโยคเล่าเรื่องของภาพนั้น (ใช้ทวนกลับ)
 * @param attempt ครั้งที่ลอง (เริ่ม 0) — เลือกคำขึ้นต้นหมุนเวียน
 * @returns รูปแบบเดียวกับ compareSpeech: { score, passed, words: [{ text, status }], heard, recast }
 */
export function compareKeywords(requiredWords, alternatives, { model = '', attempt = 0 } = {}) {
  const transcripts = (alternatives ?? [])
    .map((alt) => (typeof alt === 'string' ? alt : alt?.transcript))
    .filter((text) => typeof text === 'string' && text.trim())

  let best = { ...checkKeywords(requiredWords, ''), heard: transcripts[0]?.trim() ?? '' }
  for (const transcript of transcripts) {
    const result = checkKeywords(requiredWords, transcript)
    if (result.found > best.found) best = { ...result, heard: transcript.trim() }
  }

  const openers = RECAST_OPENERS.model
  const opener = openers[Math.abs(attempt) % openers.length]
  return {
    score: best.score,
    passed: best.passed,
    words: best.words.map((word) => ({ text: word.text, status: word.found ? 'correct' : 'missed' })),
    heard: best.heard,
    recast: best.passed || !model ? null : { kind: 'model', opener, correct: model, lines: [opener, model] },
  }
}
