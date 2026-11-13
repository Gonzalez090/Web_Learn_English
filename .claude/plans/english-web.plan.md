# Plan: เว็บสอนภาษาอังกฤษแบบเจ้าของภาษา สำหรับคนไทย (English Town)

**Source spec**: [english-web.spec.md](english-web.spec.md)
**Approved**: 2026-11-13 (ผู้ใช้ตอบ "ok" = ใช้ค่าแนะนำทั้งหมด)
**Complexity**: Large — 21 ขั้น

## กติกาการทำงาน

- ทำทีละขั้น **หยุดให้ผู้ใช้ทดสอบก่อนไปขั้นถัดไปทุกครั้ง**
- จบแต่ละขั้นสรุปสั้น ๆ: ทำอะไร / ไฟล์ไหนเปลี่ยน / ต้องทดสอบอะไร
- commit หลังผู้ใช้ทดสอบผ่านแต่ละขั้น (ผู้ใช้สั่ง)
- คอมเมนต์ในโค้ดเป็นภาษาไทย, component เล็ก ใช้ซ้ำได้, CSS Modules คู่กับ component

## สถานะ

| ขั้น | งาน | สถานะ |
|---|---|---|
| 1 | Vite + React, router, zustand, i18n, โครงโฟลเดอร์, TH/EN, ข้อมูล Stage 1–4, หน้าเปล่าทุกหน้า | ✅ ทำแล้ว + Claude ทดสอบผ่าน — รอผู้ใช้ทดสอบ |
| 2 | useSpeech (ปกติ/ช้า) + VocabCard + สวิตช์คำอ่าน/คำแปล | ⬜ |
| 3 | useRecognition + MicButton + compareWords (คะแนนรายคำ) | ⬜ |
| 4 | LessonPlayer (รองรับขั้น "เกม") + Stage 1–3 + ปลดล็อก Stage + เก็บ XP/ข้อที่พลาด + 🎮 **Listen & Tap** ในบท | ⬜ |
| 5 | Stage 4 + Recast + 🎮 **Shadow Karaoke** ในบท | ⬜ |
| 6 | ContextSentence + สลับคำ + connected speech/stress/intonation + 🎮 **Word Swap Race** ในบท | ⬜ |
| 7 | Stage 5: DialoguePlayer + PictureStory + เพลงคล้องจอง | ⬜ |
| 8 | Stage 6: phonics + sight words + ReadAlong + 🎮 **Minimal Pair Duel** ในบท | ⬜ |
| 9 | Stage 7: แบบฝึกเขียน 5 แบบ + spellCheck | ⬜ |
| 10 | คลังวลี 6×8 + textbookVsReal 15 คู่ + 🎮 **Real or Textbook?** (ในบท Stage 5+ และคลังวลี) | ⬜ |
| 11 | บทสนทนาสุ่ม (variants + slots) 5 scenarios | ⬜ |
| 12 | twists + ระดับยาก + 🎮 **Speed Order** (บทสนทนาสุ่มแบบจับเวลา) | ⬜ |
| 13 | XP/เลเวล/Streak/ภารกิจรายวัน 15 แบบ | ⬜ |
| 14 | แผนที่เมือง 7 สถานที่ + ปลดล็อก | ⬜ |
| 15 | NPC 4 ตัว + ความสนิท + "Long time no see!" | ⬜ |
| 16 | Spaced Repetition + ปุ่มทบทวนวันนี้ | ⬜ |
| 17 | หน้ามินิเกมเล่นแยก (เล่นซ้ำ / ภารกิจ "เล่นมินิเกม 1 เกม" / แผนรายวัน) ใช้ตัวเกมที่สร้างไว้แล้วในขั้น 4–12 + ปรับความยาก | ⬜ |
| 18 | แผนรายวัน + นาทีที่พูด + กราฟ SVG | ⬜ |
| 19 | Speaking Check (MediaRecorder + IndexedDB + สถิติ) | ⬜ |
| 20 | Collection + ตกแต่งห้อง + เอฟเฟกต์ (Web Audio) | ⬜ |
| 21 | โหมดฝึกเสียง th, r/l, v/w + หน้าตั้งค่าเต็ม | ⬜ |

