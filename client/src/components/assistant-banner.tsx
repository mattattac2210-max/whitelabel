import { useState, useEffect, useRef } from 'react';
import { HelpCircle, X, Volume2, VolumeX, Eye, EyeOff } from 'lucide-react';
import { getAssistantMode, screenGuides, type ScreenGuide } from '@/lib/assistant-mode';
import type { Screen } from '@/lib/app-context';

const AUTO_SHOW_KEY = 'wc_assist_autoshow';

function getAutoShow(): boolean {
  return localStorage.getItem(AUTO_SHOW_KEY) !== '0';
}

function setAutoShow(on: boolean) {
  localStorage.setItem(AUTO_SHOW_KEY, on ? '1' : '0');
}

export function AssistantBanner({ screen }: { screen: Screen }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [autoShow, setAutoShowState] = useState(() => getAutoShow());
  const [fromTab, setFromTab] = useState(false);
  const [closing, setClosing] = useState(false);
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
      } else {
        setDismissed(!getAutoShow());
        setFromTab(false);
        setClosing(false);
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
    const femaleVoice = voices.find(v => (v.lang.includes('en-AU') || v.lang.includes('en-GB')) && /female|fiona|karen|kate|samantha|zira|hazel|susan/i.test(v.name))
      || voices.find(v => v.lang.includes('en-AU'))
      || voices.find(v => v.lang.includes('en-GB'));
    if (femaleVoice) utter.voice = femaleVoice;

    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    utteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
    setSpeaking(true);
  };

  const handleDismiss = () => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
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
    if (!next) {
      handleDismiss();
    }
  };

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
        className="rounded-[14px] p-[14px_16px] flex gap-[10px] items-start"
        style={{
          background: 'var(--wc-card)',
          border: '1.5px solid rgb(var(--wc-ink) / .25)',
          boxShadow: '0 8px 32px rgba(0,0,0,.4), 0 0 0 1px rgba(0,0,0,.1)',
          backdropFilter: 'blur(12px)',
        }}
        data-testid="assistant-banner"
      >
        <div className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center flex-shrink-0 mt-[1px]" style={{ background: 'rgb(var(--wc-ink) / .1)', border: '1px solid rgb(var(--wc-ink) / .2)' }}>
          <HelpCircle className="w-[15px] h-[15px]" style={{ color: 'var(--wc-y)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-heading font-bold text-[11px] uppercase tracking-[.06em] mb-[3px]" style={{ color: 'var(--wc-text)' }}>{guide.title}</div>
          <div className="text-[12px] leading-[1.5] mb-[4px]" style={{ color: 'var(--wc-t2)' }}>{guide.description}</div>
          <div className="text-[11px] leading-[1.4]" style={{ color: 'var(--wc-y)' }}>{guide.tip}</div>
        </div>
        <div className="flex flex-col gap-[8px] flex-shrink-0">
          <button
            className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center cursor-pointer transition-all active:scale-[.9]"
            style={{
              background: speaking ? 'rgb(var(--wc-ink) / .2)' : 'rgb(var(--wc-ink) / .08)',
              border: speaking ? '1.5px solid rgb(var(--wc-ink) / .35)' : '1px solid rgb(var(--wc-ink) / .12)',
            }}
            onClick={handleSpeak}
            data-testid="button-speak-assistant"
          >
            {speaking
              ? <VolumeX className="w-[18px] h-[18px]" style={{ color: 'var(--wc-y)' }} />
              : <Volume2 className="w-[18px] h-[18px]" style={{ color: 'var(--wc-t2)' }} />
            }
          </button>
          <button
            className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center cursor-pointer transition-all active:scale-[.9]"
            style={{
              background: autoShow ? 'rgb(var(--wc-ink) / .08)' : 'rgb(var(--wc-ink) / .15)',
              border: autoShow ? '1px solid rgb(var(--wc-ink) / .12)' : '1.5px solid rgb(var(--wc-ink) / .3)',
            }}
            onClick={toggleAutoShow}
            data-testid="button-toggle-autoshow"
          >
            {autoShow
              ? <Eye className="w-[18px] h-[18px]" style={{ color: 'var(--wc-t2)' }} />
              : <EyeOff className="w-[18px] h-[18px]" style={{ color: 'var(--wc-am)' }} />
            }
          </button>
          <button
            className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center cursor-pointer transition-all active:scale-[.9]"
            style={{ background: 'rgb(var(--wc-ink) / .08)', border: '1px solid rgb(var(--wc-ink) / .12)' }}
            onClick={handleDismiss}
            data-testid="button-dismiss-assistant"
          >
            <X className="w-[16px] h-[16px]" style={{ color: 'var(--wc-t3)' }} />
          </button>
        </div>
      </div>
    </div>
  );
}
