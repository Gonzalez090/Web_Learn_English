// ตรวจการแบ่งข้อมูลบทเรียนเป็นก้อน (สารบัญ + เนื้อหาราย Stage) และของที่หน้าเว็บได้รับจริง
import { describe, it, expect } from 'vitest'
import lessonsData from './lessons.json'
import { indexModuleCode, lessonMeta, lessonsOfStage, stageIdsWithLessons, stageModuleCode } from './lessonChunks'
import { getLessonMeta, getLessonsByStage, lessonList, loadAllLessons, loadStageLessons, stages } from './index.js'

describe('lessonChunks (ฟังก์ชันแบ่งก้อน)', () => {
  it('บทแบบย่อมีข้อมูลพอแสดงรายการ แต่ไม่มี items', () => {
    const lesson = lessonsData.lessons[0]
    const meta = lessonMeta(lesson)
    expect(meta).toEqual({
      id: lesson.id,
      stageId: lesson.stageId,
      category: lesson.category,
      type: lesson.type,
      title: lesson.title,
      titleTh: lesson.titleTh,
      itemCount: lesson.items.length,
      image: lesson.items[0].image,
    })
    expect(meta.items).toBeUndefined()
  })

  it('ทุกบทอยู่ในก้อนของ Stage ตัวเองเพียงก้อนเดียว', () => {
    const chunks = stageIdsWithLessons(lessonsData.lessons).flatMap((stageId) => lessonsOfStage(lessonsData.lessons, stageId))
    expect(chunks.map((lesson) => lesson.id).sort()).toEqual(lessonsData.lessons.map((lesson) => lesson.id).sort())
  })

  it('สร้างโค้ดโมดูลที่มีตัวโหลดเฉพาะ Stage ที่มีบทเรียน', () => {
    const code = indexModuleCode(lessonsData)
    for (const stageId of stageIdsWithLessons(lessonsData.lessons)) {
      expect(code).toContain(`import("virtual:lessons/stage-${stageId}")`)
    }
    expect(code).not.toContain('"items"')
    expect(stageModuleCode(lessonsData, 1)).toMatch(/^export default \[/)
  })
})

describe('data/index.js (ผ่านโมดูลเสมือนของ Vite)', () => {
  it('สารบัญตรงกับ lessons.json', () => {
    expect(stages).toEqual(lessonsData.stages)
    expect(lessonList).toEqual(lessonsData.lessons.map(lessonMeta))
    expect(getLessonMeta(lessonsData.lessons[0].id)?.id).toBe(lessonsData.lessons[0].id)
    expect(getLessonMeta('ไม่มีบทนี้')).toBeNull()
    expect(getLessonsByStage('1').every((lesson) => lesson.stageId === 1)).toBe(true)
  })

  it('โหลดเนื้อหาเต็มราย Stage ได้ (promise เดิมทุกครั้ง → ใช้กับ React use() ได้)', async () => {
    expect(loadStageLessons(4)).toBe(loadStageLessons('4'))
    const stage4 = await loadStageLessons(4)
    expect(stage4).toEqual(lessonsOfStage(lessonsData.lessons, 4))
    expect(await loadStageLessons(99)).toEqual([])
    expect(await loadAllLessons()).toHaveLength(lessonsData.lessons.length)
  })
})
