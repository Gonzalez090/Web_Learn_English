// =========================================================
// progressStore — ที่เก็บ "ความคืบหน้า" ของผู้เรียน
// บันทึกลง localStorage อัตโนมัติ (key: et-progress)
// วันที่ทั้งหมดใช้รูปแบบ 'YYYY-MM-DD' ตามเวลาเครื่อง (ไม่ใช้ UTC)
// เลเวลและฉายาคำนวณจาก xp ไม่เก็บซ้ำ (utils/level.js)
// ได้ XP จากการเรียน → นับ streak วันนี้ + ภารกิจ "เก็บ XP" คืบหน้า
// คุยกับ NPC จบ → ความสนิทเพิ่ม (utils/friendship.js) / เปิดเว็บ → บันทึกวันที่เข้า (คำทักเมื่อหายไปนาน)
// เหตุการณ์อื่น (พูดผ่าน, จบบท ฯลฯ) → trackEvent → ภารกิจคืบหน้า → สำเร็จได้ XP รางวัล
// ขึ้นเลเวล / ภารกิจสำเร็จ / ใช้ Streak Freeze → แจ้งผ่าน toastStore
// =========================================================
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { stages, lessonList, dailyMissionPool } from '../data'
import { computeUnlockedStages, recordLessonResult } from '../utils/progress'
import { todayKey, weekStartKey } from '../utils/date'
import { BOSS_BONUS_XP, isWeeklyBoss } from '../utils/boss'
import { levelFromXp } from '../utils/level'
import { recordActivity } from '../utils/streak'
import { applyMissionEvent, ensureDailyMissions, missionReward } from '../utils/missions'
import { addFriendship, recordVisit as visitResult } from '../utils/friendship'
import { applyPlanEvent, ensureDailyPlan, TALK_FROM_STAGE } from '../utils/dailyPlan'
import { addSpeaking } from '../utils/speaking'
import { addCard, cardRarity } from '../utils/collection'
import { chooseItem } from '../utils/room'
import { useToastStore } from './toastStore'

// ค่าเริ่มต้นของผู้เรียนใหม่
export const INITIAL_PROGRESS = {
  xp: 0, // XP สะสมทั้งหมด
  streak: { count: 0, lastActiveDate: null, best: 0 }, // เรียนต่อเนื่องกี่วัน + สูงสุดที่เคยทำได้
  streakFreeze: { available: 1, weekId: null }, // Streak Freeze 1 ครั้ง/สัปดาห์ (weekId = วันจันทร์ของสัปดาห์)
  unlockedStages: [1], // Stage ที่ปลดล็อกแล้ว
  unlockedPlaces: ['home'], // สถานที่ที่ปลดล็อกแล้ว (ขั้นที่ 14)
  lessonProgress: {}, // { [lessonId]: { completed, bestScore, attempts, completedAt } }
  collection: [], // การ์ดวลีที่สะสมได้ [phraseId] เรียงตามลำดับที่ได้ (ขั้นที่ 20 — utils/collection.js)
  room: { home: null, items: {} }, // ห้องของตัวละคร: บ้านที่เลือก (null = หลังล่าสุด) + ของแต่ละช่อง (ขั้นที่ 20-2 — utils/room.js)
  npcFriendship: {}, // { [npcId]: แต้มความสนิท } (ขั้นที่ 15)
  dailyMissions: { date: null, missions: [] }, // ภารกิจของวันนี้ [{ id, progress, done }]
  speakingMinutes: {}, // { 'YYYY-MM-DD': นาทีที่พูด (ทศนิยม) } ย้อนหลัง 60 วัน (ขั้นที่ 18 — utils/speaking.js)
  bossWeek: null, // Boss Conversation สัปดาห์นี้ { weekId, scenarioId, done } (ขั้นที่ 18-2 — utils/boss.js)
  dailyPlan: null, // แผนของวันนี้ { date, goal, tasks: [{ kind, target, progress }] } (ขั้นที่ 18 — utils/dailyPlan.js)
  lastVisitDate: null, // วันที่เข้าเว็บล่าสุด — ใช้ตรวจว่าหายไปหลายวันหรือไม่ (ขั้นที่ 15)
  welcomeBack: null, // { date, days } หายไป ≥ 3 วัน → NPC ทัก "Long time no see!" บนหน้าแรกวันนั้น (ปิดแล้ว = null)
}

// แจ้งผู้ใช้หลัง XP/ภารกิจเปลี่ยน
function announce({ previousXp, nextXp, completed = [], usedFreeze = false, streakCount = 0 }) {
  const { show } = useToastStore.getState()
  if (usedFreeze) show({ kind: 'freeze', count: streakCount })
  for (const mission of completed) show({ kind: 'mission', missionId: mission.id, xp: mission.xp })
  const level = levelFromXp(nextXp)
  const from = levelFromXp(previousXp)
  if (level > from) show({ kind: 'levelUp', level, from })
}

