import { useEffect, useRef, useState, useCallback } from 'react';

declare global {
  interface Window {
    google: typeof google;
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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
  return loadPromise;
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
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [mapsReady, setMapsReady] = useState(window.googleMapsLoaded || false);
  const skipNextChange = useRef(false);

  useEffect(() => {
    loadGoogleMaps().then(() => setMapsReady(true)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!mapsReady || !inputRef.current || autocompleteRef.current) return;
    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'au' },
      fields: ['formatted_address', 'name'],
      types: ['geocode', 'establishment'],
    });
    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      if (place?.formatted_address) {
        skipNextChange.current = true;
        onChange(place.formatted_address);
      } else if (place?.name) {
        skipNextChange.current = true;
        onChange(place.name);
      }
    });
    autocompleteRef.current = ac;
  }, [mapsReady, onChange]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (skipNextChange.current) {
      skipNextChange.current = false;
      return;
    }
    onChange(e.target.value);
  }, [onChange]);

  return (
    <input
      ref={inputRef}
      className={className}
      style={style}
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      data-testid={rest['data-testid']}
    />
  );
}