## การตัดสินใจที่อนุมัติแล้ว

1. ~~ภาพ placeholder = emoji~~ → **เปลี่ยนแล้ว (ผู้ใช้ขอ 2026-11-13): ภาพประกอบเนื้อหาทุกอันเป็นภาพถ่ายสมจริงจาก Pixabay ห้ามใช้ emoji** (Pexels ปิดการออก API key ใหม่ จึงเปลี่ยนเป็น Pixabay)
   - ไฟล์ `public/images/<id>.webp` (640×640) ชื่อไฟล์ = id ของข้อ/Stage; component `Picture` (ไม่มีภาพ → กรอบว่าง + ไอคอน ImageOff)
   - ดึงภาพด้วย `scripts/fetch-images.mjs` (ต้องมี `PIXABAY_API_KEY` ใน `.env.local`): `search` ทำแผ่นรวมภาพ 9 ตัวเลือก → Claude ดูด้วยตาแล้วเลือก → `pick` ย่อเป็น WebP + บันทึกเครดิตใน `src/data/imageCredits.json`
   - คำค้นอยู่ที่ `scripts/image-queries.json` — เพิ่มเนื้อหาใหม่ต้องเพิ่มคำค้น + ดึงภาพทุกครั้ง
   - Pixabay: ให้ดาวน์โหลดมาเก็บเอง (ห้ามโหลดจากเซิร์ฟเวอร์เขาถาวร), ไม่บังคับให้เครดิต แต่ทำหน้าเครดิตภาพ ("ภาพจาก Pixabay" + ชื่อช่างภาพ) เพื่อความถูกต้อง
   - Stage 1–3 ต้องเลือกภาพที่ **ไม่มีตัวหนังสือภาษาอังกฤษในภาพ**
   - ไอคอนเล็กบน UI (เมนู ปุ่ม สถานะ) = ไอคอนเส้น `lucide-react` ผ่าน `src/utils/icons.js`
2. **ข้อมูลแยกไฟล์** ใน `src/data/`: lessons, phrases, scenarios, world (เมือง+NPC), game (ภารกิจ/มินิเกม/milestones/ฝึกเสียง) + `index.js` รวม — schema ตามส่วนที่ 12
3. **Vitest** เฉพาะ logic ใน `utils/` + ตรวจไฟล์ข้อมูลและไฟล์ภาษา (ไม่ทำ UI test)
4. **กัน hardcode ข้อความ UI** ด้วย `eslint-plugin-i18next` ผ่าน oxlint `jsPlugins` (`npm run lint`)
5. **git** init แล้ว, commit หลังผู้ใช้ทดสอบผ่านแต่ละขั้น
6. ปรับลำดับเล็กน้อย: store 3 ก้อนตั้งแต่ขั้น 1, สวิตช์คำอ่าน/คำแปลขั้น 2, XP + ข้อที่พลาดเริ่มเก็บขั้น 4, ขั้น 17 แยกทีละเกม
7. **หน้า `/dev`** เฉพาะ `npm run dev` (lazy + ตัดทิ้งตอน build)
8. ร้านอาหาร/ออฟฟิศ: ยังไม่มีบทสนทนาสุ่ม (สเปกกำหนด 5 scenarios) — มีแค่คลังวลี
9. แผน + สเปกเก็บไว้ที่ `.claude/plans/`
10. **มินิเกมแทรกในบทเรียน** (ผู้ใช้ขอ 2026-11-13): เกมเป็นขั้นหนึ่งในลำดับของ LessonPlayer เล่นด้วยคำ/ประโยคของบทนั้นเอง (รอบสั้น 30–60 วินาที) แต่ละเกมสร้างพร้อมบทที่ใช้มันครั้งแรก (ดูตารางสถานะ) และเขียนเป็น component ใน `src/components/games/` ที่รับข้อมูลผ่าน props → ใช้ได้ทั้งในบทเรียนและหน้ามินิเกมเล่นแยก (ขั้น 17)
11. **Claude ทดสอบเองทุกขั้น** ใน Chrome ก่อนส่งให้ผู้ใช้ แล้วรายงานบั๊ก + สิ่งที่ควรปรับ — ผู้ใช้ให้ "ปรับไปเลย" กับข้อที่ควรปรับ
12. **ฟอนต์ไทยแบบมีหัว** Noto Sans Thai Looped (อ่านคำอ่านไทยง่ายกว่าแบบไม่มีหัว) + Nunito สำหรับอังกฤษ
13. Stage ที่ล็อก: ภาพยังเป็นสีจริง (จางลงเล็กน้อย) + ไอคอนกุญแจทับมุมภาพ — ไม่ทำภาพขาวดำ
14. ในบทเดียวกันห้ามมีภาพแนวเดียวกันจนแยกไม่ออก (เช่น โบกมือ 2 ภาพ) เพราะเกม Listen & Tap ต้องแยกภาพได้

