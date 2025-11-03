let loaderPromise: Promise<void> | null = null;

export function loadGoogleMaps(apiKey?: string) {
  if (typeof window === 'undefined') return Promise.resolve();
  if ((window as any).google && (window as any).google.maps) return Promise.resolve();
  if (!loaderPromise) {
    loaderPromise = new Promise<void>((resolve, reject) => {
      const key = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!key) {
        console.warn('Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY');
        resolve();
        return;
      }
      const existing = document.querySelector('script[data-google-maps-loader="1"]') as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', (e) => reject(e));
        return;
      }
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.setAttribute('data-google-maps-loader', '1');
      script.onload = () => resolve();
      script.onerror = (e) => reject(e);
      document.head.appendChild(script);
    });
  }
  return loaderPromise;
}

