// Cermin schema backend (kontrak §5.9 / §3B.2). JANGAN divergen tanpa
// menaikkan versi ARCHITECTURE.md (contract-first §0.3).

export type Eye = 'OD' | 'OS' | 'OU';

export interface VisualAcuityF {
  od?: string | null;
  os?: string | null;
  pinhole_od?: string | null;
  pinhole_os?: string | null;
  near_od?: string | null;
  near_os?: string | null;
}
export interface TonometryF {
  iop_od?: number | null;
  iop_os?: number | null;
  method?: string | null;
}
export interface PupilsF {
  od_size?: number | null;
  os_size?: number | null;
  od_react?: string | null;
  os_react?: string | null;
  rapd?: string | null;
  notes?: string | null;
}
export interface MotilityF {
  full?: boolean | null;
  restrictions?: unknown[];
  notes?: string | null;
}
export interface VisualFieldF {
  od?: string | null;
  os?: string | null;
  defect_pattern?: string | null;
  notes?: string | null;
}
export interface SlitLampF {
  lids?: string | null;
  conjunctiva?: string | null;
  cornea?: string | null;
  anterior_chamber?: string | null;
  iris?: string | null;
  lens?: string | null;
  notes?: string | null;
}
export interface FundusF {
  disc_od?: string | null;
  disc_os?: string | null;
  cdr_od?: number | null;
  cdr_os?: number | null;
  macula_od?: string | null;
  macula_os?: string | null;
  vessels?: string | null;
  periphery?: string | null;
  image_od?: string | null;
  image_os?: string | null;
}

export interface ExamFindings {
  caseId: string;
  affectedEye?: Eye | null;
  visual_acuity?: VisualAcuityF | null;
  tonometry?: TonometryF | null;
  pupils?: PupilsF | null;
  motility?: MotilityF | null;
  visual_field?: VisualFieldF | null;
  slit_lamp?: SlitLampF | null;
  fundus?: FundusF | null;
  color_vision?: Record<string, unknown> | null;
  amsler?: Record<string, unknown> | null;
  fluorescein?: Record<string, unknown> | null;
  draft: boolean;
  source: string;
}

// Weighted (kontrak §3B.2 — masuk examTotalScore 100).
export type StationId =
  | 'visual_acuity'
  | 'pupils_rapd'
  | 'ocular_motility'
  | 'visual_field'
  | 'slit_lamp'
  | 'tonometry'
  | 'fundoscopy';

// Kondisional (dilaporkan, tak ubah examTotalScore). 'color_vision' =
// backend key utk station Ishihara.
export type ConditionalStationId = 'amsler' | 'color_vision' | 'fluorescein';
export type AnyStationId = StationId | ConditionalStationId;

export interface StudentStationRecord {
  recorded: Record<string, unknown>;
  procedureSteps: string[];
  completed: boolean;
}
export interface StudentExamRecord {
  stations: Partial<Record<AnyStationId, StudentStationRecord>>;
}

export interface StationScore {
  score: number;
  max: number;
  detail: unknown[];
}
export interface ExamScoringReport {
  examTotalScore: number;
  stations: Partial<Record<AnyStationId, StationScore>>;
  missedFindings: string[];
  procedureNotes: string[];
  positiveNotes: string[];
}

export interface ExamSimOptions {
  apiBase: string; // window.OPHTHA_API_BASE
  sessionId: string;
  token: string; // Bearer access token (auth nyata C2/§6)
  onExit?: (report: ExamScoringReport | null) => void;
}
