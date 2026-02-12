import React, { useEffect, useMemo, useRef, useState } from 'react';

declare global {
  interface Window {
    juicebox?: any;
  }
}

const JUICEBOX_CSS = 'https://cdn.jsdelivr.net/npm/juicebox.js@2.5.1/dist/css/juicebox.css';
const JUICEBOX_JS = 'https://cdn.jsdelivr.net/npm/juicebox.js@2.5.1/dist/juicebox.min.js';

const loadJuiceboxOnce = (() => {
  let p: Promise<void> | null = null;
  return () => {
    if (typeof window === 'undefined') return Promise.resolve();
    if (window.juicebox) return Promise.resolve();
    if (p) return p;

    p = new Promise<void>((resolve, reject) => {
      // CSS
      const hasCss = Array.from(document.querySelectorAll('link[rel=\"stylesheet\"]')).some(
        (l) => (l as HTMLLinkElement).href === JUICEBOX_CSS
      );
      if (!hasCss) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = JUICEBOX_CSS;
        document.head.appendChild(link);
      }

      // JS
      const hasScript = Array.from(document.querySelectorAll('script')).some(
        (s) => (s as HTMLScriptElement).src === JUICEBOX_JS
      );
      if (hasScript) {
        // Script tag exists; just wait a tick for global to become available.
        requestAnimationFrame(() => (window.juicebox ? resolve() : reject(new Error('juicebox.js loaded but window.juicebox is undefined.'))));
        return;
      }

      const script = document.createElement('script');
      script.src = JUICEBOX_JS;
      script.async = true;
      script.onload = () => {
        if (window.juicebox) resolve();
        else reject(new Error('juicebox.js loaded but window.juicebox is undefined.'));
      };
      script.onerror = () => reject(new Error('Failed to load juicebox.js from CDN.'));
      document.head.appendChild(script);
    });

    return p;
  };
})();

interface JuiceboxBrowserProps {
  hicUrl: string | File | null;
  locus?: string;
  tracks?: any[];
  height?: number;
  // Publication-like minimal chrome by default. Set false if you want full UI.
  figureMode?: boolean;
}

export const JuiceboxBrowser: React.FC<JuiceboxBrowserProps> = ({
  hicUrl,
  locus,
  tracks = [],
  height = 520,
  figureMode = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const browserRef = useRef<any>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const stableTracks = useMemo(() => tracks, [tracks]);

  useEffect(() => {
    if (!containerRef.current) return;

    const el = containerRef.current;

    const measure = () => {
      // Keep this observer primarily to support post-init resizing.
      // We intentionally avoid re-initializing the browser on width changes.
      try {
        browserRef.current?.resize?.();
      } catch {
        // ignore
      }
    };

    // Kick an initial measurement (layout might settle a tick later).
    measure();
    const raf = requestAnimationFrame(measure);

    const ro = new ResizeObserver(measure);
    ro.observe(el);

    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cleanup = () => {
      try {
        // Prefer library cleanup if available.
        browserRef.current?.dispose?.();
        browserRef.current?.destroy?.();
        if (browserRef.current?.$root?.remove) {
          browserRef.current.$root.remove();
        } else {
          container.innerHTML = '';
        }
      } catch {
        container.innerHTML = '';
      } finally {
        browserRef.current = null;
      }
    };

    if (!hicUrl) {
      setLastError(null);
      cleanup();
      return;
    }

    let cancelled = false;

    (async () => {
      setLastError(null);
      cleanup();

      try {
        await loadJuiceboxOnce();
        if (!window.juicebox) throw new Error('juicebox.js is not loaded (window.juicebox is undefined).');

        const measuredWidth = Math.floor(container.getBoundingClientRect().width);
        if (!Number.isFinite(measuredWidth) || measuredWidth < 200) {
          // If the container is not measurable yet, retry on the next frame.
          await new Promise<void>((r) => requestAnimationFrame(() => r()));
        }

        const width = Math.max(200, Math.floor(container.getBoundingClientRect().width));

        const config: any = {
          width,
          height,
          figureMode,
          queryParametersSupported: false,
          showLocusGoto: !figureMode,
          showHicContactMapLabel: false,
          showChromosomeSelector: !figureMode,
          // "threshold,r,g,b" with alpha ramp. Matches the publication-style red heatmap feel.
          colorScale: '4,255,0,0',
        };

        const browser = await window.juicebox.createBrowser(container, config);
        if (cancelled) {
          try {
            browser?.$root?.remove?.();
          } catch {
            // ignore
          }
          return;
        }
        browserRef.current = browser;

        // Load dataset after init.
        // Note: juicebox.js distinguishes remote URLs vs local Files.
        // In practice `loadHicFile({ file })` is the most reliable path for local uploads.
        if (typeof hicUrl === 'string') {
          await browser.loadHicFile({ url: hicUrl });
        } else if (hicUrl instanceof File) {
          await browser.loadHicFile({ file: hicUrl, name: hicUrl.name });
        }

        // Navigate to locus after dataset load.
        if (locus) {
          try {
            await browser.goto(locus);
          } catch {
            // ignore invalid locus strings
          }
        }

        // Load tracks after browser is ready. Track loading failures shouldn't kill the matrix view.
        if (stableTracks?.length) {
          try {
            await browser.loadTracks(stableTracks);
          } catch (e) {
            console.error('[juicebox] loadTracks failed:', e);
          }
        }
      } catch (e: any) {
        console.error('[juicebox] createBrowser failed:', e);
        setLastError(e?.message ? String(e.message) : 'Unknown error while initializing juicebox.');
        cleanup(); // Remove any partially-initialized DOM the library may have added.
      }
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [hicUrl, height, figureMode, locus, stableTracks]);

  return (
    <div className="space-y-3">
      {lastError ? (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-sm">
          <div className="font-bold mb-1">Hi-C Heatmap 초기화 실패</div>
          <div className="font-mono whitespace-pre-wrap">{lastError}</div>
        </div>
      ) : null}

      <div className="relative w-full">
        {!hicUrl ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 text-slate-400 pointer-events-none">
            <p className="text-lg font-medium">데이터 로딩 대기 중...</p>
            <p className="text-sm">상단 패널에서 .hic 파일을 업로드해 주세요.</p>
          </div>
        ) : null}

        <div
          ref={containerRef}
          className="w-full border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white"
          style={{ minHeight: `${height}px` }}
        />
      </div>
    </div>
  );
};
