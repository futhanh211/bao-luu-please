import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { SubmittedCase } from '../data/caseRegistry';
import { getStorageItem, setStorageItem } from '../data/userRegistry';

// Environment variables
const envUrl = typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env.VITE_SUPABASE_URL as string | undefined) : undefined;
const envAnonKey = typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) : undefined;

let clientInstance: SupabaseClient | null = null;
let realtimeChannel: RealtimeChannel | null = null;

function normalizeSupabaseUrl(rawUrl: string): string {
  let cleaned = (rawUrl || '').trim();
  cleaned = cleaned.replace(/\/rest\/v1\/?$/i, '');
  cleaned = cleaned.replace(/\/+$/, '');
  return cleaned;
}

export function getSupabaseConfig(): { url: string; anonKey: string } | null {
  // Ưu tiên cấu hình custom do người dùng cấu hình trực tiếp tại giao diện
  const storedUrl = getStorageItem('bao_luu_custom_supabase_url');
  const storedKey = getStorageItem('bao_luu_custom_supabase_key');
  if (storedUrl && storedKey) {
    return {
      url: normalizeSupabaseUrl(storedUrl),
      anonKey: storedKey.trim(),
    };
  }

  const url = normalizeSupabaseUrl(envUrl || '');
  const anonKey = (envAnonKey || '').trim();
  if (url && anonKey) {
    return { url, anonKey };
  }
  return null;
}

export function saveCustomSupabaseConfig(url: string, key: string): void {
  const cleanedUrl = normalizeSupabaseUrl(url);
  const cleanedKey = key.trim();
  if (cleanedUrl && cleanedKey) {
    setStorageItem('bao_luu_custom_supabase_url', cleanedUrl);
    setStorageItem('bao_luu_custom_supabase_key', cleanedKey);
  } else {
    setStorageItem('bao_luu_custom_supabase_url', '');
    setStorageItem('bao_luu_custom_supabase_key', '');
  }
  clientInstance = null;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseConfig());
}

export function getSupabaseClient(customUrl?: string, customKey?: string): SupabaseClient | null {
  if (customUrl !== undefined || customKey !== undefined) {
    const u = normalizeSupabaseUrl(customUrl || '');
    const k = (customKey || '').trim();
    if (!u || !k) return null;
    try {
      return createClient(u, k);
    } catch (e) {
      console.error('Không thể khởi tạo custom Supabase client:', e);
      return null;
    }
  }

  if (clientInstance) return clientInstance;

  const cfg = getSupabaseConfig();
  if (!cfg) return null;

  try {
    clientInstance = createClient(cfg.url, cfg.anonKey);
    return clientInstance;
  } catch (err) {
    console.error('Lỗi khởi tạo Supabase client:', err);
    return null;
  }
}

export interface SupabaseCaseRow {
  id: string;
  case_code: string;
  student_mssv: string;
  student_name: string;
  student_class?: string;
  student_faculty?: string;
  student_phone?: string;
  student_email?: string;
  form: Record<string, unknown>;
  evidence: unknown[];
  attached_evidence_ids: string[];
  submitted_at: string;
  day?: number;
  status: string;
  advisor_decision?: string | null;
  advisor_decision_at?: string | null;
  advisor_notes?: string | null;
  ctsv_decision?: string | null;
  ctsv_decision_at?: string | null;
  ctsv_marks?: string[] | null;
  ctsv_notes?: string | null;
  principal_signed?: boolean;
  principal_signed_at?: string | null;
  principal_signer_name?: string | null;
  decision_doc?: Record<string, unknown> | null;
  log?: unknown[] | null;
  updated_at?: string;
}

