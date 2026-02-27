import { useEffect, useRef, useState, useCallback } from 'react';

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
    googleMapsLoaded: boolean;
  }
}

let loadPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (window.googleMapsLoaded) return Promise.resolve();
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve, reject) => {
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!key) { reject(new Error('No Google Maps API key')); return; }
    window.initGoogleMaps = () => { window.googleMapsLoaded = true; resolve(); };
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&loading=async&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
  return loadPromise;
}

interface Prediction {
  description: string;
  place_id: string;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const sessionTokenRef = useRef<any>(null);
  const serviceRef = useRef<any>(null);
  const [mapsReady, setMapsReady] = useState(window.googleMapsLoaded || false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadGoogleMaps().then(() => setMapsReady(true)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!mapsReady) return;
    try {
      serviceRef.current = new window.google.maps.places.AutocompleteService();
      sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
    } catch {}
  }, [mapsReady]);

  const fetchPredictions = useCallback((input: string) => {
    if (!serviceRef.current || input.length < 2) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }
    serviceRef.current.getPlacePredictions(
      {
        input,
        componentRestrictions: { country: 'au' },
        sessionToken: sessionTokenRef.current,
        types: ['geocode', 'establishment'],
      },
      (results: any[] | null, status: string) => {
        if (status === 'OK' && results) {
          setPredictions(results.map((r: any) => ({ description: r.description, place_id: r.place_id })));
          setShowDropdown(true);
          setActiveIdx(-1);
        } else {
          setPredictions([]);
          setShowDropdown(false);
        }
      }
    );
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPredictions(val), 250);
  }, [onChange, fetchPredictions]);

  const selectPrediction = useCallback((pred: Prediction) => {
    onChange(pred.description);
    setPredictions([]);
    setShowDropdown(false);
    sessionTokenRef.current = mapsReady ? new window.google.maps.places.AutocompleteSessionToken() : null;
    inputRef.current?.blur();
  }, [onChange, mapsReady]);

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
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative" style={{ flex: style?.flex }}>
      <input
        ref={inputRef}
        className={className}
        style={{ ...style, flex: undefined, width: '100%' }}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (predictions.length > 0) setShowDropdown(true); }}
        data-testid={rest['data-testid']}
        autoComplete="off"
      />
      {showDropdown && predictions.length > 0 && (
        <div
          className="absolute left-0 right-0 z-[10000] rounded-[10px] overflow-hidden mt-1"
          style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,.1)', boxShadow: '0 10px 40px rgba(0,0,0,.6)' }}
        >
          {predictions.map((p, i) => (
            <div
              key={p.place_id}
              className="px-3 py-2 cursor-pointer text-[12px] leading-[1.4] transition-colors"
              style={{
                background: i === activeIdx ? 'rgba(245,196,0,.08)' : 'transparent',
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
        </div>
      )}
    </div>
  );
}
