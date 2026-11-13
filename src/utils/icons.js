// =========================================================
// ไอคอนเส้นที่ใช้ในหน้าเว็บ (lucide-react) — รวมไว้ที่เดียว
// ใช้: import { ICONS } from '../utils/icons';  const Icon = ICONS.home;  <Icon />
// (ภาพประกอบเนื้อหาใช้ภาพถ่ายจริงผ่าน <Picture> ไม่ใช้ไอคอน)
// =========================================================
import {
  ArrowLeft,
  AudioLines,
  BookOpen,
  BookOpenCheck,
  CalendarCheck,
  CircleCheck,
  CircleHelp,
  Construction,
  Ear,
  Flame,
  Gamepad2,
  House,
  Lock,
  Map,
  MessagesSquare,
  Mic,
  MicVocal,
  Play,
  RotateCcw,
  Settings,
  Shuffle,
  Star,
  Swords,
  Target,
  Timer,
  User,
  Wrench,
} from 'lucide-react'

export const ICONS = {
  // เมนูหลัก
  home: House,
  learn: BookOpen,
  games: Gamepad2,
  profile: User,

  // สถิติ
  streak: Flame,
  xp: Star,

  // สถานะ
  locked: Lock,
  unlocked: Play,
  completed: CircleCheck,

  // ปุ่มลัด / หมวด
  plan: CalendarCheck,
  review: RotateCcw,
  sounds: AudioLines,
  phrases: MessagesSquare,
  settings: Settings,
  map: Map,
  missions: Target,
  speakingCheck: Mic,
  realVsTextbook: BookOpenCheck,
  dev: Wrench,

  // อื่น ๆ
  back: ArrowLeft,
  soon: Construction,
}

// ไอคอนของมินิเกมแต่ละเกม (key = id ใน game.json)
export const GAME_ICONS = {
  'listen-tap': Ear,
  'shadow-karaoke': MicVocal,
  'word-swap-race': Shuffle,
  'real-or-textbook': CircleHelp,
  'minimal-pair-duel': Swords,
  'speed-order': Timer,
}