## สถาปัตยกรรม

- **Routes**: `/`, `/learn`, `/learn/:stageId`, `/lesson/:lessonId`, `/lesson/:lessonId/summary`, `/place/:placeId`, `/talk/:scenarioId`, `/phrases`, `/phrases/real-vs-textbook`, `/review`, `/plan`, `/games`, `/games/:gameId`, `/sounds`, `/profile`, `/profile/speaking-check`, `/settings`, `/dev` (DEV), `*`
- **Layout**: TopBar (ชื่อ + 🔥 streak + ⭐ XP + TH|EN) + BottomNav 4 แท็บ (หน้าแรก/เรียน/มินิเกม/โปรไฟล์)
- **Stores** (zustand persist, มี `version` + `migrate`):
  - `et-settings`: uiLanguage, thaiReading (`auto|on|off`), thaiTranslation (`hidden|shown`), speechRate, voiceURI, dailyGoal, soundEffects
  - `et-progress`: xp (เลเวลคำนวณจาก xp), streak, streakFreeze, unlockedStages, unlockedPlaces, lessonProgress, collection, npcFriendship, dailyMissions, speakingMinutes, lastVisitDate
  - `et-review`: reviewQueue
- **ภาษา UI**: settingsStore เป็นแหล่งเดียว → sync ไป i18n + `<html lang>`; หัวข้อจากไฟล์ข้อมูลใช้ `useLocalized()` (field / fieldTh)
- **LessonPlayer** (ขั้น 4): ลำดับขั้นต่อประเภทบทเรียนอยู่ใน `utils/lessonSteps.js`, แต่ละขั้นเป็น component ใน `components/lesson-steps/`; มีขั้นประเภท `game` ที่เรียกเกมจาก `components/games/` โดยส่งข้อมูลของบทนั้นเข้าไป
- **เสียง**: `useSpeech` (รอ voiceschanged, ตัดประโยคยาว, timeout กัน onend ไม่ยิง), `useRecognition` (maxAlternatives 5, เลือกอันคะแนนดีสุด, ไม่รองรับ → แนะนำ Chrome/Edge), `compareWords` (normalize ตัวเลข/รูปย่อ/gonna, จัดตำแหน่งคำ DP, ถูก/ใกล้/พลาด, โหมดผ่อนปรน + `acceptAlso`)

## ค่าเริ่มต้นที่ตกลงไว้

- **เกณฑ์ผ่าน**: Stage 2–3 ความคล้าย ≥ 60% หรือตรง `acceptAlso`; Stage 4+ คะแนนรายคำ ≥ 70%; พูดได้ไม่จำกัด, หลัง 3 ครั้งมีปุ่ม "ไปต่อ" และข้อนั้นเข้ารายการทบทวน
- **จบบท** = ทำครบทุกข้อ; **จบ Stage** = จบทุกบท → ปลดล็อก Stage ถัดไป + สถานที่
- **XP ถึงเลเวล L** = 50·L·(L−1); ฉายา Lv1–4 Newcomer, 5–9 Local, 10–19 Smooth Talker, 20+ Native-ish
- **XP**: ฟัง 5, พูดตาม 15, พูดเองไม่ดูข้อความ 25
- **Spaced repetition**: พลาด → 1 วัน → ถูก 3 → 7 → 14 → จำได้แล้ว; พลาดกลับไป 1 วัน
- **Streak Freeze**: 1 ครั้ง/สัปดาห์ รีเซ็ตทุกวันจันทร์
- **หายไป ≥ 3 วัน** → NPC ทัก "Hey! Long time no see!" + บททบทวนสั้น

