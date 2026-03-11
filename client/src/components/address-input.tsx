import { useEffect, useRef, useCallback, useId, useState } from 'react';

declare global {
  interface Window {
    google: any;
    _gmapsLoaded: boolean;
    _gmapsPromise: Promise<void> | null;
    _gmapsAuthFailed?: boolean;
  }
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

/** Reset Maps state so we can retry after auth failure */
export function resetGoogleMaps(): void {
  (window as any)._gmapsAuthFailed = false;
  (window as any)._gmapsLoaded = false;
  (window as any)._gmapsPromise = null;
  document.querySelectorAll('script[src*="maps.googleapis.com"]').forEach(s => s.remove());
  delete (window as any).google;
}

export function loadGoogleMaps(options?: { cacheBust?: boolean }): Promise<void> {
  if ((window as any)._gmapsAuthFailed) return Promise.reject(new Error('Maps auth failed'));
  if (window._gmapsLoaded) return Promise.resolve();
  if (window._gmapsPromise) return window._gmapsPromise;
  window._gmapsPromise = new Promise<void>((resolve, reject) => {
    if (!API_KEY) { reject(new Error('No API key')); return; }
    const callbackName = `__gmapsCallback_${Date.now()}`;
    (window as any)[callbackName] = () => {
      window._gmapsLoaded = true;
      delete (window as any)[callbackName];
      resolve();
    };
    const script = document.createElement('script');
    const cacheBust = options?.cacheBust ? `&_=${Date.now()}` : '';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places,geometry&callback=${callbackName}${cacheBust}`;
    script.async = true;
    script.onerror = () => {
      delete (window as any)[callbackName];
      reject(new Error('Failed to load Google Maps'));
    };
    document.head.appendChild(script);
  });
  return window._gmapsPromise;
}

export function preloadGoogleMaps(): void {
  loadGoogleMaps().catch(() => {});
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
  const autocompleteRef = useRef<any>(null);
  const instanceId = useId().replace(/:/g, '-');
  const [mapsFailed, setMapsFailed] = useState(() => !!(typeof window !== 'undefined' && (window as any)._gmapsAuthFailed));

  useEffect(() => {
    const onFail = () => setMapsFailed(true);
    window.addEventListener('gmaps-auth-failed', onFail);
    return () => window.removeEventListener('gmaps-auth-failed', onFail);
  }, []);

  const initAutocomplete = useCallback(() => {
    if (!inputRef.current || !window.google?.maps?.places?.Autocomplete) return;
    if (autocompleteRef.current) return;
    try {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'au' },
        types: ['geocode'],
      });
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        const addr = place?.formatted_address || place?.name || '';
        if (addr) onChange(addr);
      });
    } catch (e) {
      console.error('Failed to init Places Autocomplete:', e);
    }
  }, [onChange]);

  const handleRetryMaps = useCallback(() => {
    autocompleteRef.current = null;
    resetGoogleMaps();
    setMapsFailed(false);
    loadGoogleMaps({ cacheBust: true })
      .then(() => initAutocomplete())
      .catch(() => setMapsFailed(true));
  }, [initAutocomplete]);

  useEffect(() => {
    if (!API_KEY) {
      console.warn('AddressInput: VITE_GOOGLE_MAPS_API_KEY not set. Add it to .env for Places autocomplete.');
      return;
    }
    if ((window as any)._gmapsAuthFailed) return;
    loadGoogleMaps()
      .then(() => {
        if ((window as any)._gmapsAuthFailed) return;
        initAutocomplete();
      })
      .catch((err) => {
        console.warn('AddressInput: Google Maps failed to load:', err);
        setMapsFailed(true);
      });
  }, [initAutocomplete]);

  const handleFocus = useCallback(() => {
    if (!autocompleteRef.current && window._gmapsLoaded && !(window as any)._gmapsAuthFailed) {
      initAutocomplete();
    }
  }, [initAutocomplete]);

  useEffect(() => {
    if (!inputRef.current) return;
    if (inputRef.current.value !== value) {
      inputRef.current.value = value;
    }
  }, [value]);

  const handleBlur = useCallback(() => {
    const v = inputRef.current?.value?.trim() ?? '';
    if (v !== value) onChange(v);
  }, [value, onChange]);

  return (
    <div className="relative" style={{ flex: style?.flex }}>
      <input
        ref={inputRef}
        type="text"
        id={`address-input-${instanceId}`}
        className={className}
        style={{ ...style, flex: undefined, width: '100%' }}
        placeholder={placeholder}
        defaultValue={value}
        onFocus={handleFocus}
        onBlur={handleBlur}
        data-testid={rest['data-testid']}
        autoComplete="off"
      />
      {mapsFailed && (
        <div className="mt-1 flex items-center gap-2 flex-wrap">
          <span className="text-[10px]" style={{ color: 'var(--wc-t3)' }}>Address lookup unavailable.</span>
          <button
            type="button"
            className="text-[10px] font-semibold underline cursor-pointer"
            style={{ color: 'var(--wc-y)' }}
            onClick={handleRetryMaps}
            data-testid="retry-maps"
          >
            Retry
          </button>
          <span className="text-[10px]" style={{ color: 'var(--wc-t3)' }}>Or type address manually.</span>
        </div>
      )}
    </div>
  );
}