// ภารกิจของวันนี้ + ผลของเหตุการณ์หนึ่ง
function missionsAfter(state, event, amount) {
  const daily = ensureDailyMissions(state.dailyMissions, dailyMissionPool, todayKey())
  return applyMissionEvent(daily, dailyMissionPool, event, amount)
}

export const useProgressStore = create(
  persist(
    (set, get) => ({
      ...INITIAL_PROGRESS,

      // ปลดล็อกทุก Stage และทุกสถานที่ — ใช้ในหน้า /dev เท่านั้น
      // มีเฉพาะตอน npm run dev (ในเว็บจริงไม่มีฟังก์ชันนี้ คนกด F12 จึงเรียกใช้ไม่ได้)
      ...(import.meta.env.DEV && {
        devUnlockAll: (stageIds, placeIds) =>
          set({
            unlockedStages: [...stageIds],
            unlockedPlaces: Array.from(new Set([...INITIAL_PROGRESS.unlockedPlaces, ...placeIds])),
          }),
      }),

      // ได้ XP จากการเรียน (จำนวนเต็มบวกเท่านั้น) → นับ streak วันนี้ + ภารกิจ "เก็บ XP"
      addXp: (amount) => {
        if (!Number.isFinite(amount) || amount <= 0) return
        const gained = Math.round(amount)
        const state = get()
        const activity = recordActivity(state.streak, state.streakFreeze, todayKey())
        const { daily, completed } = missionsAfter(state, 'xp', gained)
        const nextXp = state.xp + gained + missionReward(completed)
        set({ xp: nextXp, streak: activity.streak, streakFreeze: activity.streakFreeze, dailyMissions: daily })
        announce({
          previousXp: state.xp,
          nextXp,
          completed,
          usedFreeze: activity.usedFreeze,
          streakCount: activity.streak.count,
        })
      },

      // แจ้งเหตุการณ์ของภารกิจรายวัน (ชนิดเหตุการณ์ดูที่ utils/missions.js) + แผนรายวัน (utils/dailyPlan.js)
      trackEvent: (event, amount = 1) => {
        const state = get()
        const { daily, completed } = missionsAfter(state, event, amount)
        const planResult = applyPlanEvent(state.dailyPlan, event, amount, todayKey())
        if (daily === state.dailyMissions && planResult.plan === state.dailyPlan) return
        const nextXp = state.xp + missionReward(completed)
        set({ dailyMissions: daily, xp: nextXp, dailyPlan: planResult.plan })
        announce({ previousXp: state.xp, nextXp, completed })
        if (planResult.completed) useToastStore.getState().show({ kind: 'planDone' })
      },

      // เปิดหน้าแรก/หน้าแผน → แผนของวันนี้ (วันใหม่/เปลี่ยนเป้า → สร้างใหม่) (ขั้นที่ 18)
      //   goal = et-settings.dailyGoal, reviewDue = รายการทบทวนที่ถึงกำหนดวันนี้ (ส่งมาจากหน้า — store นี้ไม่อ่าน store อื่น)
      refreshDailyPlan: ({ goal, reviewDue }) => {
        const state = get()
        const talkReady = state.unlockedStages.includes(TALK_FROM_STAGE)
        const plan = ensureDailyPlan(state.dailyPlan, { goal, today: todayKey(), reviewDue, talkReady })
        if (plan !== state.dailyPlan) set({ dailyPlan: plan })
      },

      // ล็อก Boss ของสัปดาห์นี้ไว้ตอนการ์ดแสดงครั้งแรก (ขั้นที่ 18-2) — ความสนิท/สถานที่เปลี่ยนกลางสัปดาห์ บทไม่เปลี่ยนตาม
      //   (หน้าแผนเรียกใหม่เฉพาะเมื่อขึ้นสัปดาห์ใหม่ หรือบทที่ล็อกไว้เล่นไม่ได้แล้ว)
      pinBoss: (scenarioId) => {
        const state = get()
        const weekId = weekStartKey(todayKey())
        if (state.bossWeek?.weekId === weekId && (state.bossWeek.done || state.bossWeek.scenarioId === scenarioId)) return
        set({ bossWeek: { weekId, scenarioId, done: false } })
      },

      // คุย Boss Conversation จบ (ขั้นที่ 18-2) → ชนะครั้งแรกของสัปดาห์ = โบนัส XP + แจ้งเตือน
      //   นับเฉพาะ Boss ที่ล็อกไว้ของสัปดาห์นี้ + seed ของสัปดาห์ (เปิด mode=boss บทอื่น/seed อื่นจาก URL = ฝึกซ้อม ไม่ได้โบนัส)
      completeBoss: (scenarioId, seed) => {
        const state = get()
        const weekId = weekStartKey(todayKey())
        if (!isWeeklyBoss(state.bossWeek, weekId, scenarioId, seed) || state.bossWeek.done) return
        set({ bossWeek: { ...state.bossWeek, done: true } })
        get().addXp(BOSS_BONUS_XP)
        useToastStore.getState().show({ kind: 'bossDone', xp: BOSS_BONUS_XP })
      },

      // พูดภาษาอังกฤษผ่านไมค์ (ms ที่ตรวจพบเสียงพูดจริง) → นาทีที่พูดของวันนี้ + ภารกิจ "พูดรวม N นาที" ทุกนาทีเต็ม
      addSpeakingTime: (ms) => {
        const state = get()
        const { minutes, wholeMinutes } = addSpeaking(state.speakingMinutes, todayKey(), ms)
        if (minutes === state.speakingMinutes) return
        set({ speakingMinutes: minutes })
        if (wholeMinutes > 0) get().trackEvent('speakingMinutes', wholeMinutes)
      },

      // เปิดหน้าแรกวันใหม่ → สุ่มภารกิจของวันนี้
      refreshDailyMissions: () => {
        const state = get()
        const daily = ensureDailyMissions(state.dailyMissions, dailyMissionPool, todayKey())
        if (daily !== state.dailyMissions) set({ dailyMissions: daily })
      },

      // เปิดเว็บ → บันทึกวันที่เข้า (หายไป ≥ 3 วัน → ตั้งคำทัก "Long time no see!" ของวันนี้)
      recordVisit: () => {
        const state = get()
        const next = visitResult(state, todayKey())
        if (next.lastVisitDate !== state.lastVisitDate || next.welcomeBack !== state.welcomeBack) set(next)
      },

      // ปิดคำทัก "Long time no see!"
      dismissWelcomeBack: () => set({ welcomeBack: null }),

      // คุยบทสนทนาสุ่มจบกับ NPC → ความสนิท +1 + ภารกิจ "คุยกับ NPC" (ขึ้นระดับ → แจ้งเตือน)
      talkWithNpc: (npcId) => {
        if (!npcId) return
        const { friendship, levelUp } = addFriendship(get().npcFriendship, npcId)
        set({ npcFriendship: friendship })
        if (levelUp !== null) useToastStore.getState().show({ kind: 'friendship', npcId, level: levelUp })
        get().trackEvent('npcTalk')
      },

      // จบบทเรียน → บันทึกผล + ปลดล็อก Stage ถัดไปถ้าผ่านครบ
      // @returns รายการ Stage ที่เพิ่งปลดล็อก (ใช้แสดงในหน้าสรุป)
      completeLesson: (lessonId, score) => {
        let newlyUnlocked = []
        set((state) => {
          const lessonProgress = recordLessonResult(state.lessonProgress, lessonId, score, todayKey())
          const result = computeUnlockedStages(stages, lessonList, state.unlockedStages, lessonProgress)
          newlyUnlocked = result.newlyUnlocked
          return { lessonProgress, unlockedStages: result.unlockedStages }
        })
        return newlyUnlocked
      },

      // พูดวลีในคลังวลีผ่าน → ได้การ์ดวลีนั้น (ครั้งแรกเท่านั้น) + แจ้ง "การ์ดใหม่" (การ์ดพิเศษ = สำนวน/สแลง)
      // @returns true ถ้าเพิ่งได้การ์ดใบนี้
      collectPhrase: (phrase) => {
        const { collection, added } = addCard(get().collection, phrase?.id)
        if (!added) return false
        set({ collection })
        useToastStore.getState().show({ kind: 'collect', text: phrase.text, rarity: cardRarity(phrase), count: collection.length })
        return true
      },

      // ตกแต่งห้อง: เลือกบ้าน (slotId 'home') หรือของในช่อง / itemId null = เอาออก — ชิ้นที่ยังไม่ปลดล็อกเลือกไม่ได้
      chooseRoomItem: (slotId, itemId) => {
        const { room, xp } = get()
        const next = chooseItem(room, slotId, itemId, levelFromXp(xp))
        if (next !== room) set({ room: next })
      },

      // กู้คืนจากไฟล์สำรอง (ค่าตรวจแล้วจาก utils/backup.js cleanProgress) → แทนที่ทั้งหมด
      restoreProgress: (progress) => set({ ...INITIAL_PROGRESS, ...progress }),

      // ล้างความคืบหน้าทั้งหมด กลับเป็นผู้เรียนใหม่
      resetProgress: () => set(INITIAL_PROGRESS),
    }),
    {
      name: 'et-progress',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // เมื่อ version เพิ่มในขั้นถัด ๆ ไป ให้แปลงข้อมูลเก่าที่นี่
      migrate: (persisted) => ({ ...INITIAL_PROGRESS, ...persisted }),
    },
  ),
)