export function toSupabaseRow(c: SubmittedCase): SupabaseCaseRow {
  // Làm sạch tệp minh chứng: thay thế dataUrl base64 quá lớn (>150KB) để bảo đảm không bị lỗi HTTP 413
  const safeEvidence = (c.evidence || []).map((item) => {
    if (item && item.fileData && item.fileData.dataUrl && item.fileData.dataUrl.length > 150000) {
      return {
        ...item,
        fileData: {
          ...item.fileData,
          dataUrl: `[DATA_URL_TRUNCATED_FOR_CLOUD_SYNC_${(item.fileData.size / 1024).toFixed(0)}KB]`,
        },
      };
    }
    return item;
  });

  return {
    id: c.id,
    case_code: c.caseCode,
    student_mssv: c.studentMssv,
    student_name: c.studentName,
    student_class: c.studentClass,
    student_faculty: c.studentFaculty,
    student_phone: c.studentPhone,
    student_email: c.studentEmail,
    form: c.form as unknown as Record<string, unknown>,
    evidence: safeEvidence,
    attached_evidence_ids: c.attachedEvidenceIds || [],
    submitted_at: c.submittedAt,
    day: c.day || 0,
    status: c.status,
    advisor_decision: c.advisorDecision || null,
    advisor_decision_at: c.advisorDecisionAt || null,
    advisor_notes: c.advisorNotes || null,
    ctsv_decision: c.ctsvDecision || null,
    ctsv_decision_at: c.ctsvDecisionAt || null,
    ctsv_marks: c.ctsvMarks || null,
    ctsv_notes: c.ctsvNotes || null,
    principal_signed: Boolean(c.principalSigned),
    principal_signed_at: c.principalSignedAt || null,
    principal_signer_name: c.principalSignerName || null,
    decision_doc: (c.decisionDoc as unknown as Record<string, unknown>) || null,
    log: (c.log as unknown as unknown[]) || null,
    updated_at: new Date().toISOString(),
  };
}

export function fromSupabaseRow(row: SupabaseCaseRow): SubmittedCase {
  return {
    id: row.id,
    caseCode: row.case_code,
    studentMssv: row.student_mssv,
    studentName: row.student_name,
    studentClass: row.student_class || '',
    studentFaculty: row.student_faculty || '',
    studentPhone: row.student_phone,
    studentEmail: row.student_email,
    form: row.form as unknown as SubmittedCase['form'],
    evidence: (row.evidence || []) as unknown as SubmittedCase['evidence'],
    attachedEvidenceIds: row.attached_evidence_ids || [],
    submittedAt: row.submitted_at,
    day: row.day || 0,
    status: row.status as SubmittedCase['status'],
    advisorDecision: (row.advisor_decision as SubmittedCase['advisorDecision']) || undefined,
    advisorDecisionAt: row.advisor_decision_at || undefined,
    advisorNotes: row.advisor_notes || undefined,
    ctsvDecision: (row.ctsv_decision as SubmittedCase['ctsvDecision']) || undefined,
    ctsvDecisionAt: row.ctsv_decision_at || undefined,
    ctsvMarks: row.ctsv_marks || undefined,
    ctsvNotes: row.ctsv_notes || undefined,
    principalSigned: Boolean(row.principal_signed),
    principalSignedAt: row.principal_signed_at || undefined,
    principalSignerName: row.principal_signer_name || undefined,
    decisionDoc: (row.decision_doc as unknown as SubmittedCase['decisionDoc']) || null,
    log: (row.log as unknown as SubmittedCase['log']) || undefined,
  };
}

/**
 * Lấy toàn bộ danh sách hồ sơ từ Supabase Cloud
 */
export async function fetchSupabaseCases(): Promise<SubmittedCase[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('submitted_cases')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('Lỗi Supabase fetch cases:', error.message);
      return null;
    }

    if (!data) return [];
    return (data as unknown as SupabaseCaseRow[]).map(fromSupabaseRow);
  } catch (err) {
    console.warn('Lỗi ngoại lệ khi fetch Supabase cases:', err);
    return null;
  }
}

/**
 * Đẩy/Cập nhật một hồ sơ lên Supabase Cloud (Upsert)
 */
