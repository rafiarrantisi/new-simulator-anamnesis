// ============================================================
// OphthaSim — Learning Extras
//   • DDxCommitScreen   — student commits 3 differential diagnoses
//                          BEFORE seeing exam findings. Trains hypothesis-
//                          driven anamnesis (the same skill examined in
//                          the "Kemampuan menyimpulkan" row of the OSCE
//                          rubric).
//   • ReflectionCard    — inline in debrief; 1-prompt free-text journal
//                          entry persisted to profile.journalEntries.
//   • JournalList       — render journal entries in Profile screen.
// ============================================================

// ── Helpers ─────────────────────────────────────────────────
function saveJournalEntry(profile, entry) {
  const next = {
    ...profile,
    journalEntries: [entry, ...(profile.journalEntries || [])].slice(0, 200),
  };
  try { saveProfile(next); } catch (e) {}
  return next;
}

function fmtJournalDate(ts) {
  const d = new Date(ts);
  const days = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} · ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

// ============================================================
// DDx COMMIT SCREEN
// ============================================================
// Runs between simulator-end and ocular-exam (or debrief if no exam).
// Student writes their working top-3 DDx + reasoning BEFORE seeing any
// physical-exam findings — the moment that separates "reflexive checklist"
// from "hypothesis-driven anamnesis".
const DDxCommitScreen = ({ caseData, session, onSubmit, onSkip, mode }) => {
  const [dx1, setDx1] = React.useState('');
  const [dx2, setDx2] = React.useState('');
  const [dx3, setDx3] = React.useState('');
  const [reasoning, setReasoning] = React.useState('');
  const [focused, setFocused] = React.useState(null);

  const canSubmit = dx1.trim().length >= 3;

  // Findings student already uncovered — read-only reference panel
  const findings = (session.findings || []).filter(f => f.found || f.label);
  const discovered = caseData.keyDomains.filter(d => session.discoveredDomains.has(d));
  const missed     = caseData.keyDomains.filter(d => !session.discoveredDomains.has(d));

  const isOsce = mode === 'osce';
  const isPreklinik = caseData.stage === 'preklinik';

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      dx1: dx1.trim(),
      dx2: dx2.trim(),
      dx3: dx3.trim(),
      reasoning: reasoning.trim(),
      committedAt: Date.now(),
    });
  };

  // Cmd/Ctrl+Enter submits
  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canSubmit) handleSubmit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dx1, dx2, dx3, reasoning, canSubmit]);

  return (
    <div style={{
      maxWidth: 1000, margin: '0 auto', padding: '32px 24px 60px',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
            background: 'var(--primary-l)', color: 'var(--primary)',
            letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            Tahap 2 dari 3
          </span>
          {isOsce
            ? <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: 'var(--red-l)', color: 'var(--red-d)' }}>⏱️ OSCE</span>
            : <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: 'var(--surface-2)', color: 'var(--text-3)' }}>Tanpa hint</span>
          }
        </div>
        <h1 style={{
          fontSize: 24, fontWeight: 800, color: 'var(--text-1)',
          marginBottom: 6, textWrap: 'pretty',
        }}>
          Komit Diagnosis Banding Anda
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, maxWidth: 720 }}>
          Sebelum melakukan pemeriksaan, tuliskan hipotesis Anda berdasarkan
          anamnesis. {isPreklinik
            ? 'Cukup satu diagnosis kerja jika belum yakin akan banding — yang penting Anda berkomitmen pada satu pemikiran.'
            : 'Untuk level koas, kemampuan menyusun banding (≥2) adalah inti pemeriksaan klinis.'}
          {' '}Hipotesis ini akan dibandingkan dengan diagnosis akhir di debrief.
        </p>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24,
      }}>
        {/* ── Left: DDx form ───────────────────────────── */}
        <div style={{
          background: 'var(--surface)', borderRadius: 20, padding: '24px 26px',
          border: '1px solid var(--border)', boxShadow: 'var(--sh-sm)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { idx: 1, val: dx1, set: setDx1, req: true,  placeholder: 'Diagnosis kerja utama (wajib)', help: 'Dx yang paling mungkin' },
              { idx: 2, val: dx2, set: setDx2, req: false, placeholder: 'Diagnosis banding kedua (opsional, dianjurkan)', help: 'Banding ke-2' },
              { idx: 3, val: dx3, set: setDx3, req: false, placeholder: 'Diagnosis banding ketiga (opsional)', help: 'Banding ke-3' },
            ].map(row => (
              <div key={row.idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  flexShrink: 0, width: 32, height: 32, borderRadius: 10,
                  background: row.val.trim() ? 'var(--primary)' : 'var(--surface-2)',
                  color: row.val.trim() ? '#fff' : 'var(--text-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 13, marginTop: 6,
                  transition: 'all 0.2s',
                }}>{row.idx}</div>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={row.val}
                    onChange={(e) => row.set(e.target.value)}
                    placeholder={row.placeholder}
                    onFocus={() => setFocused('dx' + row.idx)}
                    onBlur={() => setFocused(null)}
                    style={{
                      width: '100%', padding: '12px 14px',
                      border: `1.5px solid ${focused === 'dx' + row.idx ? 'var(--primary)' : 'var(--border)'}`,
                      borderRadius: 12, fontSize: 14, fontFamily: 'Poppins',
                      background: 'var(--surface)', color: 'var(--text-1)',
                      outline: 'none', transition: 'border-color 0.18s',
                    }}
                  />
                  {row.req && !row.val.trim() && (
                    <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4, marginLeft: 4 }}>
                      Minimal 1 diagnosis kerja wajib diisi
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Reasoning */}
          <div style={{ marginTop: 22 }}>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 700,
              color: 'var(--text-2)', marginBottom: 8,
              letterSpacing: '0.05em', textTransform: 'uppercase',
            }}>
              Alasan klinis singkat <span style={{ color: 'var(--text-3)', fontWeight: 500 }}>(opsional)</span>
            </label>
            <textarea
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              placeholder={isPreklinik
                ? 'Contoh: keluhan mata merah dengan sekret mukopurulen sejak <24 jam pada pengguna lensa kontak — mengarah ke konjungtivitis bakterial dengan risiko keratitis.'
                : 'Contoh: nyeri retrobulbar pada gerakan + dyschromatopsia + RAPD positif pada pasien muda perempuan dengan riwayat parestesia ekstremitas — strongly suggest demyelinating optic neuritis.'
              }
              onFocus={() => setFocused('reason')}
              onBlur={() => setFocused(null)}
              rows={4}
              style={{
                width: '100%', padding: '12px 14px',
                border: `1.5px solid ${focused === 'reason' ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 12, fontSize: 13, fontFamily: 'Poppins',
                background: 'var(--surface)', color: 'var(--text-1)',
                outline: 'none', transition: 'border-color 0.18s', resize: 'vertical',
                lineHeight: 1.55,
              }}
            />
          </div>

          {/* CTA row */}
          <div style={{
            marginTop: 22, display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', gap: 12, flexWrap: 'wrap',
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
              <kbd style={{
                background: 'var(--surface-2)', padding: '2px 7px',
                borderRadius: 5, fontSize: 10, fontFamily: 'monospace',
                border: '1px solid var(--border)',
              }}>⌘/Ctrl + Enter</kbd> untuk submit
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {onSkip && !isOsce && (
                <Btn variant="ghost" onClick={onSkip}>Lewati</Btn>
              )}
              <Btn variant="primary" onClick={handleSubmit} disabled={!canSubmit} icon="→">
                Lanjut ke Pemeriksaan
              </Btn>
            </div>
          </div>
        </div>

        {/* ── Right: discovered findings sidebar ───────── */}
        <div>
          <div style={{
            background: 'var(--surface)', borderRadius: 18, padding: '18px 18px',
            border: '1px solid var(--border)', boxShadow: 'var(--sh-sm)',
          }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
              textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12,
            }}>
              📋 Ringkasan Anamnesis
            </div>

            {/* Patient context (short — what they'd already know) */}
            <div style={{
              padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 10,
              fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 14,
            }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pasien</div>
              {caseData.patientProfile.age}th · {caseData.patientProfile.gender}
              {caseData.patientProfile.occupation && caseData.patientProfile.occupation !== '—' && (
                <> · {caseData.patientProfile.occupation}</>
              )}
            </div>

            {/* Discovered findings */}
            {findings.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', marginBottom: 8 }}>
                  ✓ Anda temukan ({findings.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14, maxHeight: 240, overflowY: 'auto', paddingRight: 4 }}>
                  {findings.map((f, i) => (
                    <div key={i} style={{
                      fontSize: 11, padding: '6px 10px',
                      background: f.isRedFlag ? 'var(--red-l)' : 'var(--surface-2)',
                      border: `1px solid ${f.isRedFlag ? 'var(--red)25' : 'transparent'}`,
                      color: f.isRedFlag ? 'var(--red-d)' : 'var(--text-2)',
                      borderRadius: 8, lineHeight: 1.4,
                    }}>
                      {f.isRedFlag && '🚩 '}{f.found || f.label || f.text}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Missed domains hint (only outside OSCE) */}
            {!isOsce && missed.length > 0 && (
              <details>
                <summary style={{
                  fontSize: 11, fontWeight: 700, color: 'var(--amber-d)',
                  cursor: 'pointer', marginBottom: 6,
                }}>
                  ⚠️ {missed.length} domain belum ditanya
                </summary>
                <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 6, lineHeight: 1.5 }}>
                  Pikirkan apakah ini memengaruhi diagnosis Anda. Anda tetap bisa lanjut.
                </div>
              </details>
            )}
          </div>

          <div style={{
            marginTop: 14, fontSize: 11, color: 'var(--text-3)', lineHeight: 1.6,
            padding: '12px 14px', background: 'var(--primary-ll)', borderRadius: 12,
            border: '1px solid var(--primary-l)',
          }}>
            💡 Tidak ada hint diagnosis yang benar di sini. Sistem akan
            membandingkan komitmen Anda dengan diagnosis akhir setelah debrief.
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// REFLECTION CARD  (inline in DebriefScreen)
// ============================================================
// Lightweight free-text journal prompt. One question, max-200-char limit.
// Saved on click; entry stored on profile + visible from Profile screen.
const ReflectionCard = ({ caseData, session, score, profile, onSaved }) => {
  const [text, setText] = React.useState('');
  const [saved, setSaved] = React.useState(false);

  // If this case already has a journal entry from this session-ish (within 5min),
  // suppress the card to avoid duplicates on debrief re-renders.
  const recentEntry = (profile.journalEntries || []).find(e =>
    e.caseId === caseData.id && (Date.now() - e.timestamp) < 5 * 60 * 1000
  );

  if (recentEntry) {
    return (
      <Card padding={18} style={{ marginBottom: 18, background: 'var(--green-l)', border: '1.5px solid var(--green)30' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: 'var(--green)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, color: '#fff',
          }}>📓</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--green)' }}>
              Tersimpan ke Jurnal Pembelajaran
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2, fontStyle: 'italic' }}>
              "{recentEntry.text.slice(0, 110)}{recentEntry.text.length > 110 ? '…' : ''}"
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const handleSave = () => {
    const trimmed = text.trim();
    if (trimmed.length < 4) return;
    const entry = {
      id: 'j-' + Date.now(),
      caseId: caseData.id,
      caseTitle: caseData.title,
      stage: caseData.stage,
      caseType: caseData.caseType,
      score,
      text: trimmed,
      timestamp: Date.now(),
    };
    const nextProfile = saveJournalEntry(profile, entry);
    setSaved(true);
    onSaved && onSaved(nextProfile);
  };

  const maxLen = 280;
  const remaining = maxLen - text.length;

  return (
    <Card padding={20} style={{
      marginBottom: 18,
      background: 'linear-gradient(135deg, var(--primary-ll) 0%, var(--surface) 100%)',
      border: '1.5px solid var(--primary-l)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: 20 }}>📓</span>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)' }}>
          Refleksi Singkat
        </div>
        <span style={{
          fontSize: 9, color: 'var(--text-3)', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>Opsional · {maxLen} karakter</span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 12, lineHeight: 1.5 }}>
        Apa <strong>satu hal</strong> yang akan Anda lakukan beda jika menemui kasus
        serupa berikutnya?
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, maxLen))}
        placeholder="Misal: 'Lain kali akan menanyakan riwayat pengobatan sistemik lebih awal — saya hampir melewatkan link antihistamin dengan AACG di kasus ini.'"
        rows={3}
        style={{
          width: '100%', padding: '12px 14px',
          border: '1.5px solid var(--border)', borderRadius: 12,
          fontSize: 13, fontFamily: 'Poppins',
          background: 'var(--surface)', color: 'var(--text-1)',
          outline: 'none', resize: 'vertical', lineHeight: 1.55,
          transition: 'border-color 0.18s',
        }}
        onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
        onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
      />

      <div style={{
        marginTop: 10, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 10,
      }}>
        <span style={{
          fontSize: 10, color: remaining < 30 ? 'var(--amber-d)' : 'var(--text-3)',
        }}>
          {remaining} karakter tersisa
        </span>
        <button
          onClick={handleSave}
          disabled={text.trim().length < 4 || saved}
          style={{
            padding: '8px 18px', borderRadius: 10,
            border: 'none', fontFamily: 'Poppins',
            fontSize: 12, fontWeight: 700,
            background: text.trim().length >= 4 ? 'var(--primary)' : 'var(--surface-3)',
            color: text.trim().length >= 4 ? '#fff' : 'var(--text-3)',
            cursor: text.trim().length >= 4 ? 'pointer' : 'not-allowed',
            transition: 'all 0.18s',
          }}>
          {saved ? '✓ Tersimpan' : '💾 Simpan ke Jurnal'}
        </button>
      </div>
    </Card>
  );
};

// ============================================================
// DDx-COMMIT VS FINAL COMPARISON (inline in Debrief)
// ============================================================
const DDxCompareCard = ({ ddxCommit, caseData, examResult }) => {
  if (!ddxCommit) return null;

  const correctDx = caseData.correctDiagnosis || '';
  const finalSelected = examResult?.selectedDiagnosis || null;

  // Loose fuzzy-match: count word overlap
  const tokenize = (s) => (s || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(w => w.length > 3);
  const overlap = (a, b) => {
    const A = new Set(tokenize(a));
    const B = new Set(tokenize(b));
    if (A.size === 0 || B.size === 0) return 0;
    let hit = 0;
    A.forEach(w => { if (B.has(w)) hit++; });
    return hit / Math.max(A.size, 1);
  };

  const dxList = [ddxCommit.dx1, ddxCommit.dx2, ddxCommit.dx3].filter(Boolean);
  const matches = dxList.map(dx => overlap(dx, correctDx));
  const bestMatchIdx = matches.indexOf(Math.max(...matches));
  const bestMatchScore = matches[bestMatchIdx] || 0;
  const isClose = bestMatchScore >= 0.34;
  const isPrimaryRight = bestMatchIdx === 0 && isClose;

  return (
    <Card padding={20} style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 20 }}>🎯</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)' }}>
            Komitmen Diagnosis Anda vs Diagnosis Sebenarnya
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
            Dibuat setelah anamnesis, sebelum pemeriksaan
          </div>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
          background: isPrimaryRight ? 'var(--green-l)' : isClose ? 'var(--amber-l)' : 'var(--red-l)',
          color: isPrimaryRight ? 'var(--green)' : isClose ? 'var(--amber-d)' : 'var(--red-d)',
        }}>
          {isPrimaryRight ? '✓ Dx kerja tepat' : isClose ? '~ Masuk banding' : '✗ Belum tepat'}
        </span>
      </div>

      {/* DDx list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {dxList.map((dx, i) => {
          const score = matches[i];
          const isBest = i === bestMatchIdx && isClose;
          const matchLevel = score >= 0.6 ? 'tinggi' : score >= 0.34 ? 'sebagian' : 'rendah';
          const matchColor = score >= 0.6 ? 'var(--green)' : score >= 0.34 ? 'var(--amber)' : 'var(--text-3)';
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 12,
              background: isBest ? 'var(--green-l)' : 'var(--surface-2)',
              border: `1.5px solid ${isBest ? 'var(--green)40' : 'transparent'}`,
            }}>
              <div style={{
                flexShrink: 0, width: 26, height: 26, borderRadius: 8,
                background: isBest ? 'var(--green)' : 'var(--surface)',
                color: isBest ? '#fff' : 'var(--text-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800,
              }}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 600, lineHeight: 1.4 }}>
                  {dx}
                </div>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, color: matchColor,
                textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0,
              }}>
                kecocokan {matchLevel}
              </span>
            </div>
          );
        })}
      </div>

      {/* Reasoning if provided */}
      {ddxCommit.reasoning && (
        <div style={{
          padding: '10px 14px', background: 'var(--surface-2)',
          borderLeft: '3px solid var(--primary)', borderRadius: '4px 10px 10px 4px',
          fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55, marginBottom: 14,
          fontStyle: 'italic',
        }}>
          "{ddxCommit.reasoning}"
        </div>
      )}

      {/* Correct dx + final selected */}
      <div style={{
        padding: '12px 14px', background: 'var(--primary-ll)',
        border: '1px solid var(--primary-l)', borderRadius: 12,
      }}>
        <div style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
          Diagnosis Sebenarnya
        </div>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)' }}>{correctDx}</div>
        {finalSelected && finalSelected !== correctDx && (
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
            Pilihan akhir Anda di pemeriksaan: <strong>{finalSelected}</strong>
          </div>
        )}
      </div>
    </Card>
  );
};

// ============================================================
// JOURNAL LIST  (inside Profile screen)
// ============================================================
const JournalList = ({ profile, onUpdate }) => {
  const [expanded, setExpanded] = React.useState(false);
  const entries = profile.journalEntries || [];

  if (entries.length === 0) {
    return (
      <Card padding={20}>
        <div style={{ textAlign: 'center', padding: '14px 0', color: 'var(--text-3)' }}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>📓</div>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--text-2)' }}>
            Belum ada entri jurnal
          </div>
          <div style={{ fontSize: 11, lineHeight: 1.5 }}>
            Setelah menyelesaikan kasus, tambahkan refleksi singkat di debrief
            — sistem akan mengumpulkannya di sini.
          </div>
        </div>
      </Card>
    );
  }

  const visible = expanded ? entries : entries.slice(0, 4);

  const handleDelete = (id) => {
    const next = { ...profile, journalEntries: entries.filter(e => e.id !== id) };
    try { saveProfile(next); } catch (e) {}
    onUpdate && onUpdate(next);
  };

  return (
    <Card padding={18}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visible.map(e => (
          <div key={e.id} style={{
            padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 12,
            position: 'relative',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              gap: 10, marginBottom: 6,
            }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.4 }}>
                  {e.caseTitle}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
                  {fmtJournalDate(e.timestamp)}
                  {typeof e.score === 'number' && (
                    <> · Skor <strong style={{ color: e.score >= 75 ? 'var(--green)' : 'var(--amber-d)' }}>{e.score}</strong></>
                  )}
                  {e.caseType === 'osce' && <> · <span style={{ color: 'var(--red-d)', fontWeight: 700 }}>OSCE</span></>}
                </div>
              </div>
              <button
                onClick={() => handleDelete(e.id)}
                title="Hapus entri"
                style={{
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  color: 'var(--text-3)', fontSize: 14, padding: 4, borderRadius: 6,
                }}
                onMouseEnter={ev => { ev.currentTarget.style.color = 'var(--red)'; ev.currentTarget.style.background = 'var(--red-l)'; }}
                onMouseLeave={ev => { ev.currentTarget.style.color = 'var(--text-3)'; ev.currentTarget.style.background = 'transparent'; }}
              >×</button>
            </div>
            <div style={{
              fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55,
              fontStyle: 'italic',
            }}>
              "{e.text}"
            </div>
          </div>
        ))}
      </div>

      {entries.length > 4 && (
        <button onClick={() => setExpanded(v => !v)} style={{
          width: '100%', marginTop: 12, padding: '10px',
          border: '1px dashed var(--border)', borderRadius: 10,
          background: 'transparent', cursor: 'pointer',
          color: 'var(--primary)', fontSize: 12, fontWeight: 700, fontFamily: 'Poppins',
        }}>
          {expanded ? '↑ Tutup' : `↓ Lihat ${entries.length - 4} entri lainnya`}
        </button>
      )}
    </Card>
  );
};

// Expose globally so other scripts can use these without an import chain
Object.assign(window, {
  DDxCommitScreen, ReflectionCard, DDxCompareCard, JournalList,
  saveJournalEntry, fmtJournalDate,
});
