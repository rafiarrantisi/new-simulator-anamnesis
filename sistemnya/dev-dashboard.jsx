// ============================================================
// OphthaSim — Developer Dashboard (v0.15.0)
// ------------------------------------------------------------
// Internal CMS utk admin: kelola kasus + upload foto mata. Visible HANYA
// utk user dgn auth.role === 'admin' (gating di AppHeader + screen router).
//
// Stack:
//   - React 18 (window.React)
//   - Komponen existing: Btn, Card, Chip, Overlay, LoadingDots,
//     SectionHeader, useToast (dari components.jsx)
//   - Token CSS var existing (--surface, --text-1/2/3, --primary, --border)
//   - ZERO design.css baru (invarian §8.1)
//
// Backend endpoints (kontrak v0.15.0):
//   GET    /api/admin/whoami
//   GET    /api/admin/cases               (list semua + status)
//   GET    /api/admin/cases/{id}          (detail + raw markdown)
//   POST   /api/admin/cases               (create baru)
//   PATCH  /api/admin/cases/{id}          (edit body + metadata)
//   POST   /api/admin/cases/{id}/ingest   (re-ingest)
//   GET    /api/admin/eye-photos[?case_id=]
//   POST   /api/admin/eye-photos          (multipart)
//   DELETE /api/admin/eye-photos/{id}
//   GET    /api/admin/audit               (forensik log)
// ============================================================

// ── Fetch helpers (Bearer + JSON / multipart) ──────────────
const __ADMIN_AUTH_KEY = 'ophtha_api_auth';

function __adminAuthHeader() {
  try {
    const raw = localStorage.getItem(__ADMIN_AUTH_KEY);
    const auth = raw ? JSON.parse(raw) : null;
    if (auth && auth.token) return { Authorization: 'Bearer ' + auth.token };
  } catch (e) {}
  return {};
}

function __adminBase() {
  return (typeof window !== 'undefined' && window.OPHTHA_API_BASE) || '';
}

async function __adminFetch(path, opts) {
  opts = opts || {};
  const headers = Object.assign({}, opts.headers || {}, __adminAuthHeader());
  let body = opts.body;
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }
  const res = await fetch(__adminBase() + path, {
    method: opts.method || 'GET',
    headers: headers,
    body: body,
  });
  let json = null;
  try { json = await res.json(); } catch (e) { json = null; }
  if (!res.ok || (json && json.success === false)) {
    const msg = (json && (json.error || json.detail)) || ('HTTP ' + res.status);
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return json ? json.data : null;
}

// ── Style tokens (re-use existing CSS vars, no new design.css) ─
const __ds = {
  page: { background: 'var(--bg)', minHeight: '100vh', padding: '24px 32px' },
  card: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 14, padding: 18,
  },
  tabBtn: (active) => ({
    padding: '8px 16px', borderRadius: 10, border: 'none',
    background: active ? 'var(--primary)' : 'var(--surface-2)',
    color: active ? 'white' : 'var(--text-2)',
    fontFamily: 'Poppins', fontSize: 12, fontWeight: 700, cursor: 'pointer',
    transition: 'all 0.15s',
  }),
  th: {
    textAlign: 'left', padding: '10px 8px', fontSize: 11, fontWeight: 700,
    color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em',
    borderBottom: '1px solid var(--border)', background: 'var(--surface-2)',
  },
  td: {
    padding: '12px 8px', fontSize: 12, color: 'var(--text-2)',
    borderBottom: '1px solid var(--border)',
  },
  input: {
    padding: '8px 12px', borderRadius: 10, border: '1.5px solid var(--border)',
    background: 'var(--surface)', color: 'var(--text-1)', fontSize: 13,
    fontFamily: 'Poppins', outline: 'none', width: '100%',
  },
  textarea: {
    padding: '12px 14px', borderRadius: 10, border: '1.5px solid var(--border)',
    background: 'var(--surface-2)', color: 'var(--text-1)',
    fontSize: 12, fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
    outline: 'none', width: '100%', resize: 'vertical', lineHeight: 1.55,
  },
  label: {
    fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
    textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6,
    display: 'block',
  },
};

