// =========================================================
// WriteStep — ขั้น "เขียน" ของ Stage 7: เลือกแบบฝึกตาม item.exercise (เรียงจากง่ายไปยากในบท — สเปกส่วนที่ 3)
//   dictation ฟังแล้วพิมพ์ → fill เติมคำ → order เรียงคำ → describe เขียนประโยคบรรยายภาพ → story เขียนเรื่องสั้น
//   mode = ระดับการตรวจตัวสะกดของบท (lesson.spelling): 'sound' ยอมรับสะกดตามเสียง / 'exact' ต้องสะกดตรง
// ใช้ทั้งในบทเรียน (LessonPlayer) และตอนทบทวน (ReviewPlayer) — key ตาม id ข้อ เพื่อเริ่มใหม่ทุกข้อ
// props: item, stage, mode, onDone({ passed })
// =========================================================
import DictationStep from './DictationStep'
import FillBlankStep from './FillBlankStep'
import WordOrderStep from './WordOrderStep'
import DescribePictureStep from './DescribePictureStep'
import WriteStoryStep from './WriteStoryStep'

const EXERCISES = {
  dictation: DictationStep,
  fill: FillBlankStep,
  order: WordOrderStep,
  describe: DescribePictureStep,
  story: WriteStoryStep,
}

export default function WriteStep({ item, stage, mode = 'exact', onDone }) {
  const Exercise = EXERCISES[item.exercise] ?? DictationStep
  return <Exercise key={item.id} item={item} stage={stage} mode={mode} onDone={onDone} />
}
