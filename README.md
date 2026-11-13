# เมืองภาษาอังกฤษ (English Town)

เว็บเรียนภาษาอังกฤษแบบเจ้าของภาษา สำหรับคนไทย
เรียนตามลำดับที่เด็กเจ้าของภาษาเรียนจริง: **ฟัง → พูด → อ่าน → เขียน**
เน้นภาพ + เสียง + บริบทจริง และภาษาที่เจ้าของภาษาพูดจริงในชีวิตประจำวัน

## เริ่มใช้งาน

```bash
npm install
npm run dev
```

เปิด <http://localhost:5173> ด้วย **Chrome หรือ Edge** (ระบบรับเสียงพูดใช้ได้เฉพาะ 2 เบราว์เซอร์นี้)

## คำสั่ง

| คำสั่ง | ทำอะไร |
|---|---|
| `npm run dev` | เปิดเว็บสำหรับพัฒนาที่ localhost (ไมค์ใช้ได้) |
| `npm run dev:phone` | เปิดแบบ https ให้มือถือในวง Wi-Fi เดียวกันเข้าได้ที่ `https://<IP เครื่อง>:5173` — ครั้งแรกต้องกดยอมรับใบรับรอง |
| `npm run build` | build เว็บจริงไว้ที่ `dist/` |
| `npm run lint` | ตรวจโค้ด + ตรวจว่าไม่มีข้อความ UI เขียนตรง ๆ ใน JSX (ต้องผ่าน `t('key')`) |
| `npm test` | unit test: ข้อมูลบทเรียน, ไฟล์ภาษา th/en, ฟังก์ชันใน `utils/` |

## โครงสร้างโฟลเดอร์

```
src/
  main.jsx, App.jsx      จุดเริ่มต้น + เส้นทาง (routes)
  i18n.js                ตั้งค่าภาษาหน้าเว็บ TH/EN
  locales/               ข้อความ UI: th.json, en.json (key ต้องตรงกัน)
  pages/                 หน้าหลักแต่ละหน้า
  components/            component ที่ใช้ซ้ำ (+ .module.css คู่กัน)
    layout/              แถบบน, แถบเมนูล่าง
    games/               มินิเกม
  hooks/                 useSpeech, useRecognition, useRecorder, ...
  store/                 Zustand: settings, progress, review (บันทึกลง localStorage)
  utils/                 ฟังก์ชันคำนวณล้วน ๆ (มี test)
  data/                  เนื้อหาบทเรียน (lessons, phrases, scenarios, world, game)
  styles/global.css      ตัวแปรสี/ระยะ/ฟอนต์ + reset
public/images/           ภาพประกอบ (ถ้าไม่มีภาพ จะแสดง emoji แทน)
```

## กติกาของโปรเจกต์

- ข้อความ UI ทุกข้อความต้องอยู่ใน `src/locales/*.json` และเรียกผ่าน `t('key')` — `npm run lint` จะจับให้
- เนื้อหาบทเรียน (ประโยคอังกฤษ, คำแปลไทย, คำอ่านไทย) อยู่ใน `src/data/` และไม่เปลี่ยนตามภาษา UI
- Stage 1–3 ห้ามแสดงตัวอักษรภาษาอังกฤษ
- วันที่ใช้รูปแบบ `YYYY-MM-DD` ตามเวลาเครื่อง (ไม่ใช้ UTC)
- หน้า `/dev` มีเฉพาะตอน `npm run dev` ไว้ปลดล็อก/ล้างข้อมูลระหว่างทดสอบ

## แผนงาน

แผน 21 ขั้นอยู่ที่ [.claude/plans/english-web.plan.md](.claude/plans/english-web.plan.md)
สเปกเต็มอยู่ที่ [.claude/plans/english-web.spec.md](.claude/plans/english-web.spec.md)