// ── CaseAdminTable ─────────────────────────────────────────
const CaseAdminTable = ({ onEdit, onCreate, refreshTrigger }) => {
  const [cases, setCases] = React.useState(null);
  const [error, setError] = React.useState('');
  const [filter, setFilter] = React.useState('all');  // all | active | disabled
  const toast = useToast();

  const reload = React.useCallback(() => {
    setCases(null); setError('');
    __adminFetch('/api/admin/cases').then(setCases).catch(e => setError(e.message));
  }, []);

  React.useEffect(reload, [reload, refreshTrigger]);

  const handleReingest = async (caseId) => {
    try {
      await __adminFetch(`/api/admin/cases/${encodeURIComponent(caseId)}/ingest`, { method: 'POST' });
      toast.show(`Re-ingest ${caseId} sukses`, 'success');
      reload();
    } catch (e) {
      toast.show(`Re-ingest gagal: ${e.message}`, 'error');
    }
  };

  const handleToggleActive = async (c) => {
    try {
      await __adminFetch(`/api/admin/cases/${encodeURIComponent(c.caseId)}`, {
        method: 'PATCH',
        body: { metadata: { is_active: !c.isActive } },
      });
      toast.show(`${c.caseId} ${!c.isActive ? 'diaktifkan' : 'dinonaktifkan'}`, 'success');
      reload();
    } catch (e) {
      toast.show(`Toggle gagal: ${e.message}`, 'error');
    }
  };

  if (error) return (
    <div style={__ds.card}>
      <p style={{ color: 'var(--red, #dc2626)', fontSize: 13 }}>⚠ Gagal load kasus: {error}</p>
      <Btn variant="secondary" onClick={reload} style={{ marginTop: 10 }}>Coba lagi</Btn>
    </div>
  );
  if (!cases) return <div style={__ds.card}><LoadingDots /></div>;

  const filtered = cases.filter(c => {
    if (filter === 'active') return c.isActive;
    if (filter === 'disabled') return !c.isActive;
    return true;
  });

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['all', 'Semua'], ['active', 'Aktif'], ['disabled', 'Nonaktif']].map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)} style={{
              ...__ds.tabBtn(filter === id), padding: '6px 12px', fontSize: 11,
            }}>{label}</button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>
          {filtered.length} / {cases.length} kasus
        </span>
        <Btn variant="primary" onClick={onCreate}
          style={{ padding: '8px 14px', fontSize: 12, borderRadius: 10 }}>
          + Kasus Baru
        </Btn>
      </div>

      {/* Tabel */}
      <div style={{ ...__ds.card, padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={__ds.th}>ID</th>
                <th style={__ds.th}>Judul</th>
                <th style={__ds.th}>ICD-10</th>
                <th style={__ds.th}>SKDI</th>
                <th style={__ds.th}>Difficulty</th>
                <th style={__ds.th}>Foto</th>
                <th style={__ds.th}>Status</th>
                <th style={{ ...__ds.th, textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.caseId}>
                  <td style={{ ...__ds.td, fontFamily: 'ui-monospace, monospace', fontWeight: 700, color: 'var(--text-1)' }}>{c.caseId}</td>
                  <td style={{ ...__ds.td, color: 'var(--text-1)', fontWeight: 600 }}>
                    {c.title_id || '(tanpa judul)'}
                    {c.title_en && (
                      <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 400, marginTop: 2 }}>{c.title_en}</div>
                    )}
                  </td>
                  <td style={__ds.td}>{c.icd10 || '—'}</td>
                  <td style={__ds.td}>{c.skdi || '—'}</td>
                  <td style={__ds.td}>{c.difficulty || '—'}</td>
                  <td style={__ds.td}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: c.photoCount > 0 ? 'var(--primary)' : 'var(--text-3)',
                    }}>{c.photoCount || 0}</span>
                  </td>
                  <td style={__ds.td}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                      background: c.isActive ? 'rgba(34,197,94,0.15)' : 'rgba(220,38,38,0.12)',
                      color: c.isActive ? '#16a34a' : '#dc2626',
                    }}>{c.isActive ? 'AKTIF' : 'NONAKTIF'}</span>
                    {!c.hasMarkdown && (
                      <span style={{
                        marginLeft: 6, fontSize: 10, padding: '3px 8px', borderRadius: 6,
                        background: 'rgba(234,179,8,0.15)', color: '#a16207', fontWeight: 700,
                      }}>NO-MD</span>
                    )}
                  </td>
                  <td style={{ ...__ds.td, textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button onClick={() => onEdit(c.caseId)} title="Edit"
                        style={{ background: 'var(--surface-2)', border: 'none', padding: '5px 10px',
                                  borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>✏</button>
                      <button onClick={() => handleReingest(c.caseId)} title="Re-ingest"
                        style={{ background: 'var(--surface-2)', border: 'none', padding: '5px 10px',
                                  borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>🔄</button>
                      <button onClick={() => handleToggleActive(c)} title={c.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        style={{ background: 'var(--surface-2)', border: 'none', padding: '5px 10px',
                                  borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>{c.isActive ? '🔒' : '🔓'}</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ ...__ds.td, textAlign: 'center', color: 'var(--text-3)', padding: 30 }}>
                  Tidak ada kasus sesuai filter.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── CaseEditorModal ────────────────────────────────────────
// Hybrid: form metadata + textarea markdown body. Save → POST/PATCH +
// refresh tabel parent via onSaved callback.
const CaseEditorModal = ({ mode, caseId, onClose, onSaved }) => {
  const isCreate = mode === 'create';
  const isCanonical = caseId && /^kasus-(0[1-9]|1\d|2[0-2])$/.test(caseId);
  const [loading, setLoading] = React.useState(!isCreate);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [form, setForm] = React.useState({
    caseId: isCreate ? '' : caseId,
    slug: '',
    title_id: '', title_en: '', icd10: '', skdi: '',
    organ_system: 'Mata', difficulty: '', tags: '',
    stage: '', case_type: '', is_active: true,
    content: '',
  });
  const toast = useToast();

  React.useEffect(() => {
    if (isCreate) return;
    __adminFetch(`/api/admin/cases/${encodeURIComponent(caseId)}`)
      .then(d => {
        setForm({
          caseId: d.caseId, slug: d.slug || '',
          title_id: d.title_id || '', title_en: d.title_en || '',
          icd10: d.icd10 || '', skdi: d.skdi || '',
          organ_system: d.organ_system || 'Mata',
          difficulty: d.difficulty || '',
          tags: Array.isArray(d.tags) ? d.tags.join(', ') : '',
          stage: d.stage || '', case_type: d.caseType || '',
          is_active: d.isActive !== false,
          content: d.content || '',
        });
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [caseId, isCreate]);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (publish) => {
    setSaving(true); setError('');
    try {
      const metadata = {
        title_id: form.title_id || undefined,
        title_en: form.title_en || undefined,
        icd10: form.icd10 || undefined,
        skdi: form.skdi || undefined,
        organ_system: form.organ_system || undefined,
        difficulty: form.difficulty || undefined,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        stage: form.stage || undefined,
        case_type: form.case_type || undefined,
        is_active: publish !== undefined ? !!publish : form.is_active,
      };
      if (isCreate) {
        await __adminFetch('/api/admin/cases', {
          method: 'POST',
          body: { case_id: form.caseId, slug: form.slug, content: form.content, metadata },
        });
        toast.show(`Kasus ${form.caseId} dibuat`, 'success');
      } else {
        await __adminFetch(`/api/admin/cases/${encodeURIComponent(caseId)}`, {
          method: 'PATCH',
          body: {
            content: form.content || undefined,
            slug: form.slug || undefined,
            metadata,
          },
        });
        toast.show(`Kasus ${caseId} disimpan`, 'success');
      }
      onSaved && onSaved();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <React.Fragment>
      <Overlay onClick={onClose} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1001,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, pointerEvents: 'none',
      }}>
        <div onClick={e => e.stopPropagation()} style={{
          background: 'var(--surface)', borderRadius: 16, padding: 22,
          maxWidth: 'min(1100px, 96vw)', width: '100%',
          maxHeight: '92vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0,0,0,0.35)', pointerEvents: 'auto',
          border: '1px solid var(--border)',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', flex: 1 }}>
              {isCreate ? '+ Kasus Baru' : `✏ Edit ${caseId}`}
            </div>
            <Btn variant="secondary" onClick={onClose}
              style={{ padding: '6px 12px', fontSize: 12, borderRadius: 10 }}>
              ✕ Tutup
            </Btn>
          </div>

          {isCanonical && (
            <div style={{
              padding: '10px 14px', borderRadius: 10, marginBottom: 14,
              background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.3)',
              fontSize: 12, color: '#92400e', lineHeight: 1.5,
            }}>
              ⚠ <b>Kasus kanonik</b> ({caseId}). Perubahan akan keluar dari git tracking server.
              Pertimbangkan commit lokal dgn diff vs file asli setelah review.
            </div>
          )}

          {loading ? (
            <div style={{ padding: 30, textAlign: 'center' }}><LoadingDots /></div>
          ) : (
            <div style={{ overflow: 'auto', flex: 1 }}>
              {/* Section 1: Metadata */}
              <div style={{ marginBottom: 18 }}>
                <SectionHeader title="Metadata" sub="Field katalog (CaseSummary §5.6)" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {isCreate && (
                    <React.Fragment>
                      <div>
                        <label style={__ds.label}>caseId (kasus-XX)</label>
                        <input style={__ds.input} value={form.caseId}
                          onChange={e => update('caseId', e.target.value)}
                          placeholder="kasus-23" />
                      </div>
                      <div>
                        <label style={__ds.label}>slug (a-z0-9-)</label>
                        <input style={__ds.input} value={form.slug}
                          onChange={e => update('slug', e.target.value)}
                          placeholder="konjungtivitis-alergi" />
                      </div>
                    </React.Fragment>
                  )}
                  {!isCreate && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={__ds.label}>slug (opsional — kosongkan utk tetap)</label>
                      <input style={__ds.input} value={form.slug}
                        onChange={e => update('slug', e.target.value)}
                        placeholder="kosongkan kalau tidak diubah" />
                    </div>
                  )}
                  <div>
                    <label style={__ds.label}>Judul (ID)</label>
                    <input style={__ds.input} value={form.title_id}
                      onChange={e => update('title_id', e.target.value)} />
                  </div>
                  <div>
                    <label style={__ds.label}>Judul (EN, opsional)</label>
                    <input style={__ds.input} value={form.title_en}
                      onChange={e => update('title_en', e.target.value)} />
                  </div>
                  <div>
                    <label style={__ds.label}>ICD-10</label>
                    <input style={__ds.input} value={form.icd10}
                      onChange={e => update('icd10', e.target.value)} placeholder="H10.9" />
                  </div>
                  <div>
                    <label style={__ds.label}>SKDI</label>
                    <input style={__ds.input} value={form.skdi}
                      onChange={e => update('skdi', e.target.value)} placeholder="4A" />
                  </div>
                  <div>
                    <label style={__ds.label}>Difficulty</label>
                    <select style={__ds.input} value={form.difficulty}
                      onChange={e => update('difficulty', e.target.value)}>
                      <option value="">—</option>
                      <option>Easy</option><option>Medium</option><option>Hard</option>
                    </select>
                  </div>
                  <div>
                    <label style={__ds.label}>Stage</label>
                    <select style={__ds.input} value={form.stage}
                      onChange={e => update('stage', e.target.value)}>
                      <option value="">—</option>
                      <option value="preklinik">Preklinik</option>
                      <option value="koas">Koas</option>
                    </select>
                  </div>
                  <div>
                    <label style={__ds.label}>Case Type</label>
                    <select style={__ds.input} value={form.case_type}
                      onChange={e => update('case_type', e.target.value)}>
                      <option value="">—</option>
                      <option value="practice">Latihan</option>
                      <option value="osce">OSCE</option>
                    </select>
                  </div>
                  <div>
                    <label style={__ds.label}>Tags (comma-separated)</label>
                    <input style={__ds.input} value={form.tags}
                      onChange={e => update('tags', e.target.value)}
                      placeholder="konjungtiva, infeksi, akut" />
                  </div>
                </div>
              </div>

              {/* Section 2: Markdown body */}
              <div>
                <SectionHeader title="Markdown Body"
                  sub="Format kanonik: # KASUS NN: Judul → ## BAGIAN A → ### 1..10 → ## BAGIAN B → ### 0. DISCLOSURE LAYERS"
                  action={isCreate && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>min ~1000 char</span>} />
                <textarea
                  style={{ ...__ds.textarea, minHeight: 320 }}
                  value={form.content}
                  onChange={e => update('content', e.target.value)}
                  placeholder={isCreate ? '# KASUS XX: Judul...\n\n## BAGIAN A: DATA MEDIS\n\n### 1. Diagnosis Kerja\n...' : '(kosongkan utk tetap pakai file existing — hanya metadata yg di-update)'}
                  rows={20}
                />
              </div>
            </div>
          )}

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 10, marginTop: 12,
              background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.3)',
              fontSize: 12, color: '#dc2626',
            }}>⚠ {error}</div>
          )}

          {/* Footer */}
          <div style={{
            display: 'flex', gap: 10, marginTop: 16, paddingTop: 14,
            borderTop: '1px solid var(--border)',
          }}>
            <Btn variant="secondary" onClick={onClose}>Batal</Btn>
            <div style={{ flex: 1 }} />
            <Btn variant="secondary" onClick={() => handleSave(false)} disabled={saving}>
              {saving ? 'Menyimpan…' : 'Simpan Draft'}
            </Btn>
            <Btn variant="primary" onClick={() => handleSave(true)} disabled={saving}>
              {saving ? 'Menyimpan…' : (isCreate ? 'Buat & Publish' : 'Simpan & Publish')}
            </Btn>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

// ── EyePhotoAdminGrid ──────────────────────────────────────
const EyePhotoAdminGrid = ({ refreshTrigger }) => {
  const [cases, setCases] = React.useState(null);
  const [openCaseId, setOpenCaseId] = React.useState(null);

  React.useEffect(() => {
    __adminFetch('/api/admin/cases').then(setCases).catch(() => setCases([]));
  }, [refreshTrigger]);

  if (!cases) return <div style={__ds.card}><LoadingDots /></div>;

  return (
    <div>
      <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
          Klik kasus → manage foto (upload, hapus, edit caption/eye).
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>
          {cases.filter(c => c.photoCount > 0).length} / {cases.length} kasus berfoto
        </span>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12,
      }}>
        {cases.map(c => (
          <button key={c.caseId} onClick={() => setOpenCaseId(c.caseId)}
            style={{
              textAlign: 'left', padding: 14, borderRadius: 12,
              background: 'var(--surface)', border: '1px solid var(--border)',
              cursor: 'pointer', fontFamily: 'Poppins',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, fontWeight: 700, color: 'var(--text-3)' }}>{c.caseId}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginTop: 4, marginBottom: 10, lineHeight: 1.3 }}>
              {c.title_id || '(tanpa judul)'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 18, fontWeight: 800, color: c.photoCount > 0 ? 'var(--primary)' : 'var(--text-3)',
                fontVariantNumeric: 'tabular-nums',
              }}>{c.photoCount || 0}</span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>foto</span>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700 }}>Manage →</span>
            </div>
          </button>
        ))}
      </div>

      {openCaseId && (
        <EyePhotoEditorModal
          caseId={openCaseId}
          onClose={() => setOpenCaseId(null)}
          onChanged={() => {
            // refresh count di grid
            __adminFetch('/api/admin/cases').then(setCases).catch(() => {});
            if (typeof window !== 'undefined' && window.invalidateEyePhotosCache) {
              window.invalidateEyePhotosCache(openCaseId);
            }
          }}
        />
      )}
    </div>
  );
};

