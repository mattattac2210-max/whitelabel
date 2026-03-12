import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Shield, Calendar, FileText, Wrench, Car,
  AlertTriangle, Check, X, Bluetooth, Navigation, BookOpen,
  ArrowRight, Download, MapPin, RotateCcw, Clock, Receipt,
  TrendingUp, BarChart3, Key, Play, Info, Star,
} from 'lucide-react';
import { useApp } from '@/lib/app-context';
import type { Screen } from '@/lib/app-context';

type Tab = 'rules' | 'methods' | 'features' | 'howto';

// ── Shared ────────────────────────────────────────────────────
function SectionHeader({ label, title, subtitle }: { label: string; title: string; subtitle: string }) {
  return (
    <div className="mb-[14px]">
      <div className="inline-flex items-center gap-[5px] px-[9px] py-[3px] rounded-full mb-[8px]" style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }}>
        <span className="font-heading font-bold text-[9px] uppercase tracking-[.08em]" style={{ color: 'var(--wc-t3)' }}>{label}</span>
      </div>
      <div className="font-heading font-black text-[18px] uppercase leading-tight tracking-[.02em]" style={{ color: 'var(--wc-text)' }}>{title}</div>
      <div className="text-[11px] mt-[3px] leading-[1.5]" style={{ color: 'var(--wc-t3)' }}>{subtitle}</div>
    </div>
  );
}

