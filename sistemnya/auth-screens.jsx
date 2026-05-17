// ============================================================
// OphthaSim — Landing & Login screens
// Matches main app's visual system (Poppins, primary #5865F2,
// EyeOrb motifs, dot-grid background, rounded cards).
// ============================================================

// ── Shared: decorative floating eye cluster ───────────────
const FloatingEyes = () => (
  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
    {/* big orb */}
    <div style={{ position: 'absolute', right: '8%', top: '12%' }}>
      <EyeOrb size={180} tone="normal" animate={true} />
    </div>
    {/* mid orbs */}
    <div style={{ position: 'absolute', left: '6%', top: '38%' }}>
      <EyeOrb size={88} tone="cooperative" animate={true} />
    </div>
    <div style={{ position: 'absolute', right: '28%', bottom: '14%' }}>
      <EyeOrb size={64} tone="worried" animate={true} />
    </div>
    {/* small orbs */}
    <div style={{ position: 'absolute', left: '22%', bottom: '22%' }}>
      <EyeOrb size={48} tone="tired" animate={true} />
    </div>
    <div style={{ position: 'absolute', right: '4%', bottom: '34%' }}>
      <EyeOrb size={40} tone="anxious" animate={true} />
    </div>
    {/* concentric rings background */}
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: -1 }}
         viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
      <circle cx="200" cy="200" r="160" fill="none" stroke="rgba(88,101,242,0.08)" strokeWidth="1" />
      <circle cx="200" cy="200" r="120" fill="none" stroke="rgba(88,101,242,0.10)" strokeWidth="1" />
      <circle cx="200" cy="200" r="80"  fill="none" stroke="rgba(88,101,242,0.12)" strokeWidth="1" />
      <circle cx="200" cy="200" r="40"  fill="none" stroke="rgba(88,101,242,0.16)" strokeWidth="1" />
    </svg>
  </div>
);

