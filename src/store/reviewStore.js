// =========================================================
// reviewStore — ที่เก็บ "รายการทบทวน" (Spaced Repetition)
// บันทึกลง localStorage อัตโนมัติ (key: et-review)
// ข้อที่พลาดในบทเรียน → ครบกำหนดพรุ่งนี้ / ทบทวนแล้วเลื่อนรอบ 1 → 3 → 7 → 14 วัน (utils/review.js)
// =========================================================
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { addMissedToQueue, gradeReview } from '../utils/review'
import { todayKey } from '../utils/date'

export const useReviewStore = create(
  persist(
    (set) => ({
      // [{ id: 'lessonId:itemId', lessonId, itemId, box, dueDate: 'YYYY-MM-DD', addedAt }]
      reviewQueue: [],

      // เพิ่มข้อที่พลาดของบทหนึ่งเข้าคิว
      addMissed: (lessonId, itemIds) => {
        if (!itemIds?.length) return
        set((state) => ({ reviewQueue: addMissedToQueue(state.reviewQueue, lessonId, itemIds, todayKey()) }))
      },

      // บันทึกผลทบทวนหลายข้อพร้อมกัน [{ entryId, passed }]
      // @returns [{ entryId, outcome: 'next' | 'reset' | 'mastered', days }] (ใช้แสดงในหน้าสรุป)
      gradeReviews: (results) => {
        const today = todayKey()
        const outcomes = []
        set((state) => {
          let queue = state.reviewQueue
          for (const { entryId, passed } of results) {
            const graded = gradeReview(queue, entryId, passed, today)
            queue = graded.queue
            if (graded.outcome) outcomes.push({ entryId, outcome: graded.outcome, days: graded.days })
          }
          return { reviewQueue: queue }
        })
        return outcomes
      },

      // ล้างรายการทบทวนทั้งหมด
      resetReview: () => set({ reviewQueue: [] }),
    }),
    {
      name: 'et-review',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted) => ({ reviewQueue: [], ...persisted }),
    },
  ),
)
