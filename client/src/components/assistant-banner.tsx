import { useState, useEffect, useRef } from 'react';
import { HelpCircle, X, Volume2, VolumeX, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { getAssistantMode, screenGuides, type ScreenGuide } from '@/lib/assistant-mode';
import type { Screen } from '@/lib/app-context';

const AUTO_SHOW_KEY = 'wc_assist_autoshow';
const INTRO_SEEN_KEY = 'wc_assist_intro_seen';

function getAutoShow(): boolean {
  return localStorage.getItem(AUTO_SHOW_KEY) !== '0';
}

function setAutoShow(on: boolean) {
  localStorage.setItem(AUTO_SHOW_KEY, on ? '1' : '0');
}

function getIntroSeen(): boolean {
  return localStorage.getItem(INTRO_SEEN_KEY) === '1';
}

export function AssistantBanner({ screen }: { screen: Screen }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [autoShow, setAutoShowState] = useState(() => getAutoShow());
  const [fromTab, setFromTab] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const isOn = getAssistantMode();
    setVisible(isOn);
    setSpeaking(false);
    setClosing(false);
    setFromTab(false);
    window.speechSynthesis?.cancel();
    if (isOn && getAutoShow()) {
      setDismissed(false);
    } else if (isOn && !getAutoShow()) {
      setDismissed(true);
    }
  }, [screen]);

  useEffect(() => {
    const handler = (e: Event) => {
      const on = (e as CustomEvent).detail;
      setVisible(on);
      if (!on) {
        window.speechSynthesis?.cancel();
        setSpeaking(false);
        setShowIntro(false);
      } else {
        setDismissed(!getAutoShow());
        setFromTab(false);
        setClosing(false);
        // Show intro explanation the first time assistant mode is turned on
        if (!getIntroSeen()) {
          setShowIntro(true);
          localStorage.setItem(INTRO_SEEN_KEY, '1');
        }
      }
    };
    window.addEventListener('wc-assistant-changed', handler);
    return () => {
      window.removeEventListener('wc-assistant-changed', handler);
      window.speechSynthesis?.cancel();
    };
  }, []);

  const guide: ScreenGuide | undefined = screenGuides[screen];

  if (!visible) return null;
  if (!guide) return null;

  const handleSpeak = () => {
    if (!window.speechSynthesis) return;

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const text = `${guide.title}. ${guide.description} ${guide.tip}`;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.95;
    utter.pitch = 1;
    utter.lang = 'en-AU';

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find(v => (v.lang.includes('en-AU') || v.lang.includes('en-GB')) && /female|fiona|karen|kate|samantha|zira|hazel|susan/i.test(v.name)) ||
      voices.find(v => v.lang.includes('en-AU')) ||
      voices.find(v => v.lang.includes('en-GB'));
    if (preferredVoice) utter.voice = preferredVoice;

    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    utteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
    setSpeaking(true);
  };

  const handleDismiss = () => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setShowIntro(false);
    setClosing(true);
    setTimeout(() => {
      setDismissed(true);
      setClosing(false);
    }, 200);
  };

  const handleOpenFromTab = () => {
    setFromTab(true);
    setDismissed(false);
    setClosing(false);
  };

  const toggleAutoShow = () => {
    const next = !autoShow;
    setAutoShowState(next);
    setAutoShow(next);
    if (!next) handleDismiss();
  };

  // Collapsed tab shown on right edge when dismissed
  if (dismissed) {
    return (
      <button
        className="fixed z-[80] flex items-center justify-center cursor-pointer transition-all active:scale-[.9]"
        style={{
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: '28px',
          height: '48px',
          borderRadius: '10px 0 0 10px',
          background: 'rgb(var(--wc-ink) / .12)',
          border: '1.5px solid rgb(var(--wc-ink) / .25)',
          borderRight: 'none',
          boxShadow: '-2px 0 10px rgba(0,0,0,.15)',
        }}
        onClick={handleOpenFromTab}
        data-testid="button-reopen-assistant"
        title="Reopen assistant"
      >
        <HelpCircle className="w-[16px] h-[16px]" style={{ color: 'var(--wc-y)' }} />
      </button>
    );
  }

  const expandFromRight = fromTab || closing;

  return (
    <div
      className="fixed z-[85]"
      style={{
        top: '52px',
        right: '16px',
        left: '16px',
        maxWidth: '360px',
        marginLeft: 'auto',
        marginRight: 'auto',
        transformOrigin: expandFromRight ? 'top right' : 'top center',
        animation: closing
          ? 'assist-collapse .2s ease-in forwards'
          : fromTab
            ? 'assist-expand .25s cubic-bezier(.34,1.56,.64,1) forwards'
            : 'pop-scale .5s cubic-bezier(.34,1.56,.64,1)',
      }}
    >
      <div
        className="rounded-[14px] overflow-hidden"
        style={{
          background: 'var(--wc-card)',
          border: '1.5px solid rgb(var(--wc-ink) / .25)',
          boxShadow: '0 8px 32px rgba(0,0,0,.4), 0 0 0 1px rgba(0,0,0,.1)',
          backdropFilter: 'blur(12px)',
        }}
        data-testid="assistant-banner"
      >
        {/* Main content row */}
        <div className="flex gap-[10px] items-start p-[14px_14px_10px]">
          <div
            className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center flex-shrink-0 mt-[1px]"
            style={{ background: 'rgb(var(--wc-ink) / .1)', border: '1px solid rgb(var(--wc-ink) / .2)' }}
          >
            <HelpCircle className="w-[15px] h-[15px]" style={{ color: 'var(--wc-y)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-heading font-bold text-[11px] uppercase tracking-[.06em] mb-[3px]" style={{ color: 'var(--wc-text)' }}>
              {guide.title}
            </div>
            <div className="text-[11px] leading-[1.5] mb-[5px]" style={{ color: 'var(--wc-t2)' }}>
              {guide.description}
            </div>
            <div className="flex items-start gap-[5px]">
              <ChevronRight className="w-[10px] h-[10px] flex-shrink-0 mt-[1px]" style={{ color: 'var(--wc-y)' }} />
              <div className="text-[11px] leading-[1.4]" style={{ color: 'var(--wc-y)' }}>{guide.tip}</div>
            </div>
          </div>
          <button
            className="w-[26px] h-[26px] rounded-[8px] flex items-center justify-center flex-shrink-0 cursor-pointer transition-all active:scale-[.9]"
            style={{ background: 'rgb(var(--wc-ink) / .06)', border: '1px solid rgb(var(--wc-ink) / .1)' }}
            onClick={handleDismiss}
            data-testid="button-dismiss-assistant"
            title="Hide for this screen"
          >
            <X className="w-[12px] h-[12px]" style={{ color: 'var(--wc-t3)' }} />
          </button>
        </div>

        {/* First-time feature intro */}
        {showIntro && (
          <div className="mx-[14px] mb-[10px] rounded-[10px] p-[10px_12px]" style={{ background: 'rgba(245,196,0,.07)', border: '1px solid rgba(245,196,0,.2)' }}>
            <div className="font-heading font-bold text-[9px] uppercase tracking-[.08em] mb-[6px]" style={{ color: 'var(--wc-y)' }}>
              Assistant features
            </div>
            <div className="flex flex-col gap-[5px]">
              <div className="flex items-start gap-[7px]">
                <Volume2 className="w-[11px] h-[11px] flex-shrink-0 mt-[1px]" style={{ color: 'var(--wc-t2)' }} />
                <div className="text-[10px] leading-[1.4]" style={{ color: 'var(--wc-t2)' }}>
                  <span className="font-heading font-bold" style={{ color: 'var(--wc-text)' }}>Voice Read-Aloud — </span>
                  tap the speaker button to have this screen's tip read aloud in an Australian voice. Tap again to stop.
                </div>
              </div>
              <div className="flex items-start gap-[7px]">
                <Eye className="w-[11px] h-[11px] flex-shrink-0 mt-[1px]" style={{ color: 'var(--wc-t2)' }} />
                <div className="text-[10px] leading-[1.4]" style={{ color: 'var(--wc-t2)' }}>
                  <span className="font-heading font-bold" style={{ color: 'var(--wc-text)' }}>Auto-Show — </span>
                  controls whether this banner opens automatically on each screen. Turn it off to only see it when you tap the
                  {' '}<HelpCircle className="w-[9px] h-[9px] inline-block" style={{ color: 'var(--wc-y)', verticalAlign: 'middle' }} />{' '}
                  tab on the right edge.
                </div>
              </div>
              <div className="flex items-start gap-[7px]">
                <X className="w-[11px] h-[11px] flex-shrink-0 mt-[1px]" style={{ color: 'var(--wc-t2)' }} />
                <div className="text-[10px] leading-[1.4]" style={{ color: 'var(--wc-t2)' }}>
                  <span className="font-heading font-bold" style={{ color: 'var(--wc-text)' }}>Hide — </span>
                  closes this banner for the current screen. It reappears when you navigate to a new screen (if auto-show is on).
                </div>
              </div>
            </div>
            <button
              className="mt-[8px] text-[9px] font-heading font-bold uppercase tracking-[.06em] cursor-pointer transition-all active:scale-[.95]"
              style={{ color: 'var(--wc-t3)' }}
              onClick={() => setShowIntro(false)}
            >
              Got it — don't show again
            </button>
          </div>
        )}

        {/* Action buttons row */}
        <div
          className="flex items-stretch"
          style={{ borderTop: '1px solid rgb(var(--wc-ink) / .08)' }}
        >
          {/* Voice read-aloud */}
          <button
            className="flex-1 flex flex-col items-center justify-center gap-[3px] py-[9px] cursor-pointer transition-all active:scale-[.96]"
            style={{
              background: speaking ? 'rgba(245,196,0,.1)' : 'transparent',
              borderRight: '1px solid rgb(var(--wc-ink) / .08)',
            }}
            onClick={handleSpeak}
            data-testid="button-speak-assistant"
          >
            {speaking
              ? <VolumeX className="w-[15px] h-[15px]" style={{ color: 'var(--wc-y)' }} />
              : <Volume2 className="w-[15px] h-[15px]" style={{ color: 'var(--wc-t2)' }} />
            }
            <span
              className="font-heading font-bold text-[8px] uppercase tracking-[.06em]"
              style={{ color: speaking ? 'var(--wc-y)' : 'var(--wc-t3)' }}
            >
              {speaking ? 'Stop' : 'Read Aloud'}
            </span>
          </button>

          {/* Auto-show toggle */}
          <button
            className="flex-1 flex flex-col items-center justify-center gap-[3px] py-[9px] cursor-pointer transition-all active:scale-[.96]"
            style={{
              background: !autoShow ? 'rgba(var(--wc-ink) / .06)' : 'transparent',
              borderRight: '1px solid rgb(var(--wc-ink) / .08)',
            }}
            onClick={toggleAutoShow}
            data-testid="button-toggle-autoshow"
          >
            {autoShow
              ? <Eye className="w-[15px] h-[15px]" style={{ color: 'var(--wc-t2)' }} />
              : <EyeOff className="w-[15px] h-[15px]" style={{ color: 'var(--wc-t3)' }} />
            }
            <span
              className="font-heading font-bold text-[8px] uppercase tracking-[.06em]"
              style={{ color: autoShow ? 'var(--wc-t3)' : 'var(--wc-t3)' }}
            >
              {autoShow ? 'Auto-Show On' : 'Auto-Show Off'}
            </span>
          </button>

          {/* Hide / close */}
          <button
            className="flex-1 flex flex-col items-center justify-center gap-[3px] py-[9px] cursor-pointer transition-all active:scale-[.96]"
            style={{ background: 'transparent' }}
            onClick={handleDismiss}
            data-testid="button-dismiss-assistant-footer"
          >
            <X className="w-[15px] h-[15px]" style={{ color: 'var(--wc-t3)' }} />
            <span className="font-heading font-bold text-[8px] uppercase tracking-[.06em]" style={{ color: 'var(--wc-t3)' }}>
              Hide
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