// ── EyePhotoEditorModal ────────────────────────────────────
const EyePhotoEditorModal = ({ caseId, onClose, onChanged }) => {
  const [photos, setPhotos] = React.useState(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [pendingFile, setPendingFile] = React.useState(null);
  const [caption, setCaption] = React.useState('');
  const [eye, setEye] = React.useState('');
  const toast = useToast();
  const fileInputRef = React.useRef(null);

  const reload = React.useCallback(() => {
    __adminFetch(`/api/admin/eye-photos?case_id=${encodeURIComponent(caseId)}`)
      .then(setPhotos).catch(e => setError(e.message));
  }, [caseId]);

  React.useEffect(reload, [reload]);

  const handleFile = (f) => {
    if (!f) return;
    if (!/^image\//.test(f.type)) {
      setError('File harus gambar (jpg/png/webp/gif)');
      return;
    }
    setPendingFile(f); setError('');
  };

  const handleUpload = async () => {
    if (!pendingFile) return;
    setUploading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', pendingFile);
      fd.append('case_id', caseId);
      fd.append('eye', eye);
      fd.append('caption', caption);
      fd.append('ord', String(photos ? photos.length : 0));
      await __adminFetch('/api/admin/eye-photos', { method: 'POST', body: fd });
      toast.show('Foto ter-upload', 'success');
      setPendingFile(null); setCaption(''); setEye('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      reload();
      onChanged && onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus foto ini?')) return;
    try {
      await __adminFetch(`/api/admin/eye-photos/${encodeURIComponent(id)}`, { method: 'DELETE' });
      toast.show('Foto dihapus', 'success');
      reload();
      onChanged && onChanged();
    } catch (e) {
      toast.show('Gagal hapus: ' + e.message, 'error');
    }
  };

  return (
    <React.Fragment>
      <Overlay onClick={onClose} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1001,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, pointerEvents: 'none',
      }}>
        <div onClick={e => e.stopPropagation()} style={{
          background: 'var(--surface)', borderRadius: 16, padding: 22,
          maxWidth: 'min(800px, 96vw)', width: '100%',
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0,0,0,0.35)', pointerEvents: 'auto',
          border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', flex: 1 }}>
              📷 Manage Foto — <span style={{ fontFamily: 'ui-monospace, monospace' }}>{caseId}</span>
            </div>
            <Btn variant="secondary" onClick={onClose}
              style={{ padding: '6px 12px', fontSize: 12, borderRadius: 10 }}>✕ Tutup</Btn>
          </div>

          <div style={{ overflow: 'auto', flex: 1 }}>
            {/* Upload area */}
            <div style={{
              padding: 16, borderRadius: 12, marginBottom: 16,
              background: 'var(--surface-2)', border: '1.5px dashed var(--border)',
            }}>
              <div style={{ marginBottom: 10 }}>
                <input
                  ref={fileInputRef} type="file" accept="image/*"
                  onChange={e => handleFile(e.target.files && e.target.files[0])}
                  style={{ fontSize: 12, fontFamily: 'Poppins' }}
                />
                {pendingFile && (
                  <span style={{ marginLeft: 10, fontSize: 11, color: 'var(--text-3)' }}>
                    {pendingFile.name} · {Math.round(pendingFile.size / 1024)} KB
                  </span>
                )}
              </div>
              {pendingFile && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px auto', gap: 10, alignItems: 'end' }}>
                  <div>
                    <label style={__ds.label}>Caption</label>
                    <input style={__ds.input} value={caption} onChange={e => setCaption(e.target.value)}
                      placeholder="Mis. Hifema 3mm, OD" />
                  </div>
                  <div>
                    <label style={__ds.label}>Eye</label>
                    <select style={__ds.input} value={eye} onChange={e => setEye(e.target.value)}>
                      <option value="">—</option>
                      <option>OD</option><option>OS</option><option>OU</option>
                    </select>
                  </div>
                  <Btn variant="primary" onClick={handleUpload} disabled={uploading}
                    style={{ padding: '10px 16px', borderRadius: 10 }}>
                    {uploading ? 'Upload…' : 'Upload'}
                  </Btn>
                </div>
              )}
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 10, marginBottom: 12,
                background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.3)',
                fontSize: 12, color: '#dc2626',
              }}>⚠ {error}</div>
            )}

            {/* Existing photos list */}
            {photos === null ? <LoadingDots /> : photos.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', fontSize: 12, color: 'var(--text-3)' }}>
                Belum ada foto utk kasus ini.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                {photos.map(p => (
                  <div key={p.id} style={{
                    background: 'var(--surface-2)', borderRadius: 10, overflow: 'hidden',
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{
                      aspectRatio: '4/3', background: '#000',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <img src={(__adminBase() + p.src)} alt={p.caption || ''}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ padding: 10 }}>
                      {p.eye && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 6,
                          background: 'rgba(99,102,241,0.15)', color: 'var(--primary)',
                          letterSpacing: '0.06em',
                        }}>{p.eye}</span>
                      )}
                      <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 6, lineHeight: 1.4,
                                     minHeight: 28, maxHeight: 56, overflow: 'hidden' }}>
                        {p.caption || <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>(tanpa caption)</span>}
                      </div>
                      <div style={{ marginTop: 8, display: 'flex' }}>
                        <button onClick={() => handleDelete(p.id)} title="Hapus"
                          style={{
                            background: 'rgba(220,38,38,0.1)', color: '#dc2626',
                            border: 'none', padding: '5px 10px', borderRadius: 6,
                            fontSize: 11, fontWeight: 700, cursor: 'pointer', marginLeft: 'auto',
                          }}>🗑 Hapus</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

