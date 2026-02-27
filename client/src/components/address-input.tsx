import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

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

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

async function fetchSuggestions(input: string): Promise<Prediction[]> {
  if (!API_KEY || input.length < 2) return [];
  try {
    const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
      },
      body: JSON.stringify({
        input,
        includedRegionCodes: ['au'],
        languageCode: 'en-AU',
      }),
    });
    if (!res.ok) {
      console.error('Places API error:', res.status, await res.text());
      return [];
    }
    const data = await res.json();
    return (data.suggestions || [])
      .filter((s: any) => s.placePrediction)
      .map((s: any) => ({
        description: s.placePrediction.text?.text || s.placePrediction.structuredFormat?.mainText?.text || '',
        placeId: s.placePrediction.placeId || '',
      }));
  } catch (err) {
    console.error('Places API fetch error:', err);
    return [];
  }
}

export function AddressInput({ value, onChange, placeholder, className, style, ...rest }: AddressInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }, []);

  const doSearch = useCallback((input: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (input.length < 2) { setPredictions([]); setShowDropdown(false); return; }
    debounceRef.current = setTimeout(async () => {
      const results = await fetchSuggestions(input);
      if (results.length > 0) {
        setPredictions(results);
        updatePosition();
        setShowDropdown(true);
        setActiveIdx(-1);
      } else {
        setPredictions([]);
        setShowDropdown(false);
      }
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
    inputRef.current?.blur();
  }, [onChange]);

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
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const dropdown = showDropdown && predictions.length > 0 ? createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-[99999] rounded-[10px] overflow-hidden"
      style={{
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: dropdownPos.width,
        background: '#1a1a1a',
        border: '1px solid rgba(255,255,255,.15)',
        boxShadow: '0 10px 40px rgba(0,0,0,.7)',
      }}
    >
      {predictions.map((p, i) => (
        <div
          key={p.placeId || i}
          className="px-3 py-2 cursor-pointer text-[12px] leading-[1.4]"
          style={{
            background: i === activeIdx ? 'rgba(245,196,0,.12)' : 'transparent',
            color: 'rgba(255,255,255,.85)',
            borderTop: i > 0 ? '1px solid rgba(255,255,255,.06)' : 'none',
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
