'use client'

import React from 'react'
import {
  Activity,
  BadgeCheck,
  Bell,
  Bot,
  Briefcase,
  Building2,
  ChartColumn,
  ClipboardList,
  Clock,
  Cloud,
  Database,
  FileText,
  FlaskConical,
  GraduationCap,
  Handshake,
  Headphones,
  HeartPulse,
  Hospital,
  Inbox,
  Key,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  Mic,
  Phone,
  Pill,
  Puzzle,
  Rocket,
  Search,
  Send,
  Settings,
  Smartphone,
  Sparkles,
  Star,
  Stethoscope,
  Target,
  Timer,
  TrendingUp,
  User,
  Users,
  Video,
  Workflow,
  type LucideIcon,
} from 'lucide-react'

/**
 * Admin-only preview of the same icon library the website renders.
 *
 * This is a separate copy of neuroncx-website/src/components/BlockIcon —
 * the two apps do not share code, so this exists purely so the CMS admin
 * can show a picture instead of a name. It only needs to look right in the
 * picker below; the website's own copy is what actually renders on pages.
 * Keep the two lists of NAMES in step (see icons.ts); the drawings
 * themselves only need to be recognisable, not pixel-identical.
 */
const DRAWN: Record<string, React.ReactNode> = {
  message: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  chat: (
    <>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M8 9h8M8 13h5" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  card: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </>
  ),
  document: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 15l2 2 4-4" />
    </>
  ),
  refresh: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </>
  ),
  bolt: <path d="M13 2L4.5 13H11l-1 9 8.5-11H12l1-9z" />,
  layers: (
    <>
      <path d="M12 2l9 5-9 5-9-5 9-5z" />
      <path d="M3 12l9 5 9-5M3 17l9 5 9-5" />
    </>
  ),
  gauge: (
    <>
      <path d="M12 21a9 9 0 1 1 9-9" />
      <path d="M12 12l5-3" />
    </>
  ),
  plug: (
    <>
      <path d="M9 2v6M15 2v6" />
      <path d="M6 8h12v3a6 6 0 0 1-12 0V8zM12 17v5" />
    </>
  ),
  shield: <path d="M12 3l8 3v6c0 4.4-3.4 7.9-8 9-4.6-1.1-8-4.6-8-9V6l8-3z" />,
  shieldCheck: (
    <>
      <path d="M12 3l8 3v6c0 4.4-3.4 7.9-8 9-4.6-1.1-8-4.6-8-9V6l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 2.5 15 0 18-2.5-3-2.5-15.4 0-18z" />
    </>
  ),
  server: (
    <>
      <rect x="3" y="4" width="18" height="7" rx="2" />
      <rect x="3" y="13" width="18" height="7" rx="2" />
      <path d="M7 7.5h.01M7 16.5h.01" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
}

const LIBRARY: Record<string, LucideIcon> = {
  users: Users,
  user: User,
  phone: Phone,
  smartphone: Smartphone,
  mail: Mail,
  messageCircle: MessageCircle,
  send: Send,
  inbox: Inbox,
  headphones: Headphones,
  mic: Mic,
  video: Video,
  bell: Bell,
  handshake: Handshake,
  stethoscope: Stethoscope,
  heartPulse: HeartPulse,
  hospital: Hospital,
  activity: Activity,
  flask: FlaskConical,
  pill: Pill,
  graduationCap: GraduationCap,
  building: Building2,
  mapPin: MapPin,
  database: Database,
  cloud: Cloud,
  workflow: Workflow,
  bot: Bot,
  sparkles: Sparkles,
  search: Search,
  chart: ChartColumn,
  trendingUp: TrendingUp,
  target: Target,
  rocket: Rocket,
  key: Key,
  fileText: FileText,
  clipboardList: ClipboardList,
  link: Link2,
  settings: Settings,
  puzzle: Puzzle,
  timer: Timer,
  clock: Clock,
  badgeCheck: BadgeCheck,
  star: Star,
  briefcase: Briefcase,
}

/** Draws one icon by its saved name. Returns nothing for an unknown name. */
export const IconGlyph: React.FC<{ name: string }> = ({ name }) => {
  const Lib = LIBRARY[name]
  if (Lib) return <Lib aria-hidden="true" strokeWidth={1.8} />
  if (DRAWN[name]) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        {DRAWN[name]}
      </svg>
    )
  }
  return null
}