// ── DeveloperDashboardScreen ───────────────────────────────
const DeveloperDashboardScreen = ({ auth, navigate }) => {
  const [tab, setTab] = React.useState('cases');
  const [editorMode, setEditorMode] = React.useState(null);  // null | 'create' | 'edit'
  const [editingCaseId, setEditingCaseId] = React.useState(null);
  const [refreshTick, setRefreshTick] = React.useState(0);
  const [verified, setVerified] = React.useState(null);  // null=cek, true=admin, false=denied
  const [whoamiError, setWhoamiError] = React.useState('');

  React.useEffect(() => {
    __adminFetch('/api/admin/whoami')
      .then(d => setVerified(d && d.role === 'admin'))
      .catch(e => { setVerified(false); setWhoamiError(e.message); });
  }, []);

  // Auth gate (defense-in-depth: AppHeader sudah filter, ini cek server-side)
  if (verified === null) {
    return <div style={__ds.page}><div style={__ds.card}><LoadingDots /></div></div>;
  }
  if (verified === false) {
    return (
      <div style={__ds.page}>
        <div style={__ds.card}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>Akses Ditolak</h2>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 8 }}>
            Dashboard developer hanya untuk akun admin. {whoamiError && `(${whoamiError})`}
          </p>
          <Btn variant="primary" onClick={() => navigate && navigate('dashboard')}
            style={{ marginTop: 14 }}>Kembali ke Dashboard</Btn>
        </div>
      </div>
    );
  }

  return (
    <div style={__ds.page}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)' }}>🛠 Developer Dashboard</h1>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 7,
              background: 'rgba(99,102,241,0.15)', color: 'var(--primary)',
              letterSpacing: '0.06em',
            }}>ADMIN</span>
            <div style={{ flex: 1 }} />
            {auth && auth.email && (
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{auth.email}</span>
            )}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
            Kelola kasus markdown + foto mata. Perubahan langsung sync ke produksi.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          <button onClick={() => setTab('cases')} style={__ds.tabBtn(tab === 'cases')}>📚 Kasus</button>
          <button onClick={() => setTab('photos')} style={__ds.tabBtn(tab === 'photos')}>📷 Foto Mata</button>
        </div>

        {/* Content */}
        {tab === 'cases' && (
          <CaseAdminTable
            refreshTrigger={refreshTick}
            onCreate={() => { setEditorMode('create'); setEditingCaseId(null); }}
            onEdit={(id) => { setEditorMode('edit'); setEditingCaseId(id); }}
          />
        )}
        {tab === 'photos' && <EyePhotoAdminGrid refreshTrigger={refreshTick} />}

        {editorMode && (
          <CaseEditorModal
            mode={editorMode}
            caseId={editingCaseId}
            onClose={() => { setEditorMode(null); setEditingCaseId(null); }}
            onSaved={() => setRefreshTick(t => t + 1)}
          />
        )}
      </div>
    </div>
  );
};

// Export ke window
Object.assign(window, {
  DeveloperDashboardScreen,
  CaseAdminTable,
  CaseEditorModal,
  EyePhotoAdminGrid,
  EyePhotoEditorModal,
});
