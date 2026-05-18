// Pixi v8 Application lifecycle (L3, kontrak §3B.3). Init async, dibuat
// HANYA saat station di-mount (lazy → GPU/RAM ditunda, plan §3.2). Aman
// StrictMode (guard double-invoke) + destroy saat unmount.
import { useEffect, useRef, useState } from 'react';
import { Application } from 'pixi.js';

export function usePixiApp(
  width: number,
  height: number,
  background = 0x05080c,
): { hostRef: React.RefObject<HTMLDivElement>; app: Application | null } {
  const hostRef = useRef<HTMLDivElement>(null);
  const [app, setApp] = useState<Application | null>(null);

  useEffect(() => {
    let cancelled = false;
    let created: Application | null = null;
    const host = hostRef.current;
    if (!host) return;

    const a = new Application();
    a.init({ width, height, background, antialias: true })
      .then(() => {
        if (cancelled) {
          a.destroy(true);
          return;
        }
        created = a;
        host.appendChild(a.canvas);
        setApp(a);
      })
      .catch(() => {
        /* WebGL gagal → station tampilkan fallback (plan §3.3) */
      });

    return () => {
      cancelled = true;
      if (created) {
        created.canvas.remove();
        created.destroy(true);
      }
      setApp(null);
    };
  }, [width, height, background]);

  return { hostRef, app };
}
