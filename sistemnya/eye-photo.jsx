// ============================================================
// OphthaSim — Eye Photo Viewer (v0.14.0)
// ------------------------------------------------------------
// Fitur ADITIF: tombol "Lihat Kondisi Mata" di header conversation
// panel. Klik → modal dengan foto mata pasien (carousel kalau >1).
// Auto-hidden bila kasus belum punya foto di manifest.
//
// Storage: public/eye-photos/manifest.json + file foto di folder sama.
// Lihat public/eye-photos/README.md untuk panduan user.
//
// Kontrak invarian (§8.1):
//   - design.css TIDAK diubah (semua style pakai token CSS var existing
//     + inline style konsisten dengan pola components.jsx).
//   - Komponen existing TIDAK di-edit (hanya disisipi <EyePhotoBar /> di
//     ConversationPanel — pola aditif sama seperti tombol mic v0.8.1).
//   - Tanpa foto → komponen render null → ZERO visual change.
//
// Engine kontrak (§3): TIDAK tersentuh. Ini murni UI asset display.
// ============================================================

// ── Photo loader: API-first dgn fallback manifest ──────────
// v0.15.0: kalau OPHTHA_API_BASE ada → fetch /api/cases/{caseId}/eye-photos
// (dynamic, realtime — upload via dashboard langsung muncul). Else fallback
// ke manifest.json statis (offline/dev/legacy). Per-caseId cache supaya
// gak re-fetch tiap kali bar re-render. Cache TTL 30 detik utk balance
// freshness vs request count (dashboard upload → refresh page → tampil).
const __eyePhotosCache = new Map();   // caseId → { photos, ts }
const __eyePhotosInflight = new Map();  // caseId → Promise<photos[]>
let __manifestCache = null;
let __manifestPromise = null;
const __CACHE_TTL_MS = 30 * 1000;

function __apiBase() {
  return (typeof window !== 'undefined' && window.OPHTHA_API_BASE) || '';
}

function __loadManifest() {
  if (__manifestCache !== null) return Promise.resolve(__manifestCache);
  if (__manifestPromise) return __manifestPromise;
  __manifestPromise = fetch('./eye-photos/manifest.json', { cache: 'no-cache' })
    .then(r => r.ok ? r.json() : {})
    .then(j => {
      const clean = {};
      if (j && typeof j === 'object') {
        for (const k of Object.keys(j)) {
          if (!k.startsWith('_') && Array.isArray(j[k])) clean[k] = j[k];
        }
      }
      __manifestCache = clean;
      return clean;
    })
    .catch(() => {
      __manifestCache = {};
      return {};
    });
  return __manifestPromise;
}

function __loadEyePhotosForCase(caseId) {
  if (!caseId) return Promise.resolve([]);
  const now = Date.now();
  const cached = __eyePhotosCache.get(caseId);
  if (cached && (now - cached.ts) < __CACHE_TTL_MS) return Promise.resolve(cached.photos);
  if (__eyePhotosInflight.has(caseId)) return __eyePhotosInflight.get(caseId);

  const base = __apiBase();
  const promise = (base
    ? fetch(`${base}/api/cases/${encodeURIComponent(caseId)}/eye-photos`, { cache: 'no-cache' })
        .then(r => r.ok ? r.json() : { data: [] })
        .then(j => Array.isArray(j && j.data) ? j.data : [])
        .catch(() => [])
    : __loadManifest().then(m => m[caseId] || []))
    .then(photos => {
      __eyePhotosCache.set(caseId, { photos, ts: Date.now() });
      __eyePhotosInflight.delete(caseId);
      return photos;
    });
  __eyePhotosInflight.set(caseId, promise);
  return promise;
}

// Resolve path foto:
//   - absolute URL (http/https) → as-is
//   - path absolute (mulai /) → prepend OPHTHA_API_BASE bila relative
//     to same-origin tapi backend di subdomain berbeda
//   - relative → ./eye-photos/<file> (legacy manifest path)
function __resolvePhotoSrc(src) {
  if (!src) return '';
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith('/')) {
    // Same-origin absolute. Kalau OPHTHA_API_BASE punya host beda (mis. dev
    // localhost:8000 vs vite 5173), pakai prefix supaya foto ke-load.
    const base = __apiBase();
    if (base && src.startsWith('/api/')) return base + src;
    return src;
  }
  if (src.startsWith('./')) return src;
  return './eye-photos/' + src;
}

// Utility ekspor — bila kode lain mau cek cache cepat.
function getEyePhotosCached(caseId) {
  const cached = __eyePhotosCache.get(caseId);
  return cached ? cached.photos : [];
}

// v0.15.0: dashboard panggil ini setelah upload/delete supaya bar refresh.
function invalidateEyePhotosCache(caseId) {
  if (caseId) __eyePhotosCache.delete(caseId);
  else __eyePhotosCache.clear();
}

