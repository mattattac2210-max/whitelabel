import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

declare global {
  interface Window {
    google: any;
    _gmapsLoaded: boolean;
    _gmapsPromise: Promise<void> | null;
  }
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

function loadGoogleMaps(): Promise<void> {
  if (window._gmapsLoaded) return Promise.resolve();
  if (window._gmapsPromise) return window._gmapsPromise;
  window._gmapsPromise = new Promise<void>((resolve, reject) => {
    if (!API_KEY) { reject(new Error('No API key')); return; }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places,geometry`;
    script.async = true;
    script.onload = () => { window._gmapsLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
  return window._gmapsPromise;
}

interface Prediction {
  description: string;
  placeId: string;
}

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  'data-testid'?: string;
}

export function AddressInput({ value, onChange, placeholder, className, style, ...rest }: AddressInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const serviceRef = useRef<any>(null);
  const sessionRef = useRef<any>(null);
  const [ready, setReady] = useState(!!window._gmapsLoaded);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadGoogleMaps().then(() => setReady(true)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!ready || serviceRef.current) return;
    try {
      serviceRef.current = new window.google.maps.places.AutocompleteService();
      sessionRef.current = new window.google.maps.places.AutocompleteSessionToken();
    } catch (e) {
      console.error('Failed to init AutocompleteService:', e);
    }
  }, [ready]);

  const updatePosition = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }, []);

  const doSearch = useCallback((input: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!serviceRef.current || input.length < 2) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      serviceRef.current.getPlacePredictions(
        {
          input,
          componentRestrictions: { country: 'au' },
          sessionToken: sessionRef.current,
        },
        (results: any[] | null, status: string) => {
          if (status === 'OK' && results && results.length > 0) {
            setPredictions(results.map((r: any) => ({
              description: r.description,
              placeId: r.place_id,
            })));
            updatePosition();
            setShowDropdown(true);
            setActiveIdx(-1);
          } else {
            setPredictions([]);
            setShowDropdown(false);
          }
        }
      );
    }, 250);
  }, [updatePosition]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    doSearch(val);
  }, [onChange, doSearch]);

  const selectPrediction = useCallback((pred: Prediction) => {
    onChange(pred.description);
    setPredictions([]);
    setShowDropdown(false);
    if (ready) {
      try { sessionRef.current = new window.google.maps.places.AutocompleteSessionToken(); } catch {}
    }
  }, [onChange, ready]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showDropdown || predictions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => (i + 1) % predictions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => (i - 1 + predictions.length) % predictions.length);
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      selectPrediction(predictions[activeIdx]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  }, [showDropdown, predictions, activeIdx, selectPrediction]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) return;
      if (inputRef.current && inputRef.current.contains(e.target as Node)) return;
      setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const dropdown = showDropdown && predictions.length > 0 ? createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-[99999] rounded-[10px] overflow-hidden"
      style={{
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: dropdownPos.width,
        background: 'var(--wc-card)',
        border: '1px solid rgb(var(--wc-ink) / .15)',
        boxShadow: '0 10px 40px rgba(0,0,0,.7)',
      }}
    >
      {predictions.map((p, i) => (
        <div
          key={p.placeId || i}
          className="px-3 py-2 cursor-pointer text-[12px] leading-[1.4]"
          style={{
            background: i === activeIdx ? 'rgb(var(--wc-ink) / .12)' : 'transparent',
            color: 'rgb(var(--wc-ink) / .85)',
            borderTop: i > 0 ? '1px solid rgb(var(--wc-ink) / .06)' : 'none',
          }}
          onMouseEnter={() => setActiveIdx(i)}
          onMouseDown={(e) => { e.preventDefault(); selectPrediction(p); }}
          data-testid={`suggestion-${i}`}
        >
          {p.description}
        </div>
      ))}
    </div>,
    document.body
  ) : null;

  return (
    <div className="relative" style={{ flex: style?.flex }}>
      <input
        ref={inputRef}
        className={className}
        style={{ ...style, flex: undefined, width: '100%' }}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          updatePosition();
          if (predictions.length > 0) setShowDropdown(true);
        }}
        data-testid={rest['data-testid']}
        autoComplete="off"
      />
      {dropdown}
    </div>
  );
}
