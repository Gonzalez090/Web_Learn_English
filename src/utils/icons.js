// =========================================================
// ไอคอนเส้นที่ใช้ในหน้าเว็บ (lucide-react) — รวมไว้ที่เดียว
// ใช้: import { ICONS } from '../utils/icons';  const Icon = ICONS.home;  <Icon />
// (ภาพประกอบเนื้อหาใช้ภาพถ่ายจริงผ่าน <Picture> ไม่ใช้ไอคอน)
// =========================================================
import {
  ArrowLeft,
  ArrowRight,
  AudioLines,
  BookOpen,
  BookOpenCheck,
  CalendarCheck,
  CircleCheck,
  CircleHelp,
  Construction,
  Ear,
  HeartHandshake,
  Flame,
  Gamepad2,
  House,
  Layers,
  Lock,
  Map,
  MessageCircleMore,
  MessagesSquare,
  Mic,
  MicVocal,
  Play,
  Plus,
  RotateCcw,
  Settings,
  Shuffle,
  Snowflake,
  Sparkles,
  Square,
  Star,
  Swords,
  Target,
  Timer,
  Trash2,
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
  freeze: Snowflake,

  // สถานะ
  locked: Lock,
  unlocked: Play,
  completed: CircleCheck,

  // ปุ่มลัด / หมวด
  plan: CalendarCheck,
  boss: Swords, // Boss Conversation รายสัปดาห์ (ขั้นที่ 18-2)
  review: RotateCcw,
  sounds: AudioLines,
  phrases: MessagesSquare,
  talk: MessageCircleMore,
  friendship: HeartHandshake,
  settings: Settings,
  map: Map,
  missions: Target,
  speakingCheck: Mic,
  collection: Layers, // Collection การ์ดวลี (ขั้นที่ 20)
  special: Sparkles, // การ์ดพิเศษ (สำนวน/สแลง)
  realVsTextbook: BookOpenCheck,
  dev: Wrench,

  // อื่น ๆ
  back: ArrowLeft,
  next: ArrowRight,
  stop: Square,
  delete: Trash2,
  add: Plus,
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