// ── Landing logo (slightly larger than header version) ────
const BrandLogo = ({ size = 'md', light = false }) => {
  const s = size === 'lg' ? { orb: 40, title: 18, sub: 10 } : { orb: 32, title: 14, sub: 9 };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <EyeOrb size={s.orb} tone="normal" animate={false} />
      <div>
        <div style={{ fontSize: s.title, fontWeight: 800, color: light ? '#fff' : 'var(--text-1)', lineHeight: 1, letterSpacing: '-0.01em' }}>OphthaSim</div>
        <div style={{ fontSize: s.sub, color: light ? 'rgba(255,255,255,0.7)' : 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>Ophthalmology Edition</div>
      </div>
    </div>
  );
};

// ============================================================
// LANDING SCREEN
// ============================================================
const LandingScreen = ({ onLogin, onSignup }) => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(245,247,255,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 32px', height: 68,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <BrandLogo size="md" />
        <nav style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {['Fitur', 'Cara Pakai', 'Untuk Siapa'].map((label, i) => (
            <a key={label} href={`#section-${i}`} style={{
              padding: '8px 14px', fontSize: 13, color: 'var(--text-2)', fontWeight: 500,
              borderRadius: 10, transition: 'all 0.18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-2)'; }}>
              {label}
            </a>
          ))}
          <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 8px' }} />
          <Btn variant="ghost" size="sm" onClick={onLogin}>Masuk</Btn>
          <Btn variant="primary" size="sm" onClick={onSignup} icon="→">Mulai Gratis</Btn>
        </nav>
      </header>

      {/* ── HERO ── */}
      <section style={{
        maxWidth: 1200, margin: '0 auto', padding: '64px 24px 40px',
        display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 56, alignItems: 'center',
        width: '100%',
      }}>
        <div className="au">
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--primary-l)', color: 'var(--primary)',
            borderRadius: 999, padding: '6px 14px',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            marginBottom: 22, border: '1px solid var(--primary)20',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: 'var(--green)',
              boxShadow: '0 0 0 4px rgba(16,185,129,0.18)',
            }} />
            Versi Beta · Untuk Dokter Muda
          </div>
          <h1 style={{
            fontSize: 56, fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.02em',
            color: 'var(--text-1)', marginBottom: 20,
          }}>
            Latih anamnesis<br />
            <span style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, #8B5CF6 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>mata kamu</span>, kapan saja.
          </h1>
          <p style={{ fontSize: 17, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 36, maxWidth: 520 }}>
            Simulator pasien virtual untuk skill anamnesis & pemeriksaan oftalmologi.
            Kasus realistis, scoring otomatis, dan feedback langsung — siap-siap OSCE tanpa keringat dingin.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 36 }}>
            <Btn variant="primary" size="lg" onClick={onSignup} icon="▶">Coba Gratis Sekarang</Btn>
            <Btn variant="secondary" size="lg" onClick={onLogin}>Masuk Akun</Btn>
          </div>
          {/* Trust strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: ['var(--primary-l)','var(--teal-l)','var(--amber-l)','var(--violet-l)'][i-1],
                  border: '2px solid var(--surface)',
                  marginLeft: i === 1 ? 0 : -10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700,
                  color: ['var(--primary)','var(--teal-d)','var(--amber-d)','var(--violet)'][i-1],
                }}>{['RR','AS','MK','DP'][i-1]}</div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>
                <span style={{ color: 'var(--amber)' }}>★★★★★</span> 4.9 / 5
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Dari 312+ mahasiswa kedokteran</div>
            </div>
          </div>
        </div>

        {/* ── Hero visual ── */}
        <div className="as d2" style={{
          position: 'relative', height: 480,
        }}>
          {/* Background gradient blob */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(circle at 50% 50%, rgba(88,101,242,0.10), transparent 65%)',
            borderRadius: 32,
          }} />
          <FloatingEyes />

          {/* Floating mini cards */}
          <div style={{
            position: 'absolute', left: '-4%', top: '24%',
            background: 'var(--surface)', borderRadius: 16, padding: '12px 16px',
            boxShadow: 'var(--sh-lg)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 10,
            animation: 'fadeUp 0.8s var(--ease-in) 0.4s both',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12, background: 'var(--green-l)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>✓</div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>Red flag terdeteksi</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Mata merah akut</div>
            </div>
          </div>

          <div style={{
            position: 'absolute', right: '-2%', top: '8%',
            background: 'var(--surface)', borderRadius: 16, padding: '14px 18px',
            boxShadow: 'var(--sh-lg)', border: '1px solid var(--border)',
            animation: 'fadeUp 0.8s var(--ease-in) 0.6s both',
          }}>
            <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>OSCE Score</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>87%</div>
            <div style={{
              marginTop: 8, width: 110, height: 5, background: 'var(--surface-2)',
              borderRadius: 999, overflow: 'hidden',
            }}>
              <div style={{
                width: '87%', height: '100%',
                background: 'linear-gradient(90deg, var(--primary), #8B5CF6)',
                borderRadius: 999,
              }} />
            </div>
          </div>

          <div style={{
            position: 'absolute', right: '10%', bottom: '4%',
            background: 'var(--surface)', borderRadius: 16, padding: '12px 16px',
            boxShadow: 'var(--sh-lg)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 10,
            animation: 'fadeUp 0.8s var(--ease-in) 0.8s both',
          }}>
            <div style={{ fontSize: 22 }}>🏅</div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>Badge baru</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Sharp Eye</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px 40px', width: '100%' }}>
        <div className="au" style={{
          background: 'var(--surface)', borderRadius: 24, padding: '28px 32px',
          border: '1px solid var(--border)', boxShadow: 'var(--sh-sm)',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
        }}>
          {[
            { v: '12+', l: 'Kasus Klinis', c: 'var(--primary)' },
            { v: '5',   l: 'Stasiun Pemeriksaan', c: 'var(--teal)' },
            { v: '300+', l: 'Mahasiswa Aktif', c: 'var(--amber)' },
            { v: '94%', l: 'Lulus OSCE', c: 'var(--violet)' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', position: 'relative' }}>
              {i > 0 && <div style={{ position: 'absolute', left: -8, top: '10%', bottom: '10%', width: 1, background: 'var(--border)' }} />}
              <div style={{ fontSize: 36, fontWeight: 800, color: s.c, lineHeight: 1, letterSpacing: '-0.02em' }}>{s.v}</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 6, fontWeight: 500 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="section-0" style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 24px', width: '100%' }}>
        <div className="au" style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--teal-l)', color: 'var(--teal-d)',
            borderRadius: 999, padding: '5px 14px',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            marginBottom: 18,
          }}>Apa yang kamu dapat</div>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-1)', marginBottom: 12, letterSpacing: '-0.02em' }}>
            Semua yang kamu butuhkan, di satu tempat.
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-2)', maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>
            Dari anamnesis hingga pemeriksaan mata lengkap — semua di rancang sesuai standar OSCE Indonesia.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {[
            { icon: '💬', color: 'var(--primary)', bg: 'var(--primary-l)',
              title: 'Anamnesis Realistik',
              desc: 'Tanya jawab dengan pasien virtual yang merespon secara alami. Setiap pertanyaan dinilai sesuai domain klinis.' },
            { icon: '🔬', color: 'var(--teal-d)', bg: 'var(--teal-l)',
              title: 'Pemeriksaan Klinis',
              desc: '5 stasiun lengkap — visus, pupil, tonometri, slit lamp, fundus. Interactive, bukan sekedar baca teks.' },
            { icon: '⏱️', color: 'var(--amber-d)', bg: 'var(--amber-l)',
              title: 'Mode OSCE 7 Menit',
              desc: 'Simulasi ujian sesungguhnya. Timer berjalan, scoring sesuai rubrik, debrief instan setelah sesi.' },
            { icon: '📚', color: 'var(--violet)', bg: 'var(--violet-l)',
              title: 'Library 12+ Kasus',
              desc: 'Dari konjungtivitis hingga acute angle closure. Tingkat kesulitan Easy, Medium, Hard.' },
            { icon: '🏅', color: 'var(--gold)', bg: 'var(--gold-l)',
              title: 'Gamifikasi & Badge',
              desc: 'Naik level, koleksi badge, jaga streak. Belajar terasa seperti main game — tapi tetap serius.' },
            { icon: '✏️', color: 'var(--rose)', bg: 'var(--rose-l)',
              title: 'Buat Kasus Sendiri',
              desc: 'Case builder untuk dosen — bikin skenario kustom, atur dialog pasien, tetapkan domain scoring.' },
          ].map((f, i) => (
            <div key={i} className={`au d${i+1}`}>
              <Card padding={24} hover>
                <div style={{
                  width: 52, height: 52, borderRadius: 16, background: f.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26, marginBottom: 16,
                }}>{f.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{f.desc}</p>
              </Card>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="section-1" style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
        padding: '64px 24px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="au" style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'var(--amber-l)', color: 'var(--amber-d)',
              borderRadius: 999, padding: '5px 14px',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              marginBottom: 18,
            }}>Cara Pakai</div>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-1)', marginBottom: 12, letterSpacing: '-0.02em' }}>
              Tiga langkah, dari awam ke siap OSCE.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, position: 'relative' }}>
            {/* connector line */}
            <div style={{
              position: 'absolute', left: '16.66%', right: '16.66%', top: 36,
              height: 2, background: 'repeating-linear-gradient(90deg, var(--border-2) 0 8px, transparent 8px 16px)',
              zIndex: 0,
            }} />
            {[
              { n: '01', icon: '📋', title: 'Pilih Kasus', desc: 'Browse library — ada kasus mata merah, penglihatan kabur, mata sakit, dan banyak lagi. Pilih sesuai topik yang mau kamu latih.' },
              { n: '02', icon: '👁️', title: 'Anamnesis & Periksa', desc: 'Ngobrol dengan pasien virtual, periksa visus dan slit lamp. Setiap aksi dinilai real-time terhadap rubrik OSCE.' },
              { n: '03', icon: '🎯', title: 'Diagnosis & Debrief', desc: 'Tetapkan diagnosis akhir. Dapat feedback lengkap, score, badge, dan ringkasan kenapa kamu benar atau salah.' },
            ].map((s, i) => (
              <div key={i} className={`au d${i+2}`} style={{ position: 'relative', zIndex: 1 }}>
                <Card padding={28} hover={false} style={{ textAlign: 'center', position: 'relative' }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: 24,
                    background: 'linear-gradient(135deg, var(--primary), #8B5CF6)',
                    color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 32, margin: '0 auto 18px',
                    boxShadow: '0 8px 24px rgba(88,101,242,0.3)',
                  }}>{s.icon}</div>
                  <div style={{
                    fontSize: 10, fontWeight: 800, color: 'var(--primary)',
                    letterSpacing: '0.14em', marginBottom: 8,
                  }}>LANGKAH {s.n}</div>
                  <h3 style={{ fontSize: 19, fontWeight: 700, color: 'var(--text-1)', marginBottom: 10 }}>{s.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{s.desc}</p>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOR WHO ── */}
      <section id="section-2" style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 24px', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <div className="au">
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'var(--violet-l)', color: 'var(--violet)',
              borderRadius: 999, padding: '5px 14px',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              marginBottom: 18,
            }}>Untuk Siapa</div>
            <h2 style={{ fontSize: 34, fontWeight: 800, color: 'var(--text-1)', marginBottom: 16, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              Co-ass, residen, dosen — semua bisa pakai.
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 24 }}>
              Dirancang oleh dokter mata praktisi & developer dengan latar pendidikan. Mau persiapan OSCE,
              latihan mandiri sebelum stase, atau alat ajar di kampus — semuanya jalan.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { icon: '🎓', text: 'Mahasiswa S1 Kedokteran — persiapan OSCE & stase Mata' },
                { icon: '👨‍⚕️', text: 'Dokter Muda / Internsip — refresh skill anamnesis sebelum praktik' },
                { icon: '📖', text: 'Dosen Klinik — bikin kasus kustom buat mahasiswa' },
              ].map((it, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, background: 'var(--primary-l)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                    flexShrink: 0,
                  }}>{it.icon}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-1)', fontWeight: 500 }}>{it.text}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial card */}
          <div className="au d2">
            <Card padding={32} hover={false} style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, #8B5CF6 100%)',
              color: '#fff', border: 'none', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', right: -40, top: -40,
                width: 200, height: 200, borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.1)',
              }} />
              <div style={{
                position: 'absolute', right: -10, top: -10,
                width: 120, height: 120, borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.18)',
              }} />
              <div style={{ fontSize: 64, lineHeight: 1, opacity: 0.3, marginBottom: -20 }}>"</div>
              <p style={{ fontSize: 17, lineHeight: 1.6, fontWeight: 500, marginBottom: 24, position: 'relative' }}>
                Sebelum OSCE Mata, gua latihan 3 kasus di OphthaSim tiap malam.
                Pas hari H, anamnesis pasien beneran berasa familiar. Lulus dengan score 89.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 15,
                  border: '2px solid rgba(255,255,255,0.3)',
                }}>RA</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Rizky Alamsyah</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>Co-ass Stase Mata, FK Unair</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 80px', width: '100%' }}>
        <div className="au" style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, #8B5CF6 50%, #6366F1 100%)',
          borderRadius: 32, padding: '56px 48px',
          position: 'relative', overflow: 'hidden', color: '#fff',
          textAlign: 'center',
        }}>
          {/* decorative rings */}
          <div style={{ position: 'absolute', right: -80, top: -80, width: 320, height: 320, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', right: -20, bottom: -120, width: 280, height: 280, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)' }} />
          <div style={{ position: 'absolute', left: -60, top: -40, width: 220, height: 220, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', left: 20, bottom: -80, width: 160, height: 160, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.12)' }} />

          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <EyeOrb size={64} tone="_" color="#fff" animate={true} />
            </div>
            <h2 style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.1, marginBottom: 14, letterSpacing: '-0.02em' }}>
              Siap jadi dokter mata yang mantap?
            </h2>
            <p style={{ fontSize: 16, opacity: 0.9, marginBottom: 32, maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.6 }}>
              Daftar sekarang, gratis selamanya untuk mahasiswa. Akses semua kasus dasar tanpa kartu kredit.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Btn size="lg" variant="primary" onClick={onSignup}
                style={{ background: '#fff', color: 'var(--primary)', boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }}
                icon="▶">
                Mulai Gratis — 2 menit
              </Btn>
              <Btn size="lg" variant="ghost" onClick={onLogin}
                style={{ color: '#fff', border: '1.5px solid rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.1)' }}>
                Sudah punya akun? Masuk
              </Btn>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid var(--border)', background: 'var(--surface)',
        padding: '32px 24px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <BrandLogo size="md" />
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
            © 2026 OphthaSim · Dibuat dengan ❤️ untuk dokter muda Indonesia
          </div>
          <div style={{ display: 'flex', gap: 18 }}>
            {['Tentang','Privasi','Kontak'].map(l => (
              <a key={l} href="#" style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

// ── Auth form field (defined OUTSIDE LoginScreen to avoid remount on every keystroke) ──
const AuthField = ({ label, type = 'text', value, onChange, placeholder, icon, right, autoFocus }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.01em' }}>{label}</span>
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      {icon && (
        <span style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          fontSize: 16, color: 'var(--text-3)', pointerEvents: 'none',
        }}>{icon}</span>
      )}
      <input
        type={type} value={value} onChange={onChange}
        placeholder={placeholder} autoFocus={autoFocus}
        style={{
          width: '100%',
          padding: icon ? '13px 16px 13px 42px' : '13px 16px',
          paddingRight: right ? 46 : 16,
          borderRadius: 14, border: '1.5px solid var(--border)',
          fontSize: 14, color: 'var(--text-1)', background: 'var(--surface)',
          outline: 'none', transition: 'all 0.18s ease', fontFamily: 'Poppins',
        }}
        onFocus={(e) => { e.target.style.border = '1.5px solid var(--primary)'; e.target.style.boxShadow = '0 0 0 4px var(--primary-glow)'; }}
        onBlur={(e) => { e.target.style.border = '1.5px solid var(--border)'; e.target.style.boxShadow = 'none'; }}
      />
      {right}
    </div>
  </label>
);

// ============================================================
// LOGIN SCREEN
// ============================================================
const LoginScreen = ({ onLogin, onBack, onGoSignup, mode = 'login' }) => {
  const [isSignup, setIsSignup] = React.useState(mode === 'signup');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [showPw, setShowPw] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validPw = password.length >= 6;
  const validName = !isSignup || name.trim().length >= 2;
  const formValid = validEmail && validPw && validName;

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!formValid) {
      if (!validEmail) setError('Email tidak valid');
      else if (!validPw) setError('Password minimal 6 karakter');
      else if (!validName) setError('Nama wajib diisi');
      return;
    }
    setSubmitting(true);
    setError('');

    // C2 (kontrak v0.6.1): autentikasi nyata via DataStore bila backend
    // dikonfigurasi (window.OPHTHA_API_BASE). Tanpa backend → mock lama
    // (offline/dev) tetap jalan persis.
    const apiOn = typeof window !== 'undefined' && window.OPHTHA_API_BASE && window.ApiDataStore;

    if (!apiOn) {
      setTimeout(() => {
        onLogin({ email, name: name || email.split('@')[0] });
      }, 900);
      return;
    }

    const store = window.ApiDataStore;
    const action = isSignup
      ? store.signup({ email, password, full_name: name })
      : store.login(email, password);

    action.then((session) => {
      onLogin({
        email,
        name: name || email.split('@')[0],
        token: session && session.token,
        userId: session && session.user_id,
        role: session && session.role,
      });
    }).catch((err) => {
      setSubmitting(false);
      setError(
        (err && err.message)
          ? 'Gagal masuk: ' + err.message
          : 'Gagal terhubung ke server. Coba lagi.'
      );
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid', gridTemplateColumns: '1fr 1fr',
    }}>
      {/* ── LEFT — Form ── */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        padding: '32px 40px',
        minHeight: '100vh',
        position: 'relative', zIndex: 1,
      }}>
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'auto' }}>
          <div style={{ cursor: 'pointer' }} onClick={onBack}>
            <BrandLogo size="md" />
          </div>
          <button onClick={onBack} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 12,
            border: '1px solid var(--border)', background: 'var(--surface)',
            fontSize: 12, fontWeight: 600, color: 'var(--text-2)',
            cursor: 'pointer', fontFamily: 'Poppins',
            transition: 'all 0.18s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)'; }}
          >← Kembali ke beranda</button>
        </div>

        {/* Form */}
        <div className="au" style={{
          maxWidth: 420, margin: '40px auto', width: '100%',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--primary-l)', color: 'var(--primary)',
            borderRadius: 999, padding: '5px 12px',
            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            marginBottom: 18,
          }}>
            {isSignup ? '✨ Buat Akun Baru' : '👋 Selamat datang kembali'}
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-1)', marginBottom: 10, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            {isSignup ? 'Mulai latihan kamu hari ini.' : 'Masuk ke OphthaSim.'}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 28, lineHeight: 1.6 }}>
            {isSignup
              ? 'Gratis untuk mahasiswa. Akses 12+ kasus klinis & semua mode latihan.'
              : 'Lanjutkan progress kamu — streak, badge, dan kasus tersimpan.'}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {isSignup && (
              <AuthField
                label="Nama lengkap"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                placeholder="dr. Citra (calon)"
                icon="👤"
                autoFocus
              />
            )}
            <AuthField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="citra@kampus.ac.id"
              icon="✉️"
              autoFocus={!isSignup}
            />
            <AuthField
              label="Password"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder={isSignup ? 'Minimal 6 karakter' : 'Password kamu'}
              icon="🔒"
              right={
                <button type="button" onClick={() => setShowPw(s => !s)} style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  width: 32, height: 32, borderRadius: 8,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  fontSize: 14, color: 'var(--text-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} title={showPw ? 'Sembunyikan' : 'Tampilkan'}>
                  {showPw ? '🙈' : '👁️'}
                </button>
              }
            />

            {!isSignup && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                  <span
                    onClick={() => setRemember(r => !r)}
                    style={{
                      width: 18, height: 18, borderRadius: 5,
                      border: `1.5px solid ${remember ? 'var(--primary)' : 'var(--border-2)'}`,
                      background: remember ? 'var(--primary)' : 'var(--surface)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 11, fontWeight: 800,
                      transition: 'all 0.18s var(--ease-hover)',
                    }}
                  >{remember ? '✓' : ''}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>Ingat saya</span>
                </label>
                <a href="#" onClick={(e) => e.preventDefault()} style={{
                  fontSize: 12, color: 'var(--primary)', fontWeight: 600,
                }}>Lupa password?</a>
              </div>
            )}

            {error && (
              <div className="af" style={{
                background: 'var(--red-l)', color: 'var(--red-d)',
                padding: '10px 14px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                border: '1px solid var(--red)30',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 14 }}>⚠️</span> {error}
              </div>
            )}

            <button type="submit" disabled={submitting} style={{
              padding: '14px 22px', fontSize: 14, fontWeight: 700,
              background: submitting ? 'var(--primary-h)' : 'var(--primary)',
              color: '#fff', border: 'none', borderRadius: 14,
              boxShadow: submitting ? 'none' : '0 4px 16px var(--primary-glow)',
              cursor: submitting ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'all 0.2s var(--ease-hover)',
              fontFamily: 'Poppins',
            }}>
              {submitting ? (
                <>
                  <span style={{
                    width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                  {isSignup ? 'Membuat akun…' : 'Masuk…'}
                </>
              ) : (
                <>{isSignup ? 'Buat Akun' : 'Masuk'} →</>
              )}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>atau</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            {/* Social */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { name: 'Google', icon: (
                  <svg width="16" height="16" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
                    <path fill="#4CAF50" d="M24 44c5.2 0 9.8-2 13.3-5.2l-6.1-5.2c-2.1 1.5-4.7 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8L6.1 33C9.3 39.7 16.1 44 24 44z"/>
                    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.1 5.2C40.5 35.5 44 30.2 44 24c0-1.3-.1-2.4-.4-3.5z"/>
                  </svg>
                ) },
                { name: 'Microsoft', icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
                    <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
                    <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
                    <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
                  </svg>
                ) },
              ].map(p => (
                <button key={p.name} type="button" style={{
                  padding: '11px 14px', borderRadius: 12,
                  border: '1.5px solid var(--border)', background: 'var(--surface)',
                  fontSize: 13, fontWeight: 600, color: 'var(--text-1)',
                  cursor: 'pointer', fontFamily: 'Poppins',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.18s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-ll)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)'; }}
                >
                  {p.icon}
                  <span>{p.name}</span>
                </button>
              ))}
            </div>

            <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-2)', marginTop: 10 }}>
              {isSignup ? 'Sudah punya akun? ' : 'Belum punya akun? '}
              <a href="#" onClick={(e) => { e.preventDefault(); setIsSignup(s => !s); setError(''); }} style={{
                color: 'var(--primary)', fontWeight: 700,
              }}>{isSignup ? 'Masuk di sini' : 'Daftar gratis'}</a>
            </div>
          </form>
        </div>

        {/* footer note */}
        <div style={{ marginTop: 'auto', fontSize: 11, color: 'var(--text-3)', textAlign: 'center', paddingTop: 24 }}>
          Dengan masuk, kamu menyetujui Syarat & Ketentuan dan Kebijakan Privasi OphthaSim.
        </div>
      </div>

      {/* ── RIGHT — Decorative panel ── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, #8B5CF6 50%, #6366F1 100%)',
        position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '40px 48px',
        color: '#fff',
      }}>
        {/* concentric circles */}
        <div style={{ position: 'absolute', right: -120, top: -120, width: 500, height: 500, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', right: -40, top: -40, width: 360, height: 360, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'absolute', right: 60, top: 80, width: 240, height: 240, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.12)' }} />
        <div style={{ position: 'absolute', left: -80, bottom: -80, width: 320, height: 320, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)' }} />

        {/* Top quote */}
        <div style={{ position: 'relative', maxWidth: 440 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.15)', borderRadius: 999, padding: '5px 14px',
            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            marginBottom: 24, backdropFilter: 'blur(8px)',
          }}>
            <span style={{ fontSize: 12 }}>👁️</span> Virtual Patient Simulator
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            Tiap pasien<br />virtual, satu<br />pelajaran baru.
          </h2>
        </div>

        {/* Middle: floating eye composition */}
        <div style={{ position: 'relative', height: 280, margin: '24px 0' }}>
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
            <div style={{
              width: 220, height: 220, borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.18)',
              backdropFilter: 'blur(8px)',
              animation: 'irisBreath 4s ease-in-out infinite',
            }}>
              <svg width="160" height="160" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.6" />
                <circle cx="40" cy="40" r="28" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
                  const rad = (deg * Math.PI) / 180;
                  return (
                    <line key={i}
                      x1={40 + Math.cos(rad) * 14} y1={40 + Math.sin(rad) * 14}
                      x2={40 + Math.cos(rad) * 24} y2={40 + Math.sin(rad) * 24}
                      stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
                  );
                })}
                <circle cx="40" cy="40" r="26" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" />
                <circle cx="40" cy="40" r="13" fill="#fff" opacity="0.95" />
                <circle cx="40" cy="40" r="7" fill="var(--primary)" />
                <circle cx="46" cy="34" r="4" fill="#fff" />
              </svg>
            </div>
          </div>

          {/* Floating badges around the eye */}
          {[
            { x: '6%', y: '10%', label: 'OSCE', icon: '⏱️', delay: '0s' },
            { x: '78%', y: '8%', label: 'Visus', icon: '👁️', delay: '0.5s' },
            { x: '2%', y: '62%', label: 'Slit Lamp', icon: '🔬', delay: '0.3s' },
            { x: '78%', y: '64%', label: 'Fundus', icon: '🌒', delay: '0.7s' },
          ].map((b, i) => (
            <div key={i} style={{
              position: 'absolute', left: b.x, top: b.y,
              background: 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 14, padding: '10px 14px',
              display: 'flex', alignItems: 'center', gap: 8,
              animation: `fadeUp 0.6s var(--ease-in) ${b.delay} both`,
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            }}>
              <span style={{ fontSize: 16 }}>{b.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 700 }}>{b.label}</span>
            </div>
          ))}
        </div>

        {/* Bottom: bullet features */}
        <div style={{ position: 'relative', maxWidth: 440 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: '✓', text: '12+ kasus oftalmologi dengan dialog realistis' },
              { icon: '✓', text: '5 stasiun pemeriksaan interaktif lengkap' },
              { icon: '✓', text: 'Scoring otomatis sesuai rubrik OSCE' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 8,
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800, flexShrink: 0,
                }}>{f.icon}</div>
                <span style={{ fontSize: 14, fontWeight: 500, opacity: 0.95 }}>{f.text}</span>
              </div>
            ))}
          </div>

          {/* avatars trust */}
          <div style={{
            marginTop: 28, padding: '14px 18px',
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{ display: 'flex' }}>
              {['RR','AS','MK','DP'].map((init, i) => (
                <div key={i} style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: ['#FFC4D6','#FFE0B2','#C7E7FF','#D4F4DD'][i],
                  border: '2px solid #fff',
                  marginLeft: i === 0 ? 0 : -10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: '#3d2a4d',
                }}>{init}</div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>312+ mahasiswa sudah bergabung</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>Lulus OSCE Mata dengan score rata-rata 82</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