// ── EyePhotoModal ──────────────────────────────────────────
// Overlay full-screen + image viewer. Carousel saat photos.length > 1.
// ESC + klik backdrop → close. Pakai komponen Overlay existing.
const EyePhotoModal = ({ photos, onClose }) => {
  const [idx, setIdx] = React.useState(0);
  const [loaded, setLoaded] = React.useState(false);
  const count = photos.length;
  const cur = photos[idx] || photos[0];

  React.useEffect(() => { setLoaded(false); }, [idx]);

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' && count > 1) setIdx(i => (i + 1) % count);
      else if (e.key === 'ArrowLeft' && count > 1) setIdx(i => (i - 1 + count) % count);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [count, onClose]);

  const eyeChipColor = {
    OD: { bg: 'rgba(99, 102, 241, 0.15)', fg: 'var(--primary)' },
    OS: { bg: 'rgba(244, 114, 182, 0.15)', fg: '#db2777' },
    OU: { bg: 'rgba(34, 197, 94, 0.15)',  fg: '#16a34a' },
  };
  const eyeStyle = cur && cur.eye && eyeChipColor[cur.eye];

  return (
    <React.Fragment>
      <Overlay onClick={onClose} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1001,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, pointerEvents: 'none',
        animation: 'overlayIn 0.25s ease both',
      }}>
        <div style={{
          background: 'var(--surface)', borderRadius: 18,
          padding: 18, maxWidth: 'min(900px, 92vw)', width: '100%',
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0,0,0,0.35)', pointerEvents: 'auto',
          border: '1px solid var(--border)',
        }} onClick={e => e.stopPropagation()}>

          {/* Header — judul + counter + close */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', flex: 1 }}>
              👁 Kondisi Mata Pasien
            </div>
            {count > 1 && (
              <span style={{
                fontSize: 11, color: 'var(--text-3)', fontWeight: 600,
                fontVariantNumeric: 'tabular-nums',
              }}>{idx + 1} / {count}</span>
            )}
            <Btn variant="secondary" onClick={onClose}
              style={{ padding: '6px 12px', fontSize: 12, borderRadius: 10 }}>
              ✕ Tutup
            </Btn>
          </div>

          {/* Image area */}
          <div style={{
            position: 'relative', flex: 1,
            background: 'var(--surface-2)', borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', minHeight: 240,
          }}>
            {!loaded && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-3)', fontSize: 12,
              }}>
                <LoadingDots />
              </div>
            )}
            <img
              src={__resolvePhotoSrc(cur.src)}
              alt={cur.caption || 'Foto mata pasien'}
              onLoad={() => setLoaded(true)}
              onError={() => setLoaded(true)}
              style={{
                maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain',
                display: 'block', opacity: loaded ? 1 : 0,
                transition: 'opacity 0.2s ease',
              }}
            />

            {/* Carousel arrows */}
            {count > 1 && (
              <React.Fragment>
                <button onClick={() => setIdx(i => (i - 1 + count) % count)}
                  aria-label="Sebelumnya"
                  style={{
                    position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none',
                    fontSize: 18, cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>‹</button>
                <button onClick={() => setIdx(i => (i + 1) % count)}
                  aria-label="Berikutnya"
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none',
                    fontSize: 18, cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>›</button>
              </React.Fragment>
            )}
          </div>

          {/* Caption + eye chip */}
          {(cur.caption || eyeStyle) && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginTop: 12, fontSize: 12, color: 'var(--text-2)',
            }}>
              {eyeStyle && (
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                  padding: '3px 9px', borderRadius: 7,
                  background: eyeStyle.bg, color: eyeStyle.fg,
                }}>{cur.eye}</span>
              )}
              {cur.caption && (
                <span style={{ flex: 1, lineHeight: 1.5 }}>{cur.caption}</span>
              )}
            </div>
          )}

          {/* Hint keyboard */}
          {count > 1 && (
            <div style={{
              marginTop: 8, fontSize: 10, color: 'var(--text-3)',
              textAlign: 'center',
            }}>
              ← → untuk navigasi · ESC untuk tutup
            </div>
          )}
        </div>
      </div>
    </React.Fragment>
  );
};

// ── EyePhotoBar ────────────────────────────────────────────
// Strip kecil di bawah PatientCard. Render tombol kalau caseId punya foto
// di manifest; null otherwise (zero visual change utk kasus tanpa foto).
const EyePhotoBar = ({ caseId }) => {
  const [photos, setPhotos] = React.useState(() => getEyePhotosCached(caseId));
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    __loadEyePhotosForCase(caseId).then(list => {
      if (alive) setPhotos(list || []);
    });
    return () => { alive = false; };
  }, [caseId]);

  if (!photos || photos.length === 0) return null;

  return (
    <React.Fragment>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 18px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
      }}>
        <span style={{
          fontSize: 11, color: 'var(--text-3)', fontWeight: 600,
          letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>Pemeriksaan Visual</span>
        <div style={{ flex: 1 }} />
        <Btn variant="secondary" onClick={() => setOpen(true)}
          style={{ padding: '6px 12px', fontSize: 12, borderRadius: 10 }}>
          👁 Lihat Kondisi Mata
          {photos.length > 1 && (
            <span style={{
              marginLeft: 6, fontSize: 10, opacity: 0.7, fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
            }}>({photos.length})</span>
          )}
        </Btn>
      </div>
      {open && <EyePhotoModal photos={photos} onClose={() => setOpen(false)} />}
    </React.Fragment>
  );
};

// Export ke window scope (pola sama seperti components.jsx).
// v0.15.0: getEyePhotos (sync, cache-only) tetap di-export utk back-compat;
// loader async = __loadEyePhotosForCase, invalidate utk dashboard upload.
Object.assign(window, {
  EyePhotoBar,
  EyePhotoModal,
  getEyePhotosCached,
  loadEyePhotosForCase: __loadEyePhotosForCase,
  invalidateEyePhotosCache,
});
