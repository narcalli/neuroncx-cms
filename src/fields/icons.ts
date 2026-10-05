import type { SelectField } from 'payload'

/**
 * The icon library shared by every block that offers an icon picker
 * (Conversation Hero workflow steps, Platform Layers, Journey Engine, Trust Panel).
 *
 * The values here must match the website's icon component:
 *   neuroncx-website/src/components/BlockIcon/index.tsx
 *
 * To add an icon: add it there first, then add an option here.
 * Never rename or remove a value — saved pages store it by name.
 */
export const iconOptions: { label: string; value: string }[] = [
  // Original set
  { label: 'Message — conversational, enquiry', value: 'message' },
  { label: 'Chat — follow-up, replies', value: 'chat' },
  { label: 'Check — confirmation, qualify', value: 'check' },
  { label: 'Calendar — booking, scheduling', value: 'calendar' },
  { label: 'Card — payment, transaction', value: 'card' },
  { label: 'Document — record, report, fulfilment', value: 'document' },
  { label: 'Refresh — recover, retry', value: 'refresh' },
  { label: 'Bolt — workflows, automation', value: 'bolt' },
  { label: 'Layers — context, knowledge', value: 'layers' },
  { label: 'Gauge — quality, analytics', value: 'gauge' },
  { label: 'Plug — integrations', value: 'plug' },
  { label: 'Shield — private cloud, isolation', value: 'shield' },
  { label: 'Shield check — governance, oversight', value: 'shieldCheck' },
  { label: 'Lock — data ownership', value: 'lock' },
  { label: 'Globe — standards, interoperability', value: 'globe' },
  { label: 'Server — infrastructure, hosting', value: 'server' },
  { label: 'Eye — audit, observability', value: 'eye' },

  // People and contact
  { label: 'Users — team, patients, customers', value: 'users' },
  { label: 'User — one person, profile', value: 'user' },
  { label: 'Phone — voice, calls', value: 'phone' },
  { label: 'Smartphone — mobile, WhatsApp', value: 'smartphone' },
  { label: 'Mail — email', value: 'mail' },
  { label: 'Message circle — chat, messaging', value: 'messageCircle' },
  { label: 'Send — outbound, campaigns', value: 'send' },
  { label: 'Inbox — incoming, queue', value: 'inbox' },
  { label: 'Headphones — support, agent handover', value: 'headphones' },
  { label: 'Mic — voice input', value: 'mic' },
  { label: 'Video — video consult', value: 'video' },
  { label: 'Bell — reminders, alerts', value: 'bell' },
  { label: 'Handshake — partnership, onboarding', value: 'handshake' },

  // Healthcare and education
  { label: 'Stethoscope — doctor, consultation', value: 'stethoscope' },
  { label: 'Heart pulse — health, vitals', value: 'heartPulse' },
  { label: 'Hospital — hospitals, facilities', value: 'hospital' },
  { label: 'Activity — monitoring, live status', value: 'activity' },
  { label: 'Flask — lab, diagnostics', value: 'flask' },
  { label: 'Pill — pharmacy, prescriptions', value: 'pill' },
  { label: 'Graduation cap — education, admissions', value: 'graduationCap' },
  { label: 'Building — organisation, campus', value: 'building' },
  { label: 'Map pin — location, branch', value: 'mapPin' },

  // Data, AI and operations
  { label: 'Database — records, data store', value: 'database' },
  { label: 'Cloud — cloud, hosted', value: 'cloud' },
  { label: 'Workflow — process, orchestration', value: 'workflow' },
  { label: 'Bot — AI agent', value: 'bot' },
  { label: 'Sparkles — AI, generated', value: 'sparkles' },
  { label: 'Search — retrieval, lookup', value: 'search' },
  { label: 'Chart — reporting, dashboards', value: 'chart' },
  { label: 'Trending up — growth, conversion', value: 'trendingUp' },
  { label: 'Target — goals, targeting', value: 'target' },
  { label: 'Rocket — go-live, launch', value: 'rocket' },
  { label: 'Key — access, credentials', value: 'key' },
  { label: 'File text — documents, notes', value: 'fileText' },
  { label: 'Clipboard list — tasks, checklist', value: 'clipboardList' },
  { label: 'Link — connection', value: 'link' },
  { label: 'Settings — configuration', value: 'settings' },
  { label: 'Puzzle — modules, extensions', value: 'puzzle' },
  { label: 'Timer — speed, turnaround', value: 'timer' },
  { label: 'Clock — time, schedule', value: 'clock' },
  { label: 'Badge check — verified, certified', value: 'badgeCheck' },
  { label: 'Star — rating, highlight', value: 'star' },
  { label: 'Briefcase — business, enterprise', value: 'briefcase' },
]

/**
 * An icon picker with the shared library. Pass the default for that block,
 * or omit it to leave the field empty until the editor picks one (the
 * picker shows a "No icon" option to clear it back to empty, unless the
 * field is required).
 *
 * Shows the actual icon, not just its name — the plain dropdown Payload
 * would otherwise render is swapped for a searchable grid, everywhere this
 * is used, via the shared admin component below.
 */
export const iconField = (
  defaultValue?: string,
  opts?: { name?: string; label?: string; required?: boolean; description?: string },
): SelectField => ({
  name: opts?.name || 'icon',
  type: 'select',
  label: opts?.label || 'Icon',
  defaultValue,
  required: opts?.required,
  options: iconOptions,
  admin: {
    description: opts?.description,
    components: {
      Field: {
        path: '@/fields/IconPicker/Component#IconPickerField',
        clientProps: { allowClear: !defaultValue && !opts?.required },
      },
    },
  },
})
