// Zustand store — kontrak §3B.1. Anti-cheat + isolasi per-station (plan §6.1).
//
// PRINSIP ANTI-CHEAT:
//  - Ground truth disimpan privat (`_findings`); UI station TIDAK boleh
//    membaca "jawaban" langsung. Hanya `renderSubstrate(stationId)` yang
//    membuka data yang sah untuk MERENDER simulasi (bukan label nilai).
//  - Skor dihitung SERVER-side (client.submit) — store tak menilai.
//  - Tiap station punya record sendiri; pindah station tak membawa state
//    transient (komponen station pegang UI state lokalnya sendiri).
import { create } from 'zustand';
import { ExamClient } from './client';
import type {
  AnyStationId,
  ExamFindings,
  ExamScoringReport,
  ExamSimOptions,
  StudentStationRecord,
} from './types';

export const STATIONS: { id: AnyStationId; label: string; conditional?: boolean }[] = [
  { id: 'visual_acuity', label: 'Visual Acuity' },
  { id: 'pupils_rapd', label: 'Pupil & RAPD' },
  { id: 'ocular_motility', label: 'Motilitas Okular' },
  { id: 'visual_field', label: 'Lapang Pandang' },
  { id: 'slit_lamp', label: 'Slit Lamp' },
  { id: 'tonometry', label: 'Tonometri' },
  { id: 'fundoscopy', label: 'Funduskopi' },
  { id: 'amsler', label: 'Amsler Grid', conditional: true },
  { id: 'color_vision', label: 'Ishihara', conditional: true },
  { id: 'fluorescein', label: 'Fluorescein', conditional: true },
];

type Phase = 'loading' | 'exam' | 'submitting' | 'debrief' | 'error';

interface ExamState {
  phase: Phase;
  error: string | null;
  current: AnyStationId;
  records: Partial<Record<AnyStationId, StudentStationRecord>>;
  report: ExamScoringReport | null;

  _client: ExamClient | null;
  _findings: ExamFindings | null; // PRIVAT — jangan render sebagai jawaban
  _onExit?: (r: ExamScoringReport | null) => void;

  init: (opts: ExamSimOptions) => Promise<void>;
  navigate: (s: AnyStationId) => void;
  recordStation: (s: AnyStationId, r: StudentStationRecord) => void;
  resetStation: (s: AnyStationId) => void;
  submit: () => Promise<void>;
  exit: () => void;

  // Substrate render yang SAH untuk station (bukan label nilai). Pilot VA
  // tak butuh apa-apa → {} (mahasiswa wajib menggali, plan §5.1).
  renderSubstrate: (s: AnyStationId) => Record<string, unknown>;
}

export const useExam = create<ExamState>((set, get) => ({
  phase: 'loading',
  error: null,
  current: 'visual_acuity',
  records: {},
  report: null,
  _client: null,
  _findings: null,

  async init(opts) {
    const client = new ExamClient(opts.apiBase, opts.sessionId, opts.token);
    set({ _client: client, _onExit: opts.onExit, phase: 'loading', error: null });
    try {
      const findings = await client.loadFindings();
      set({ _findings: findings, phase: 'exam' });
    } catch (e) {
      set({ phase: 'error', error: e instanceof Error ? e.message : String(e) });
    }
  },

  navigate(s) {
    set({ current: s });
  },

  recordStation(s, r) {
    set((st) => ({ records: { ...st.records, [s]: r } }));
  },

  resetStation(s) {
    set((st) => {
      const next = { ...st.records };
      delete next[s];
      return { records: next };
    });
  },

  async submit() {
    const { _client, records } = get();
    if (!_client) return;
    set({ phase: 'submitting', error: null });
    try {
      const report = await _client.submit({ stations: records });
      set({ report, phase: 'debrief' });
    } catch (e) {
      set({ phase: 'error', error: e instanceof Error ? e.message : String(e) });
    }
  },

  exit() {
    const { _onExit, report } = get();
    _onExit?.(report);
  },

  renderSubstrate(s) {
    const f = get()._findings;
    if (!f) return {};
    // Substrat visual SAH (mahasiswa lihat→tafsir, BUKAN label jawaban).
    // Anti-cheat: hanya parameter render turunan, label tekstual tak dibuka.
    switch (s) {
      case 'pupils_rapd': {
        const p = f.pupils ?? {};
        // Fisiologi pupil (plan §5.2). rapd dipakai utk menganimasi
        // paradoxical dilation — mahasiswa harus MENYIMPULKAN sendiri.
        const dim = (v?: number | null, d = 5) => (typeof v === 'number' ? v : d);
        return {
          odDim: dim(p.od_size, 5),
          osDim: dim(p.os_size, 5),
          odBright: 3,
          osBright: 3,
          rapd: (p.rapd ?? 'none') as string, // dipakai mesin animasi saja
          odReactive: (p.od_react ?? 'brisk') as string,
          osReactive: (p.os_react ?? 'brisk') as string,
        };
      }
      case 'ocular_motility': {
        const m = f.motility ?? {};
        return {
          full: m.full ?? true,
          restrictions: JSON.stringify(m.restrictions ?? []),
          notes: m.notes ?? '',
        };
      }
      case 'visual_field': {
        const v = f.visual_field ?? {};
        return {
          od: v.od ?? 'full',
          os: v.os ?? 'full',
          defect_pattern: v.defect_pattern ?? '',
        };
      }
      case 'amsler': {
        const a = f.amsler ?? {};
        return {
          od: (a as Record<string, string>).od ?? 'normal',
          os: (a as Record<string, string>).os ?? 'normal',
        };
      }
      case 'color_vision': {
        const c = (f.color_vision ?? {}) as Record<string, unknown>;
        return {
          od_correct: typeof c.od_correct === 'number' ? c.od_correct : 11,
          os_correct: typeof c.os_correct === 'number' ? c.os_correct : 11,
          total: typeof c.total === 'number' ? c.total : 11,
        };
      }
      case 'tonometry': {
        const t = f.tonometry ?? {};
        return {
          iop_od: typeof t.iop_od === 'number' ? t.iop_od : 15,
          iop_os: typeof t.iop_os === 'number' ? t.iop_os : 15,
        };
      }
      case 'fluorescein': {
        const fl = (f.fluorescein ?? {}) as Record<string, unknown>;
        return {
          pattern: String(fl.pattern ?? 'none'),
          location: String(fl.location ?? ''),
          seidel: fl.seidel === true,
        };
      }
      case 'slit_lamp': {
        const sl = f.slit_lamp ?? {};
        return {
          lids: sl.lids ?? 'normal',
          conjunctiva: sl.conjunctiva ?? 'normal',
          cornea: sl.cornea ?? 'jernih',
          anterior_chamber: sl.anterior_chamber ?? 'dalam dan tenang',
          iris: sl.iris ?? 'normal',
          lens: sl.lens ?? 'jernih',
        };
      }
      case 'fundoscopy': {
        const fu = f.fundus ?? {};
        return {
          disc_od: fu.disc_od ?? 'normal',
          disc_os: fu.disc_os ?? 'normal',
          cdr_od: fu.cdr_od ?? 0.3,
          cdr_os: fu.cdr_os ?? 0.3,
          macula_od: fu.macula_od ?? 'normal',
          macula_os: fu.macula_os ?? 'normal',
          vessels: fu.vessels ?? 'normal',
          periphery: fu.periphery ?? 'normal',
        };
      }
      default:
        return {};
    }
  },
}));
