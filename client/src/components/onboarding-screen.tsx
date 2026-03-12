import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bluetooth, Navigation, BookOpen, ChevronRight, X, Check,
  FileText, Download, ArrowRight, MapPin, RotateCcw, Calendar,
  AlertTriangle, Clock, Shield, Wrench, Car, Star,
} from 'lucide-react';
import { useApp } from '@/lib/app-context';

type Method = 'gps' | 'hybrid' | 'basic';

function complete(dispatch: ReturnType<typeof useApp>['dispatch'], method: Method) {
  try {
    const s = JSON.parse(localStorage.getItem('wc_settings') || '{}');
    localStorage.setItem('wc_settings', JSON.stringify({ ...s, logbookStream: method }));
  } catch {}
  localStorage.setItem('wc_onboarded', '1');
  dispatch({ type: 'GO_SCREEN', screen: 'dashboard' });
}

function skip(dispatch: ReturnType<typeof useApp>['dispatch']) {
  localStorage.setItem('wc_onboarded', '1');
  dispatch({ type: 'GO_SCREEN', screen: 'dashboard' });
}

// ── Step indicators ───────────────────────────────────────────
function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-[6px]">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-300"
          style={{
            width: i === step ? 18 : 6,
            height: 6,
            background: i === step ? 'var(--wc-y)' : 'rgb(var(--wc-ink) / .2)',
          }}
        />
      ))}
    </div>
  );
}

// ── Step 0: ATO Logbook Rules ─────────────────────────────────
function StepRules({ onNext }: { onNext: () => void }) {
  const rules = [
    {
      icon: Calendar,
      title: '12 Consecutive Weeks',
      body: 'Your logbook must cover at least 12 continuous weeks of driving. This sample period establishes your business-use percentage.',
      color: 'var(--wc-y)',
    },
    {
      icon: Shield,
      title: '5-Year Validity',
      body: "A completed logbook is valid for 5 income years. You don't need to redo it every year unless your business use changes significantly.",
      color: '#4ade80',
    },
    {
      icon: FileText,
      title: 'Every Trip Must Be Recorded',
      body: 'The ATO requires every trip (business and personal) to be recorded with date, destination, purpose and kilometres.',
      color: '#60a5fa',
    },
    {
      icon: Wrench,
      title: 'Business Purpose Required',
      body: "Each business trip needs a clear purpose — e.g. Job Site, Client Meeting, Tool Run. Commuting from home to a regular workplace doesn't count.",
      color: '#f472b6',
    },
    {
      icon: Car,
      title: 'Logbook Method = Bigger Deductions',
      body: 'The ATO Logbook Method lets you claim your actual vehicle running costs multiplied by your business-use percentage — typically higher than the cents-per-km method.',
      color: '#a78bfa',
    },
  ];

  return (
    <div className="px-[20px] pb-[24px]">
      <div className="pt-[4px] pb-[14px]">
        <div className="inline-flex items-center gap-[6px] px-[10px] py-[4px] rounded-full mb-[10px]" style={{ background: 'rgba(245,196,0,.12)', border: '1px solid rgba(245,196,0,.3)' }}>
          <Shield className="w-[10px] h-[10px]" style={{ color: 'var(--wc-y)' }} />
          <span className="font-heading font-bold text-[9px] uppercase tracking-[.08em]" style={{ color: 'var(--wc-y)' }}>ATO Requirements</span>
        </div>
        <div className="font-heading font-black text-[22px] uppercase leading-tight tracking-[.02em]" style={{ color: 'var(--wc-text)' }}>
          Australian Logbook Rules
        </div>
        <div className="text-[12px] mt-[4px] leading-[1.5]" style={{ color: 'var(--wc-t2)' }}>
          What the ATO requires to claim vehicle deductions
        </div>
      </div>

      <div className="flex flex-col gap-[8px] mb-[12px]">
        {rules.map((r, i) => (
          <motion.div
            key={r.title}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex gap-[12px] rounded-[14px] p-[12px_14px]"
            style={{ background: 'var(--wc-card)', border: '1px solid var(--wc-border)' }}
          >
            <div
              className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center flex-shrink-0 mt-[1px]"
              style={{ background: `${r.color}18`, border: `1px solid ${r.color}40` }}
            >
              <r.icon className="w-[15px] h-[15px]" style={{ color: r.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-heading font-bold text-[12px] leading-tight mb-[3px]" style={{ color: 'var(--wc-text)' }}>{r.title}</div>
              <div className="text-[10px] leading-[1.5]" style={{ color: 'var(--wc-t3)' }}>{r.body}</div>
            </div>
          </motion.div>
        ))}

        <div className="rounded-[14px] p-[12px_14px]" style={{ background: 'rgba(245,196,0,.08)', border: '1px solid rgba(245,196,0,.25)' }}>
          <div className="flex items-center gap-[8px] mb-[4px]">
            <AlertTriangle className="w-[12px] h-[12px] flex-shrink-0" style={{ color: 'var(--wc-y)' }} />
            <span className="font-heading font-bold text-[10px] uppercase tracking-[.06em]" style={{ color: 'var(--wc-y)' }}>Smart Logbook handles all of this</span>
          </div>
          <div className="text-[10px] leading-[1.5]" style={{ color: 'var(--wc-t2)' }}>
            This app records every trip, tracks your 12-week period, assigns business purposes and generates an ATO-ready export — automatically or manually, depending on your chosen method.
          </div>
        </div>
      </div>

      <button
        className="w-full rounded-[14px] py-[14px] flex items-center justify-center gap-[8px] font-heading font-extrabold text-[14px] uppercase tracking-[.06em] transition-all active:scale-[.97]"
        style={{ background: 'var(--wc-y)', color: 'var(--wc-bg)' }}
        onClick={onNext}
      >
        Choose Your Method
        <ChevronRight className="w-[16px] h-[16px]" />
      </button>
    </div>
  );
}

// ── Step 1: Method Selector ───────────────────────────────────
function EffortDots({ level, max = 5 }: { level: number; max?: number }) {
  return (
    <div className="flex gap-[3px]">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className="w-[6px] h-[6px] rounded-full"
          style={{ background: i < level ? 'var(--wc-y)' : 'rgb(var(--wc-ink) / .15)' }}
        />
      ))}
    </div>
  );
}