// ── Tab 1: Logbook Rules ──────────────────────────────────────
function TabRules() {
  const businessCategories = [
    'Tool Run', 'Job Site', 'Pickup / Delivery', 'Quote / Inspect',
    'Client Meeting', 'Supplier / Trade', 'Emergency Call', 'Admin / Office',
    'Training', 'Council / Permit',
  ];

  const mistakes = [
    { title: 'Recording only business trips', fix: 'Every trip — business AND personal — must be recorded. The ratio is what matters.' },
    { title: 'Gaps in the 12-week period', fix: 'The logbook must be continuous. Missing weeks can invalidate your entire claim.' },
    { title: 'Vague purpose descriptions', fix: 'The ATO needs a specific purpose for each business trip, not just "work".' },
    { title: 'Commuting to a regular workplace', fix: 'Travel between home and a fixed regular workplace is personal, not business.' },
    { title: 'No odometer evidence', fix: 'Record your odometer reading at the start and end of each trip and the logbook period.' },
  ];

  return (
    <div className="flex flex-col gap-[16px]">
      <SectionHeader
        label="ATO Compliance"
        title="Australian Logbook Rules"
        subtitle="What the ATO requires for a valid vehicle expense claim"
      />

      {/* Core requirements */}
      <div className="flex flex-col gap-[8px]">
        {[
          { icon: Calendar, color: 'var(--wc-y)', title: '12 Consecutive Weeks', body: 'Your logbook must cover at least 12 unbroken weeks of driving. This establishes the business-use percentage applied to your full-year costs.' },
          { icon: Shield, color: '#4ade80', title: '5-Year Validity', body: "Once completed, your logbook is valid for 5 income years — you don't need to redo it unless your usage pattern changes significantly." },
          { icon: FileText, color: '#60a5fa', title: 'Every Trip Recorded', body: 'All trips — both business and personal — must be logged with the date, destination, purpose and kilometres travelled.' },
          { icon: Wrench, color: '#f472b6', title: 'Business Purpose Required', body: "Each business trip needs a clear, specific purpose. Home-to-work commutes don't qualify. The 10 accepted categories are listed below." },
          { icon: Car, color: '#a78bfa', title: 'Odometer Readings', body: 'Record your vehicle odometer at the start and end of the 12-week period and at the start/end of each trip.' },
        ].map(r => (
          <div key={r.title} className="flex gap-[11px] rounded-[13px] p-[11px_13px]" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}>
            <div className="w-[32px] h-[32px] rounded-[9px] flex items-center justify-center flex-shrink-0" style={{ background: `${r.color}18`, border: `1px solid ${r.color}40` }}>
              <r.icon className="w-[13px] h-[13px]" style={{ color: r.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-heading font-bold text-[11px] leading-tight mb-[2px]" style={{ color: 'var(--wc-text)' }}>{r.title}</div>
              <div className="text-[10px] leading-[1.5]" style={{ color: 'var(--wc-t3)' }}>{r.body}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 12-week timeline visual */}
      <div className="rounded-[13px] p-[12px_14px]" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}>
        <div className="font-heading font-bold text-[10px] uppercase tracking-[.06em] mb-[10px]" style={{ color: 'var(--wc-t2)' }}>12-Week Logbook Period</div>
        <div className="flex gap-[3px] mb-[6px]">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-[3px]">
              <div
                className="w-full rounded-[3px] transition-all"
                style={{
                  height: 28,
                  background: i < 8 ? 'rgba(245,196,0,.35)' : i < 10 ? 'rgba(245,196,0,.15)' : 'rgb(var(--wc-ink) / .06)',
                  border: i < 8 ? '1px solid rgba(245,196,0,.5)' : '1px solid var(--wc-border)',
                }}
              />
              <span className="font-data text-[7px]" style={{ color: 'var(--wc-t3)' }}>{i + 1}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-[10px] flex-wrap">
          <div className="flex items-center gap-[4px]">
            <div className="w-[10px] h-[10px] rounded-[2px]" style={{ background: 'rgba(245,196,0,.35)', border: '1px solid rgba(245,196,0,.5)' }} />
            <span className="text-[9px]" style={{ color: 'var(--wc-t3)' }}>Recorded weeks</span>
          </div>
          <div className="flex items-center gap-[4px]">
            <div className="w-[10px] h-[10px] rounded-[2px]" style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }} />
            <span className="text-[9px]" style={{ color: 'var(--wc-t3)' }}>Remaining</span>
          </div>
        </div>
      </div>

      {/* Business categories */}
      <div>
        <div className="font-heading font-bold text-[10px] uppercase tracking-[.06em] mb-[8px]" style={{ color: 'var(--wc-t2)' }}>Accepted Business Trip Purposes</div>
        <div className="grid grid-cols-2 gap-[5px]">
          {businessCategories.map(c => (
            <div key={c} className="flex items-center gap-[7px] rounded-[9px] px-[10px] py-[7px]" style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}>
              <div className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background: 'var(--wc-y)' }} />
              <span className="text-[10px] font-heading font-bold leading-tight" style={{ color: 'var(--wc-text)' }}>{c}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Common mistakes */}
      <div>
        <div className="font-heading font-bold text-[10px] uppercase tracking-[.06em] mb-[8px]" style={{ color: 'var(--wc-t2)' }}>Common Mistakes to Avoid</div>
        <div className="flex flex-col gap-[6px]">
          {mistakes.map(m => (
            <div key={m.title} className="rounded-[12px] p-[10px_12px]" style={{ background: 'rgba(239,68,68,.05)', border: '1px solid rgba(239,68,68,.2)' }}>
              <div className="flex items-start gap-[7px]">
                <X className="w-[11px] h-[11px] flex-shrink-0 mt-[1px]" style={{ color: '#ef4444' }} />
                <div>
                  <div className="font-heading font-bold text-[11px] leading-tight mb-[2px]" style={{ color: '#ef4444' }}>{m.title}</div>
                  <div className="flex items-start gap-[5px]">
                    <Check className="w-[10px] h-[10px] flex-shrink-0 mt-[1px]" style={{ color: '#4ade80' }} />
                    <div className="text-[10px] leading-[1.4]" style={{ color: 'var(--wc-t2)' }}>{m.fix}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tab 2: Three Methods ──────────────────────────────────────
function EffortDots({ level, max = 5 }: { level: number; max?: number }) {
  return (
    <div className="flex gap-[3px]">
      {Array.from({ length: max }).map((_, i) => (
        <div key={i} className="w-[7px] h-[7px] rounded-full" style={{ background: i < level ? 'var(--wc-y)' : 'rgb(var(--wc-ink) / .12)' }} />
      ))}
    </div>
  );
}

function TabMethods() {
  const [currentMethod, setCurrentMethod] = useState<'gps' | 'hybrid' | 'basic'>(() => {
    try {
      const s = JSON.parse(localStorage.getItem('wc_settings') || '{}');
      return s.logbookStream || 'hybrid';
    } catch { return 'hybrid'; }
  });

  const methods = [
    {
      id: 'gps' as const,
      label: 'GPS Device',
      Icon: Bluetooth,
      effort: 1,
      effortLabel: 'Minimal input',
      color: '#60a5fa',
      desc: 'A dedicated Bluetooth GPS device records every trip automatically. Sync to the app when you\'re ready. Zero manual entry required.',
      features: {
        autoTrack: true,
        liveMap: true,
        recurring: false,
        bluetooth: true,
        manualAdd: true,
      },
      bestFor: 'High-volume drivers who want completely hands-free recording',
      steps: ['Pair Bluetooth GPS device', 'Drive normally', 'Tap Sync to import', 'Sort & classify', 'Export report'],
    },
    {
      id: 'hybrid' as const,
      label: 'Phone GPS',
      Icon: Navigation,
      effort: 2,
      effortLabel: 'Low input',
      color: '#4ade80',
      desc: "Uses your phone's built-in GPS to detect and record trips in the background. No external hardware needed.",
      features: {
        autoTrack: true,
        liveMap: true,
        recurring: true,
        bluetooth: false,
        manualAdd: true,
      },
      bestFor: 'Most users — automatic recording with just your phone',
      steps: ['Allow location access', 'Drive — trips auto-record', 'Review detected trips', 'Sort & classify', 'Export report'],
    },
    {
      id: 'basic' as const,
      label: 'Manual Entry',
      Icon: BookOpen,
      effort: 4,
      effortLabel: 'More input required',
      color: 'var(--wc-y)',
      desc: 'Enter each trip manually using the Add Trip form. Use recurring templates to speed up regular routes.',
      features: {
        autoTrack: false,
        liveMap: false,
        recurring: true,
        bluetooth: false,
        manualAdd: true,
      },
      bestFor: 'Low-volume drivers or those who prefer full manual control',
      steps: ['Tap + to add trip', 'Enter trip details', 'Use recurring templates', 'Sort & classify', 'Export report'],
    },
  ];

  const featureLabels: { key: keyof typeof methods[0]['features']; label: string }[] = [
    { key: 'autoTrack', label: 'Auto-tracking' },
    { key: 'liveMap', label: 'Live map view' },
    { key: 'recurring', label: 'Recurring templates' },
    { key: 'bluetooth', label: 'Bluetooth device sync' },
    { key: 'manualAdd', label: 'Manual trip entry' },
  ];

  const active = methods.find(m => m.id === currentMethod)!;

  return (
    <div className="flex flex-col gap-[16px]">
      <SectionHeader
        label="Recording Methods"
        title="Three Ways to Use This App"
        subtitle="Choose the method that suits your workflow"
      />

      {/* Method selector tabs */}
      <div className="grid grid-cols-3 gap-[6px]">
        {methods.map(m => (
          <button
            key={m.id}
            className="rounded-[12px] p-[10px_8px] flex flex-col items-center gap-[5px] transition-all active:scale-[.96]"
            style={{
              background: currentMethod === m.id ? `${m.color}14` : 'var(--wc-card)',
              border: currentMethod === m.id ? `1.5px solid ${m.color}60` : '1px solid var(--wc-border)',
            }}
            onClick={() => setCurrentMethod(m.id)}
          >
            <div
              className="w-[32px] h-[32px] rounded-[10px] flex items-center justify-center"
              style={{ background: currentMethod === m.id ? `${m.color}20` : 'rgb(var(--wc-ink) / .06)' }}
            >
              <m.Icon className="w-[14px] h-[14px]" style={{ color: currentMethod === m.id ? m.color : 'var(--wc-t3)' }} />
            </div>
            <div className="font-heading font-bold text-[9px] uppercase tracking-[.05em] text-center leading-tight" style={{ color: currentMethod === m.id ? 'var(--wc-text)' : 'var(--wc-t3)' }}>{m.label}</div>
          </button>
        ))}
      </div>

      {/* Active method detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMethod}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="rounded-[14px] p-[14px_16px]"
          style={{ background: 'var(--wc-card)', border: `1.5px solid ${active.color}40` }}
        >
          <div className="flex items-center gap-[10px] mb-[10px]">
            <div className="w-[38px] h-[38px] rounded-[12px] flex items-center justify-center" style={{ background: `${active.color}18` }}>
              <active.Icon className="w-[17px] h-[17px]" style={{ color: active.color }} />
            </div>
            <div>
              <div className="font-heading font-black text-[15px] uppercase tracking-[.02em]" style={{ color: 'var(--wc-text)' }}>{active.label}</div>
              <div className="flex items-center gap-[7px] mt-[1px]">
                <EffortDots level={active.effort} />
                <span className="text-[9px] font-heading font-bold uppercase tracking-[.06em]" style={{ color: 'var(--wc-t3)' }}>{active.effortLabel}</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] leading-[1.55] mb-[10px]" style={{ color: 'var(--wc-t2)' }}>{active.desc}</div>

          <div className="rounded-[10px] p-[8px_10px] mb-[10px]" style={{ background: 'rgb(var(--wc-ink) / .04)', border: '1px solid var(--wc-border)' }}>
            <div className="text-[9px] font-heading font-bold uppercase tracking-[.06em] mb-[4px]" style={{ color: 'var(--wc-t3)' }}>Best for</div>
            <div className="text-[10px] leading-[1.4]" style={{ color: 'var(--wc-t2)' }}>{active.bestFor}</div>
          </div>

          <div className="font-heading font-bold text-[9px] uppercase tracking-[.06em] mb-[6px]" style={{ color: 'var(--wc-t3)' }}>Typical workflow</div>
          <div className="flex flex-col gap-[4px]">
            {active.steps.map((s, i) => (
              <div key={s} className="flex items-center gap-[8px]">
                <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${active.color}20`, border: `1px solid ${active.color}40` }}>
                  <span className="font-heading font-black text-[8px]" style={{ color: active.color }}>{i + 1}</span>
                </div>
                <span className="text-[10px]" style={{ color: 'var(--wc-t2)' }}>{s}</span>
                {i < active.steps.length - 1 && (
                  <div className="absolute" />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Feature comparison table */}
      <div>
        <div className="font-heading font-bold text-[10px] uppercase tracking-[.06em] mb-[8px]" style={{ color: 'var(--wc-t2)' }}>Feature Comparison</div>
        <div className="rounded-[13px] overflow-hidden" style={{ border: '1px solid var(--wc-border)' }}>
          {/* Header */}
          <div className="grid grid-cols-4 gap-0" style={{ background: 'rgb(var(--wc-ink) / .04)', borderBottom: '1px solid var(--wc-border)' }}>
            <div className="p-[8px_10px]">
              <span className="font-heading font-bold text-[8px] uppercase tracking-[.06em]" style={{ color: 'var(--wc-t3)' }}>Feature</span>
            </div>
            {methods.map(m => (
              <div key={m.id} className="p-[8px_6px] text-center" style={{ borderLeft: '1px solid var(--wc-border)' }}>
                <m.Icon className="w-[11px] h-[11px] mx-auto mb-[1px]" style={{ color: currentMethod === m.id ? m.color : 'var(--wc-t3)' }} />
                <div className="font-heading font-bold text-[7px] uppercase tracking-[.04em] leading-tight" style={{ color: currentMethod === m.id ? 'var(--wc-text)' : 'var(--wc-t3)' }}>{m.label}</div>
              </div>
            ))}
          </div>
          {featureLabels.map((f, fi) => (
            <div
              key={f.key}
              className="grid grid-cols-4"
              style={{ borderBottom: fi < featureLabels.length - 1 ? '1px solid var(--wc-border)' : 'none', background: fi % 2 === 0 ? 'transparent' : 'rgb(var(--wc-ink) / .02)' }}
            >
              <div className="p-[8px_10px] flex items-center">
                <span className="text-[9px] leading-tight" style={{ color: 'var(--wc-t2)' }}>{f.label}</span>
              </div>
              {methods.map(m => (
                <div key={m.id} className="p-[8px_6px] flex items-center justify-center" style={{ borderLeft: '1px solid var(--wc-border)' }}>
                  {m.features[f.key] ? (
                    <Check className="w-[11px] h-[11px]" style={{ color: '#4ade80' }} />
                  ) : (
                    <X className="w-[10px] h-[10px]" style={{ color: 'rgb(var(--wc-ink) / .2)' }} />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[12px] p-[10px_12px]" style={{ background: 'rgba(245,196,0,.07)', border: '1px solid rgba(245,196,0,.2)' }}>
        <div className="flex items-center gap-[6px] mb-[3px]">
          <Info className="w-[10px] h-[10px]" style={{ color: 'var(--wc-y)' }} />
          <span className="font-heading font-bold text-[9px] uppercase tracking-[.06em]" style={{ color: 'var(--wc-y)' }}>Change any time</span>
        </div>
        <div className="text-[10px] leading-[1.4]" style={{ color: 'var(--wc-t2)' }}>
          Your recording method can be changed at any time from the dashboard carousel or Settings. Switching methods does not delete existing trips.
        </div>
      </div>
    </div>
  );
}

// ── Tab 3: Built-in Features ──────────────────────────────────
function TabFeatures() {
  const features = [
    {
      icon: Navigation,
      color: '#4ade80',
      label: 'Auto-Tracking',
      desc: 'Background GPS tracking detects trips automatically without any interaction.',
      badge: 'GPS & Phone',
    },
    {
      icon: ArrowRight,
      color: 'var(--wc-y)',
      label: 'Trip Sorting',
      desc: 'Swipe-card interface to quickly mark trips as Business or Personal.',
      badge: 'All methods',
    },
    {
      icon: FileText,
      color: '#60a5fa',
      label: 'Business Classification',
      desc: '10 ATO-recognised purpose categories for business trips.',
      badge: 'All methods',
    },
    {
      icon: RotateCcw,
      color: '#f472b6',
      label: 'Recurring Trips',
      desc: 'Set up route templates and apply them across entire date ranges in one tap.',
      badge: 'Manual & Phone',
    },
    {
      icon: TrendingUp,
      color: '#a78bfa',
      label: 'Deduction Estimator',
      desc: 'Real-time estimate of your ATO vehicle deduction based on your data and vehicle costs.',
      badge: 'All methods',
    },
    {
      icon: Star,
      color: '#fb923c',
      label: 'Audit Score',
      desc: 'A weighted score (0–100) measuring the quality of your logbook for ATO scrutiny.',
      badge: 'All methods',
    },
    {
      icon: Receipt,
      color: '#34d399',
      label: 'Expense Tracking',
      desc: 'Log all vehicle expenses (fuel, servicing, insurance, depreciation) in ATO-ordered categories.',
      badge: 'All methods',
    },
    {
      icon: Download,
      color: '#60a5fa',
      label: 'PDF & CSV Export',
      desc: 'Generate ATO-ready logbook reports as PDF or CSV for your accountant.',
      badge: 'All methods',
    },
    {
      icon: Car,
      color: '#f472b6',
      label: 'Odometer Verification',
      desc: 'Verify start/end odometer readings per trip with photo evidence support.',
      badge: 'All methods',
    },
    {
      icon: Key,
      color: '#a78bfa',
      label: 'Find My Keys',
      desc: 'Save your parking location, ring your keys, and navigate back to your vehicle.',
      badge: 'Bonus feature',
    },
    {
      icon: BarChart3,
      color: 'var(--wc-y)',
      label: 'Trip Analytics',
      desc: 'Charts showing business vs personal split, trips by day, top destinations, and averages.',
      badge: 'All methods',
    },
    {
      icon: Calendar,
      color: '#4ade80',
      label: 'Tax Estimate',
      desc: 'Australian income tax calculator with ATO brackets, Medicare levy and HECS/HELP support.',
      badge: 'All methods',
    },
  ];

  return (
    <div className="flex flex-col gap-[16px]">
      <SectionHeader
        label="App Features"
        title="Built-in Tools"
        subtitle="Everything included to make your logbook ATO-ready"
      />

      <div className="grid grid-cols-1 gap-[7px]">
        {features.map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex gap-[11px] rounded-[12px] p-[11px_13px]"
            style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}
          >
            <div
              className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: `${f.color}18`, border: `1px solid ${f.color}40` }}
            >
              <f.icon className="w-[14px] h-[14px]" style={{ color: f.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-[6px] mb-[2px]">
                <div className="font-heading font-bold text-[11px] leading-tight" style={{ color: 'var(--wc-text)' }}>{f.label}</div>
                <span
                  className="px-[5px] py-[1px] rounded-full font-heading font-bold text-[7px] uppercase tracking-[.05em] flex-shrink-0"
                  style={{ background: 'rgb(var(--wc-ink) / .06)', color: 'var(--wc-t3)' }}
                >
                  {f.badge}
                </span>
              </div>
              <div className="text-[10px] leading-[1.4]" style={{ color: 'var(--wc-t3)' }}>{f.desc}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="rounded-[12px] p-[10px_12px]" style={{ background: 'rgba(245,196,0,.07)', border: '1px solid rgba(245,196,0,.2)' }}>
        <div className="flex items-center gap-[6px] mb-[3px]">
          <Play className="w-[10px] h-[10px]" style={{ color: 'var(--wc-y)' }} />
          <span className="font-heading font-bold text-[9px] uppercase tracking-[.06em]" style={{ color: 'var(--wc-y)' }}>Assistant Mode</span>
        </div>
        <div className="text-[10px] leading-[1.4]" style={{ color: 'var(--wc-t2)' }}>
          Enable Assistant Mode from the dashboard to show helpful tips on every screen as you work through your logbook.
        </div>
      </div>
    </div>
  );
}

// ── Tab 4: How-To Workflows ───────────────────────────────────
function TabHowTo({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const sections: {
    id: string;
    label: string;
    icon: React.ElementType;
    screen: Screen;
    color: string;
    intro: string;
    steps: { title: string; desc: string }[];
    tip: string;
  }[] = [
    {
      id: 'sort',
      label: 'Sorting Trips',
      icon: ArrowRight,
      screen: 'sort',
      color: 'var(--wc-y)',
      intro: 'The Sort screen is your main workflow. Each unsorted trip appears as a card — swipe or tap to mark it Business or Personal.',
      steps: [
        { title: 'Open Sort', desc: 'Tap the Sort tab in the bottom navigation. The badge shows how many trips need sorting.' },
        { title: 'Review the trip card', desc: 'Each card shows the date, from/to locations, distance and duration.' },
        { title: 'Swipe Business or Personal', desc: 'Swipe right for Business, left for Personal — or tap the coloured buttons.' },
        { title: 'Repeat until the queue is empty', desc: 'All sorted trips move to the Classify step for business trips.' },
      ],
      tip: 'Sort little and often. Doing 5–10 trips a day takes under a minute.',
    },
    {
      id: 'classify',
      label: 'Classifying Business Trips',
      icon: FileText,
      screen: 'classify',
      color: '#60a5fa',
      intro: "After sorting, business trips need a specific ATO-recognised purpose. This is what the ATO audits — don't skip it.",
      steps: [
        { title: 'Classify screen opens automatically', desc: "After sorting, if there are business trips they're queued for classification." },
        { title: 'Select a purpose', desc: 'Pick from the 10-category grid: Job Site, Tool Run, Client Meeting, etc.' },
        { title: 'Add notes if needed', desc: 'Optional notes (e.g. client name, address) strengthen your ATO record.' },
        { title: 'Step through all trips', desc: 'Each business trip is shown one at a time. Tap Next to continue.' },
      ],
      tip: 'Be specific. "Job Site — 14 Smith St Fitzroy" is far better than just "work".',
    },
    {
      id: 'review',
      label: 'Reviewing Your Logbook',
      icon: MapPin,
      screen: 'review',
      color: '#4ade80',
      intro: "Review is where you check everything before saving a report. See all trips in a list or calendar, fix errors, and check for gaps.",
      steps: [
        { title: 'Check the list view', desc: 'All trips appear in date order. Business trips are highlighted in yellow.' },
        { title: 'Look for GAP markers', desc: 'Amber dashed cards indicate geographic gaps where a connector trip may be missing.' },
        { title: 'Reclassify if needed', desc: 'Tap any trip to edit its type, purpose or notes before finalising.' },
        { title: 'Switch to calendar view', desc: 'The calendar view shows which days have trips recorded — check for missing days.' },
      ],
      tip: 'Review weekly, not just at the end of 12 weeks.',
    },
    {
      id: 'odometer',
      label: 'Odometer Verification',
      icon: Car,
      screen: 'odometer',
      color: '#f472b6',
      intro: "The ATO requires odometer readings at the start and end of your logbook period. The Odometer screen helps you verify and evidence these.",
      steps: [
        { title: 'Record start odometer', desc: 'Enter the exact km reading from your dashboard at the start of your 12-week period.' },
        { title: 'Verify per-trip readings', desc: 'For each trip, the app calculates expected start/end km. Confirm or adjust.' },
        { title: 'Add photo evidence', desc: 'Take a photo of your odometer — this significantly strengthens your audit trail.' },
        { title: 'Check your audit score', desc: 'The Odometer screen contributes 35% to your overall Audit Score.' },
      ],
      tip: 'A photo of your odometer at the start and end of the period is your strongest evidence.',
    },
    {
      id: 'expenses',
      label: 'Tracking Expenses',
      icon: Receipt,
      screen: 'expenses',
      color: '#34d399',
      intro: "Log all vehicle running costs to maximise your deduction. The Expenses screen organises them into ATO-recognised categories.",
      steps: [
        { title: 'Add each expense', desc: 'Tap the + button to add fuel, servicing, insurance, registration, loan interest and more.' },
        { title: 'Assign the category', desc: "Choose from ATO's ordered categories. The app keeps a running total per category." },
        { title: 'Check the Report tab', desc: 'The Report tab shows your total expenses in ATO order — ready to copy to your tax return.' },
        { title: 'Include depreciation', desc: "Add your vehicle's purchase price and date in Account → Vehicle to calculate depreciation automatically." },
      ],
      tip: 'Keep digital receipts or photos. The ATO can ask for evidence of all claimed expenses.',
    },
    {
      id: 'export',
      label: 'Exporting Reports',
      icon: Download,
      screen: 'reports',
      color: '#a78bfa',
      intro: "When you're ready to save a period or send to your accountant, generate an ATO-ready PDF or CSV export.",
      steps: [
        { title: 'Finish your session', desc: 'Complete sorting, classifying and review for your current period.' },
        { title: 'Navigate to Reports', desc: 'Tap Documents in the bottom nav, then Reports.' },
        { title: 'Generate the report', desc: "Tap 'Save Report' to create a session summary with all trip data and deduction estimate." },
        { title: 'Export as PDF or CSV', desc: 'Tap Export to download or share the report. PDF is best for accountants; CSV for spreadsheets.' },
      ],
      tip: 'Generate a report at the end of each 4-week block, not just at 12 weeks.',
    },
  ];

  return (
    <div className="flex flex-col gap-[12px]">
      <SectionHeader
        label="Workflows"
        title="How to Complete Each Section"
        subtitle="Step-by-step guides for every part of the app"
      />

      {sections.map(section => {
        const isOpen = openSection === section.id;
        return (
          <div
            key={section.id}
            className="rounded-[14px] overflow-hidden"
            style={{ border: isOpen ? `1.5px solid ${section.color}50` : '1px solid var(--wc-border)', background: 'var(--wc-card)' }}
          >
            <button
              className="w-full flex items-center gap-[12px] p-[12px_14px] text-left transition-all active:scale-[.99]"
              onClick={() => setOpenSection(isOpen ? null : section.id)}
            >
              <div
                className="w-[36px] h-[36px] rounded-[11px] flex items-center justify-center flex-shrink-0"
                style={{ background: isOpen ? `${section.color}20` : 'rgb(var(--wc-ink) / .05)', border: `1px solid ${isOpen ? section.color + '50' : 'var(--wc-border)'}` }}
              >
                <section.icon className="w-[15px] h-[15px]" style={{ color: isOpen ? section.color : 'var(--wc-t2)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-heading font-bold text-[12px]" style={{ color: 'var(--wc-text)' }}>{section.label}</div>
                <div className="text-[10px]" style={{ color: 'var(--wc-t3)' }}>{section.steps.length} steps</div>
              </div>
              <div
                className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-200"
                style={{ background: 'rgb(var(--wc-ink) / .05)', transform: isOpen ? 'rotate(90deg)' : 'none' }}
              >
                <ChevronRight className="w-[11px] h-[11px]" style={{ color: 'var(--wc-t3)' }} />
              </div>
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <div className="px-[14px] pb-[14px]" style={{ borderTop: '1px solid var(--wc-border)' }}>
                    <div className="pt-[10px] text-[10px] leading-[1.55] mb-[10px]" style={{ color: 'var(--wc-t2)' }}>{section.intro}</div>

                    <div className="flex flex-col gap-[5px] mb-[10px]">
                      {section.steps.map((s, i) => (
                        <div key={s.title} className="flex gap-[10px]">
                          <div className="flex flex-col items-center flex-shrink-0">
                            <div
                              className="w-[22px] h-[22px] rounded-full flex items-center justify-center"
                              style={{ background: `${section.color}20`, border: `1px solid ${section.color}50` }}
                            >
                              <span className="font-heading font-black text-[9px]" style={{ color: section.color }}>{i + 1}</span>
                            </div>
                            {i < section.steps.length - 1 && (
                              <div className="w-[1px] flex-1 min-h-[8px]" style={{ background: `${section.color}25`, marginTop: 2 }} />
                            )}
                          </div>
                          <div className="pb-[6px]">
                            <div className="font-heading font-bold text-[11px] leading-tight mb-[1px]" style={{ color: 'var(--wc-text)' }}>{s.title}</div>
                            <div className="text-[10px] leading-[1.45]" style={{ color: 'var(--wc-t3)' }}>{s.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-[9px] p-[8px_10px] mb-[10px]" style={{ background: 'rgba(245,196,0,.07)', border: '1px solid rgba(245,196,0,.2)' }}>
                      <div className="flex items-start gap-[5px]">
                        <Star className="w-[10px] h-[10px] flex-shrink-0 mt-[1px]" style={{ color: 'var(--wc-y)' }} />
                        <div className="text-[10px] leading-[1.45]" style={{ color: 'var(--wc-t2)' }}><span className="font-heading font-bold" style={{ color: 'var(--wc-y)' }}>Pro tip: </span>{section.tip}</div>
                      </div>
                    </div>

                    <button
                      className="w-full rounded-[10px] py-[9px] flex items-center justify-center gap-[6px] font-heading font-bold text-[11px] uppercase tracking-[.05em] transition-all active:scale-[.97]"
                      style={{ background: `${section.color}18`, color: section.color, border: `1px solid ${section.color}40` }}
                      onClick={() => onNavigate(section.screen)}
                    >
                      Try it now
                      <ChevronRight className="w-[12px] h-[12px]" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Guide Screen ─────────────────────────────────────────
export function GuideScreen() {
  const { dispatch } = useApp();
  const [tab, setTab] = useState<Tab>('rules');

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'rules', label: 'Rules', icon: Shield },
    { id: 'methods', label: 'Methods', icon: Bluetooth },
    { id: 'features', label: 'Features', icon: Star },
    { id: 'howto', label: 'How-To', icon: BookOpen },
  ];

  function handleNavigate(screen: Screen) {
    dispatch({ type: 'GO_SCREEN', screen });
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--wc-bg)' }}>
      {/* Header */}
      <div className="flex-shrink-0 px-[16px] pt-[6px] pb-[10px]" style={{ borderBottom: '1px solid var(--wc-border)' }}>
        <div className="flex items-center justify-between mb-[10px]">
          <div>
            <div className="font-heading font-black text-[17px] uppercase tracking-[.03em]" style={{ color: 'var(--wc-text)' }}>Guide</div>
            <div className="text-[10px]" style={{ color: 'var(--wc-t3)' }}>Logbook rules, methods & workflows</div>
          </div>
          <button
            className="flex items-center gap-[5px] px-[10px] py-[5px] rounded-full text-[10px] font-heading font-bold uppercase tracking-[.05em] transition-all active:scale-[.95]"
            style={{ background: 'rgb(var(--wc-ink) / .06)', color: 'var(--wc-t2)', border: '1px solid var(--wc-border)' }}
            onClick={() => dispatch({ type: 'GO_SCREEN', screen: 'dashboard' })}
          >
            <ChevronLeft className="w-[10px] h-[10px]" />
            Back
          </button>
        </div>

        {/* Tab bar */}
        <div className="grid grid-cols-4 gap-[4px] rounded-[12px] p-[3px]" style={{ background: 'rgb(var(--wc-ink) / .05)' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              className="flex flex-col items-center gap-[2px] rounded-[9px] py-[6px] transition-all active:scale-[.95]"
              style={{
                background: tab === t.id ? 'var(--wc-card)' : 'transparent',
                boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,.12)' : 'none',
              }}
              onClick={() => setTab(t.id)}
            >
              <t.icon className="w-[12px] h-[12px]" style={{ color: tab === t.id ? 'var(--wc-y)' : 'var(--wc-t3)' }} />
              <span className="font-heading font-bold text-[8px] uppercase tracking-[.05em]" style={{ color: tab === t.id ? 'var(--wc-text)' : 'var(--wc-t3)' }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="px-[16px] py-[14px]"
          >
            {tab === 'rules' && <TabRules />}
            {tab === 'methods' && <TabMethods />}
            {tab === 'features' && <TabFeatures />}
            {tab === 'howto' && <TabHowTo onNavigate={handleNavigate} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
