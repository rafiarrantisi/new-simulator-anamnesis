// Backend client (kontrak §6, session-gated). Envelope { success,data,error }.
import type { ExamFindings, ExamScoringReport, StudentExamRecord } from './types';

interface Envelope<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export class ExamClient {
  constructor(
    private apiBase: string,
    private sessionId: string,
    private token: string,
  ) {}

  private url(suffix: string): string {
    const base = this.apiBase.replace(/\/$/, '');
    return `${base}/api/sessions/${this.sessionId}${suffix}`;
  }

  private headers(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.token}`,
    };
  }

  private async unwrap<T>(res: Response): Promise<T> {
    let body: Envelope<T> | null = null;
    try {
      body = (await res.json()) as Envelope<T>;
    } catch {
      throw new Error(`HTTP ${res.status} (respons bukan JSON)`);
    }
    if (!res.ok || !body || body.success !== true || body.data == null) {
      throw new Error(body?.error || `HTTP ${res.status}`);
    }
    return body.data;
  }

  // Ground truth HANYA via sesi yang dimiliki (anti-cheat, kontrak §3B.1).
  async loadFindings(): Promise<ExamFindings> {
    const res = await fetch(this.url('/exam-findings'), { headers: this.headers() });
    return this.unwrap<ExamFindings>(res);
  }

  // Skor dihitung SERVER-side; UI tak pernah menilai sendiri.
  async submit(record: StudentExamRecord): Promise<ExamScoringReport> {
    const res = await fetch(this.url('/exam'), {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(record),
    });
    return this.unwrap<ExamScoringReport>(res);
  }

  async report(): Promise<ExamScoringReport> {
    const res = await fetch(this.url('/exam-report'), { headers: this.headers() });
    return this.unwrap<ExamScoringReport>(res);
  }
}