function StepMethod({ selected, onSelect, onNext }: { selected: Method | null; onSelect: (m: Method) => void; onNext: () => void }) {
  const methods: {
    id: Method;
    label: string;
    desc: string;
    Icon: React.ElementType;
    effort: number;
    effortLabel: string;
    features: string[];
  }[] = [
    {
      id: 'gps',
      label: 'GPS Device',
      desc: 'Bluetooth GPS tracker records every trip automatically',
      Icon: Bluetooth,
      effort: 1,
      effortLabel: 'Minimal input',
      features: ['Auto-sync via Bluetooth', 'Zero manual entry', 'Highest accuracy'],
    },
    {
      id: 'hybrid',
      label: 'Phone GPS',
      desc: "Uses your phone's location to record trips automatically",
      Icon: Navigation,
      effort: 2,
      effortLabel: 'Low input',
      features: ['Auto-track in background', 'Tap to start/stop', 'No extra hardware'],
    },
    {
      id: 'basic',
      label: 'Manual Entry',
      desc: 'Add trips yourself — great for simple or low-volume use',
      Icon: BookOpen,
      effort: 4,
      effortLabel: 'More input required',
      features: ['Add trips by form', 'Recurring trip templates', 'Full control'],
    },
  ];

  return (
    <div className="px-[20px] pb-[24px]">
      <div className="pt-[4px] pb-[14px]">
        <div className="inline-flex items-center gap-[6px] px-[10px] py-[4px] rounded-full mb-[10px]" style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid var(--wc-border)' }}>
          <Star className="w-[10px] h-[10px]" style={{ color: 'var(--wc-y)' }} />
          <span className="font-heading font-bold text-[9px] uppercase tracking-[.08em]" style={{ color: 'var(--wc-t2)' }}>Step 2 of 3</span>
        </div>
        <div className="font-heading font-black text-[22px] uppercase leading-tight tracking-[.02em]" style={{ color: 'var(--wc-text)' }}>
          Choose Your Method
        </div>
        <div className="text-[12px] mt-[4px] leading-[1.5]" style={{ color: 'var(--wc-t2)' }}>
          How do you want to record your trips? You can change this later in Settings.
        </div>
      </div>

      <div className="flex flex-col gap-[10px] mb-[16px]">
        {methods.map((m, i) => {
          const isSelected = selected === m.id;
          return (
            <motion.button
              key={m.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="w-full rounded-[16px] p-[14px_16px] text-left transition-all active:scale-[.98]"
              style={{
                background: isSelected ? 'rgba(245,196,0,.08)' : 'var(--wc-card)',
                border: isSelected ? '2px solid var(--wc-y)' : '1.5px solid var(--wc-border)',
              }}
              onClick={() => onSelect(m.id)}
            >
              <div className="flex items-start gap-[12px]">
                <div
                  className="w-[40px] h-[40px] rounded-[12px] flex items-center justify-center flex-shrink-0"
                  style={{
                    background: isSelected ? 'rgba(245,196,0,.15)' : 'rgb(var(--wc-ink) / .06)',
                    border: isSelected ? '1px solid rgba(245,196,0,.4)' : '1px solid var(--wc-border)',
                  }}
                >
                  <m.Icon className="w-[18px] h-[18px]" style={{ color: isSelected ? 'var(--wc-y)' : 'var(--wc-t2)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-[8px] mb-[2px]">
                    <div className="font-heading font-black text-[14px] uppercase tracking-[.02em]" style={{ color: 'var(--wc-text)' }}>{m.label}</div>
                    {isSelected && (
                      <div className="w-[20px] h-[20px] rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--wc-y)' }}>
                        <Check className="w-[11px] h-[11px]" style={{ color: 'var(--wc-bg)' }} />
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] leading-[1.4] mb-[8px]" style={{ color: 'var(--wc-t3)' }}>{m.desc}</div>
                  <div className="flex items-center gap-[8px] mb-[8px]">
                    <EffortDots level={m.effort} />
                    <span className="text-[9px] font-heading font-bold uppercase tracking-[.06em]" style={{ color: 'var(--wc-t3)' }}>{m.effortLabel}</span>
                  </div>
                  <div className="flex flex-wrap gap-[4px]">
                    {m.features.map(f => (
                      <span
                        key={f}
                        className="inline-flex items-center gap-[3px] px-[7px] py-[2px] rounded-full text-[9px] font-heading font-bold"
                        style={{
                          background: isSelected ? 'rgba(245,196,0,.12)' : 'rgb(var(--wc-ink) / .05)',
                          color: isSelected ? 'var(--wc-y)' : 'var(--wc-t3)',
                          border: isSelected ? '1px solid rgba(245,196,0,.25)' : '1px solid var(--wc-border)',
                        }}
                      >
                        <Check className="w-[7px] h-[7px]" />
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <button
        className="w-full rounded-[14px] py-[14px] flex items-center justify-center gap-[8px] font-heading font-extrabold text-[14px] uppercase tracking-[.06em] transition-all active:scale-[.97] disabled:opacity-40"
        style={{ background: selected ? 'var(--wc-y)' : 'rgb(var(--wc-ink) / .1)', color: selected ? 'var(--wc-bg)' : 'var(--wc-t3)' }}
        onClick={onNext}
        disabled={!selected}
      >
        See My Workflow
        <ChevronRight className="w-[16px] h-[16px]" />
      </button>
    </div>
  );
}

// ── Step 2: Method Walkthrough ────────────────────────────────
const methodWorkflows: Record<Method, { label: string; steps: { icon: React.ElementType; title: string; desc: string }[] }> = {
  gps: {
    label: 'GPS Device Workflow',
    steps: [
      { icon: Bluetooth, title: 'Pair Your GPS Device', desc: 'Connect your Bluetooth GPS tracker to the app via the GPS Device screen under Add Trip.' },
      { icon: Car, title: 'Drive Normally', desc: 'Your device records every trip automatically in the background. No app interaction needed while driving.' },
      { icon: RotateCcw, title: 'Sync Trips', desc: 'Open the app and tap Sync to pull all recorded trips from your GPS device into your logbook.' },
      { icon: ArrowRight, title: 'Sort Business / Personal', desc: 'Swipe each trip left or right to mark it as Business or Personal. Takes seconds per trip.' },
      { icon: FileText, title: 'Classify Business Trips', desc: "Assign a purpose to each business trip (Job Site, Client Meeting, Tool Run, etc.) so the ATO knows why you travelled." },
      { icon: Download, title: 'Export Your Report', desc: 'Generate an ATO-ready PDF or CSV logbook report at the end of each session or the full 12-week period.' },
    ],
  },
  hybrid: {
    label: 'Phone GPS Workflow',
    steps: [
      { icon: Navigation, title: 'Enable Location Access', desc: 'Allow Smart Logbook to access your location. Background tracking is recommended for automatic recording.' },
      { icon: Car, title: 'Trips Recorded Automatically', desc: 'The app detects when you start driving and records the trip in the background using your phone GPS.' },
      { icon: MapPin, title: 'Review Detected Trips', desc: 'New trips appear in your Sort queue automatically. Check the route and distance look correct before sorting.' },
      { icon: ArrowRight, title: 'Sort Business / Personal', desc: 'Swipe each trip to classify it. Business trips move forward for purpose assignment.' },
      { icon: FileText, title: 'Classify Business Trips', desc: "Pick the purpose for each business trip from the 10-category grid (Job Site, Tool Run, Quote, etc.)." },
      { icon: Download, title: 'Export Your Report', desc: 'Generate an ATO-ready PDF or CSV logbook. Your business-use percentage is calculated automatically.' },
    ],
  },
  basic: {
    label: 'Manual Entry Workflow',
    steps: [
      { icon: BookOpen, title: 'Add Each Trip Manually', desc: 'Tap the + button and use the Add Existing Trip form to enter date, from/to locations, distance and duration.' },
      { icon: RotateCcw, title: 'Use Recurring Templates', desc: 'Set up recurring trips for routes you drive regularly (e.g. home to main job site). Apply them in bulk across a date range.' },
      { icon: ArrowRight, title: 'Sort Business / Personal', desc: 'Once trips are entered, swipe through the Sort screen to mark each one Business or Personal.' },
      { icon: FileText, title: 'Classify Business Trips', desc: "Assign a purpose to each business trip. This is what the ATO needs to validate your deduction claim." },
      { icon: Clock, title: 'Verify Odometer Readings', desc: 'The Odometer screen helps you confirm start/end km readings match your actual vehicle odometer.' },
      { icon: Download, title: 'Export Your Report', desc: 'Generate your ATO-ready report as a PDF or CSV. Share it directly with your accountant.' },
    ],
  },
};

function StepWalkthrough({ method, onComplete }: { method: Method; onComplete: () => void }) {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const flow = methodWorkflows[method];

  const methodMeta: Record<Method, { Icon: React.ElementType; color: string }> = {
    gps: { Icon: Bluetooth, color: '#60a5fa' },
    hybrid: { Icon: Navigation, color: '#4ade80' },
    basic: { Icon: BookOpen, color: 'var(--wc-y)' },
  };
  const meta = methodMeta[method];

  return (
    <div className="px-[20px] pb-[24px]">
      <div className="pt-[4px] pb-[14px]">
        <div className="inline-flex items-center gap-[6px] px-[10px] py-[4px] rounded-full mb-[10px]" style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}40` }}>
          <meta.Icon className="w-[10px] h-[10px]" style={{ color: meta.color }} />
          <span className="font-heading font-bold text-[9px] uppercase tracking-[.08em]" style={{ color: meta.color }}>{flow.label}</span>
        </div>
        <div className="font-heading font-black text-[22px] uppercase leading-tight tracking-[.02em]" style={{ color: 'var(--wc-text)' }}>
          Your Step-by-Step Workflow
        </div>
        <div className="text-[12px] mt-[4px] leading-[1.5]" style={{ color: 'var(--wc-t2)' }}>
          Tap any step to learn more. This is exactly how you will use the app.
        </div>
      </div>

      <div className="flex flex-col gap-[6px] mb-[14px]">
        {flow.steps.map((s, i) => {
          const isOpen = activeStep === i;
          return (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <button
                className="w-full rounded-[12px] text-left transition-all active:scale-[.98]"
                style={{
                  background: isOpen ? 'rgba(245,196,0,.07)' : 'var(--wc-card)',
                  border: isOpen ? '1px solid rgba(245,196,0,.3)' : '1px solid var(--wc-border)',
                }}
                onClick={() => setActiveStep(isOpen ? null : i)}
              >
                <div className="flex items-center gap-[12px] p-[10px_14px]">
                  <div
                    className="w-[36px] h-[36px] rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: isOpen ? 'var(--wc-y)' : 'var(--wc-card)',
                      border: isOpen ? '2px solid var(--wc-y)' : '2px solid rgb(var(--wc-ink) / .15)',
                    }}
                  >
                    <s.icon className="w-[14px] h-[14px]" style={{ color: isOpen ? 'var(--wc-bg)' : 'var(--wc-t2)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-data text-[9px] mb-[1px]" style={{ color: 'var(--wc-t3)' }}>Step {i + 1}</div>
                    <div className="font-heading font-bold text-[12px] leading-tight" style={{ color: 'var(--wc-text)' }}>{s.title}</div>
                  </div>
                  <div
                    className="w-[20px] h-[20px] rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-200"
                    style={{
                      background: 'rgb(var(--wc-ink) / .06)',
                      transform: isOpen ? 'rotate(90deg)' : 'none',
                    }}
                  >
                    <ChevronRight className="w-[10px] h-[10px]" style={{ color: 'var(--wc-t3)' }} />
                  </div>
                </div>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-[14px] pb-[12px] pl-[62px]">
                        <div className="text-[11px] leading-[1.55]" style={{ color: 'var(--wc-t2)' }}>{s.desc}</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          );
        })}
      </div>

      <div className="rounded-[14px] p-[12px_14px] mb-[16px]" style={{ background: 'rgba(245,196,0,.07)', border: '1px solid rgba(245,196,0,.2)' }}>
        <div className="flex items-center gap-[6px] mb-[4px]">
          <Check className="w-[11px] h-[11px]" style={{ color: 'var(--wc-y)' }} />
          <span className="font-heading font-bold text-[10px] uppercase tracking-[.06em]" style={{ color: 'var(--wc-y)' }}>You're ready to go</span>
        </div>
        <div className="text-[10px] leading-[1.5]" style={{ color: 'var(--wc-t2)' }}>
          The Guide is always available from the dashboard if you need a refresher on any section.
        </div>
      </div>

      <button
        className="w-full rounded-[14px] py-[14px] flex items-center justify-center gap-[8px] font-heading font-extrabold text-[14px] uppercase tracking-[.06em] transition-all active:scale-[.97]"
        style={{ background: 'var(--wc-y)', color: 'var(--wc-bg)' }}
        onClick={onComplete}
      >
        Get Started
        <ChevronRight className="w-[16px] h-[16px]" />
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export function OnboardingScreen() {
  const { dispatch } = useApp();
  const [step, setStep] = useState(0);
  const [method, setMethod] = useState<Method | null>(null);

  const handleSkip = useCallback(() => skip(dispatch), [dispatch]);
  const handleComplete = useCallback(() => {
    complete(dispatch, method ?? 'hybrid');
  }, [dispatch, method]);

  const stepCount = 3;

  return (
    <div className="flex flex-col" style={{ background: 'var(--wc-bg)', minHeight: '100%' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-[20px] pt-[12px] pb-[8px]">
        <StepDots step={step} total={stepCount} />
        <button
          className="flex items-center gap-[5px] px-[10px] py-[5px] rounded-full text-[11px] font-heading font-bold uppercase tracking-[.06em] transition-all active:scale-[.95]"
          style={{ background: 'rgb(var(--wc-ink) / .06)', color: 'var(--wc-t2)' }}
          onClick={handleSkip}
        >
          <X className="w-[10px] h-[10px]" />
          Skip
        </button>
      </div>

      {/* Steps */}
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="step-rules"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.22 }}
          >
            <StepRules onNext={() => setStep(1)} />
          </motion.div>
        )}
        {step === 1 && (
          <motion.div
            key="step-method"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.22 }}
          >
            <StepMethod
              selected={method}
              onSelect={setMethod}
              onNext={() => { if (method) setStep(2); }}
            />
          </motion.div>
        )}
        {step === 2 && method && (
          <motion.div
            key="step-walkthrough"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.22 }}
          >
            <StepWalkthrough method={method} onComplete={handleComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