| สถานที่ | ปลดล็อกเมื่อ | บทสนทนาสุ่ม | NPC |
|---|---|---|---|
| บ้าน | เริ่มต้น | ถามทาง | ป้าโรส ข้างบ้าน (ช้า สุภาพ) |
| ร้านสะดวกซื้อ | ผ่าน Stage 1 | ร้านสะดวกซื้อ | Jake (สบาย ๆ) |
| ร้านกาแฟ | ผ่าน Stage 2 | ร้านกาแฟ | Mia บาริสต้า (เร็ว สแลง) |
| สวนสาธารณะ | ผ่าน Stage 3 | เจอเพื่อนเก่า | Sam (เป็นกันเอง) |
| ร้านอาหาร | ผ่าน Stage 4 | — (คลังวลีสั่งอาหาร) | — |
| ออฟฟิศ | ผ่าน Stage 5 | — (คลังวลีที่ทำงาน) | — |
| สนามบิน | ผ่าน Stage 6 | เช็คอินโรงแรม | พนักงานต้อนรับ |

## ความเสี่ยงที่ต้องระวัง

- **HIGH** ไมค์บนมือถือผ่าน IP วง LAN ต้องเป็น https → `npm run dev:phone` (plugin-basic-ssl)
- **HIGH** SpeechRecognition ไม่ตรวจการออกเสียง แค่เดาข้อความโดยใช้บริบท → คะแนนรายคำ = ความตรงของคำ; minimal pairs ทำเป็น "ฟังแล้วเลือก"
- **HIGH** คำเดี่ยวสั้น ๆ (no, up, mama) มักถูกได้ยินเป็นคำอื่น → `acceptAlso` + fuzzy + ปุ่มไปต่อ
- **HIGH** TTS ออกเสียงหน่วยเสียงเดี่ยว (/k/) ไม่ได้ → คำสะกดเลียนเสียง + "c says /k/, as in cat" + รองรับ mp3 ใน `public/audio/phonics/`
- **MED** เสียง Google ใน Chrome ไม่ส่ง boundary event → ไฮไลต์คำใช้การประมาณเวลา
- **MED** Chrome ตัดเสียงอ่านยาว ~15 วินาที → อ่านทีละประโยค
- **MED** iOS Safari รับเสียงไม่เสถียร → เป้าหลัก Chrome Android / Chrome-Edge เดสก์ท็อป
- **MED** SpeechRecognition ต้องใช้อินเทอร์เน็ต; continuous หยุดเองเมื่อเงียบ → auto-restart
- **MED** อัด + ถอดเสียงพร้อมกัน บาง Android แย่งไมค์ → fallback อัดอย่างเดียว
- **MED** ตรวจงานเขียนอิสระไม่มี AI → ตรวจสะกด/คำสำคัญ/จำนวนประโยค แล้วให้เทียบตัวอย่างเอง
- **MED** คำอ่าน/คำแปลไทยเขียนเอง → ควรมีคนไทยรีวิว
- **MED** ภาพเล่าเรื่อง 3–4 ภาพ (ขั้น 7) + NPC 4 ตัว (ขั้น 15) ต้องเป็นคนหน้าเดิมต่อเนื่อง → ค้นภาพชุดเดียวกันของช่างภาพคนเดียวใน Pexels (ถ่ายเซ็ตเดียวกัน); ถ้าหาไม่ได้ต้องคุยกับผู้ใช้เรื่องภาพ AI
- **LOW** HTML5 drag-and-drop ไม่ทำงานบนจอสัมผัส → pointer events + แตะเพื่อเรียง
- **LOW** "very/wery" ไม่ใช่คำจริง → ใช้คู่คำจริง vest/west, vine/wine

## Validation (ทุกขั้น)

```bash
npm run lint
npm test
npm run build
```