export async function upsertSupabaseCase(caseData: SubmittedCase): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const row = toSupabaseRow(caseData);
    const { error } = await client
      .from('submitted_cases')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.warn(`Lỗi Supabase upsert case ${caseData.id}:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Lỗi kết nối khi upsert Supabase case:', err);
    return false;
  }
}

/**
 * Đẩy/Cập nhật toàn bộ danh sách hồ sơ lên Supabase Cloud (Bulk Sync)
 */
export async function syncAllCasesToSupabase(
  cases: SubmittedCase[]
): Promise<{ success: boolean; count: number; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, count: 0, message: 'Chưa cấu hình Supabase URL hoặc Anon Key!' };
  }

  try {
    const rows = cases.map(toSupabaseRow);
    const { error } = await client
      .from('submitted_cases')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.warn('Lỗi Supabase bulk upsert:', error.message);
      return { success: false, count: 0, message: `Lỗi đồng bộ: ${error.message}` };
    }
    return {
      success: true,
      count: rows.length,
      message: `Đồng bộ thành công ${rows.length} hồ sơ lên Supabase Cloud!`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('Lỗi ngoại lệ Supabase bulk sync:', err);
    return { success: false, count: 0, message: `Lỗi ngoại lệ: ${msg}` };
  }
}

/**
 * Xóa một hồ sơ khỏi Supabase Cloud
 */
export async function deleteSupabaseCase(caseId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('submitted_cases')
      .delete()
      .eq('id', caseId);

    if (error) {
      console.warn(`Lỗi Supabase delete case ${caseId}:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Lỗi kết nối khi delete Supabase case:', err);
    return false;
  }
}

/**
 * Đăng ký lắng nghe thay đổi thời gian thực (Supabase Realtime)
 * Khi có sinh viên nộp đơn hoặc thầy cô phê duyệt trên máy khác,
 * hàm callback sẽ được kích hoạt tức thì.
 */
export function subscribeSupabaseRealtime(
  onCaseChange: (caseItem: SubmittedCase, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
): () => void {
  const client = getSupabaseClient();
  if (!client) return () => {};

  if (realtimeChannel) {
    try {
      realtimeChannel.unsubscribe();
    } catch {
      // bỏ qua
    }
  }

  try {
    realtimeChannel = client
      .channel('realtime_submitted_cases')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'submitted_cases' },
        (payload) => {
          const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
          if (eventType === 'DELETE') {
            const oldRow = payload.old as { id: string };
            if (oldRow && oldRow.id) {
              onCaseChange({ id: oldRow.id } as SubmittedCase, 'DELETE');
            }
          } else if (payload.new) {
            const parsed = fromSupabaseRow(payload.new as unknown as SupabaseCaseRow);
            onCaseChange(parsed, eventType);
          }
        }
      )
      .subscribe();

    return () => {
      if (realtimeChannel) {
        realtimeChannel.unsubscribe();
        realtimeChannel = null;
      }
    };
  } catch (err) {
    console.warn('Lỗi kết nối Realtime Supabase:', err);
    return () => {};
  }
}

/**
 * Kiểm tra kết nối Supabase (Ping test)
 */
export async function testSupabaseConnection(
  customUrl?: string,
  customKey?: string
): Promise<{ success: boolean; latencyMs: number; message: string }> {
  const t0 = performance.now();
  const client = getSupabaseClient(customUrl, customKey);

  if (!client) {
    return {
      success: false,
      latencyMs: 0,
      message: 'Chưa cấu hình Supabase URL hoặc Anon Key!',
    };
  }

  try {
    const { error } = await client
      .from('submitted_cases')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    const latencyMs = Math.round(performance.now() - t0);

    if (error) {
      if (error.code === '42P01') {
        return {
          success: false,
          latencyMs,
          message: 'Kết nối thành công nhưng bảng "submitted_cases" chưa được tạo! Hãy chạy file supabase-schema.sql trong SQL Editor.',
        };
      }
      return {
        success: false,
        latencyMs,
        message: `Lỗi Supabase (${error.code || 'API'}): ${error.message}`,
      };
    }

    return {
      success: true,
      latencyMs,
      message: 'Kết nối Supabase Cloud Database thành công! Đã sẵn sàng đồng bộ thời gian thực.',
    };
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - t0);
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      latencyMs,
      message: `Lỗi ngoại lệ mạng khi gọi Supabase: ${msg}`,
    };
  }
}
