import React, { useState, useEffect } from 'react';
import {
  getAllSubmittedCases,
  saveAllSubmittedCases,
  resetSubmittedCasesToDefault,
  clearAllSubmittedCases,
  importCasesJson,
  SubmittedCase,
} from '../../data/caseRegistry';
import {
  getRegisteredAccounts,
  resetUsersToDefault,
  importUsersJson,
  RegisteredAccount,
} from '../../data/userRegistry';
import { testGeminiConnection, getCustomGeminiKey, saveCustomGeminiKey } from '../../ai/live';
import {
  isSupabaseConfigured,
  testSupabaseConnection,
  getSupabaseConfig,
  saveCustomSupabaseConfig,
  syncAllCasesToSupabase,
  fetchSupabaseCases,
} from '../../services/supabaseClient';
import { useAuthStore } from '../../store/useAuth';
import { sfx } from '../audio/sfx';

const formatStatus = (status: string) => {
  switch (status) {
    case 'pending_advisor':
      return 'Chờ Cố vấn';
    case 'pending_ctsv':
      return 'Chờ CTSV';
    case 'pending_principal':
      return 'Chờ BGH ký số';
    case 'approved':
      return 'Đã phê duyệt';
    case 'rejected':
      return 'Đã từ chối';
    default:
      return status;
  }
};

export const StorageManager: React.FC = () => {
  const [cases, setCases] = useState<SubmittedCase[]>([]);
  const [users, setUsers] = useState<RegisteredAccount[]>([]);
  const [storageUsageKb, setStorageUsageKb] = useState<number>(0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // External API Testing State
  const [apiKeyInput, setApiKeyInput] = useState<string>(() => getCustomGeminiKey() || '');
  const [modelInput, setModelInput] = useState<string>('gemini-1.5-flash');
  const [isTestingApi, setIsTestingApi] = useState<boolean>(false);
  const [apiResult, setApiResult] = useState<{
    success: boolean;
    latencyMs: number;
    message: string;
    modelUsed: string;
  } | null>(null);

  const handleSaveGeminiKey = () => {
    saveCustomGeminiKey(apiKeyInput);
    sfx.playStamp();
    showToast(
      apiKeyInput.trim()
        ? 'Đã lưu Gemini API Key vào trình duyệt! Hệ thống sẽ dùng Gemini Vision khi quét ảnh.'
        : 'Đã xóa Gemini API Key khỏi trình duyệt (chuyển về chế độ Mock an toàn).'
    );
  };

  // Supabase Testing State
  const initialSupabaseCfg = getSupabaseConfig();
  const [supabaseUrlInput, setSupabaseUrlInput] = useState<string>(initialSupabaseCfg?.url || '');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState<string>(initialSupabaseCfg?.anonKey || '');
  const [isTestingSupabase, setIsTestingSupabase] = useState<boolean>(false);
  const [supabaseResult, setSupabaseResult] = useState<{
    success: boolean;
    latencyMs: number;
    message: string;
  } | null>(null);

  const currentUser = useAuthStore((s) => s.currentUser);

  const refreshData = () => {
    const loadedCases = getAllSubmittedCases();
    const loadedUsers = getRegisteredAccounts();
    setCases(loadedCases);
    setUsers(loadedUsers);

    // Tính toán dung lượng localStorage
    if (typeof localStorage !== 'undefined') {
      let totalBytes = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('bao_luu_')) {
          const val = localStorage.getItem(key) || '';
          totalBytes += key.length + val.length;
        }
      }
      setStorageUsageKb(Math.round((totalBytes / 1024) * 10) / 10);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    sfx.playStamp();
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleExportBackup = () => {
    const backupObj = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      cases: getAllSubmittedCases(),
      users: getRegisteredAccounts(),
    };
    const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bao-luu-storage-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất tệp sao lưu JSON thành công!');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (parsed.cases && Array.isArray(parsed.cases)) {
          importCasesJson(JSON.stringify(parsed.cases));
        } else if (Array.isArray(parsed)) {
          importCasesJson(text);
        }

        if (parsed.users && Array.isArray(parsed.users)) {
          importUsersJson(JSON.stringify(parsed.users));
        }

        refreshData();
        showToast('Đã phục hồi dữ liệu từ tệp sao lưu thành công!');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        showToast(`Lỗi đọc file sao lưu: ${msg}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetToDefault = () => {
    if (window.confirm('Khôi phục CSDL về trạng thái dữ liệu mặc định ban đầu?')) {
      resetSubmittedCasesToDefault();
      refreshData();
      showToast('Đã khôi phục dữ liệu mặc định ban đầu!');
    }
  };

  const handleClearAll = () => {
    if (window.confirm('CẢNH BÁO: Bạn có chắc chắn muốn xóa TOÀN BỘ hồ sơ và tài khoản đã lưu?')) {
      clearAllSubmittedCases();
      resetUsersToDefault();
      refreshData();
      showToast('Đã dọn dẹp sạch toàn bộ bộ nhớ LocalStorage!');
    }
  };

  const handlePingGemini = async () => {
    setIsTestingApi(true);
    setApiResult(null);
    try {
      const result = await testGeminiConnection(apiKeyInput, modelInput);
      setApiResult(result);
      if (result.success) {
        sfx.playStamp();
      } else {
        sfx.playBuzz();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setApiResult({
        success: false,
        latencyMs: 0,
        message: `Lỗi ngoại lệ: ${msg}`,
        modelUsed: modelInput,
      });
      sfx.playBuzz();
    } finally {
      setIsTestingApi(false);
    }
  };

  const handlePingSupabase = async () => {
    setIsTestingSupabase(true);
    setSupabaseResult(null);
    try {
      const res = await testSupabaseConnection(supabaseUrlInput, supabaseKeyInput);
      setSupabaseResult(res);
      if (res.success) {
        sfx.playStamp();
      } else {
        sfx.playBuzz();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSupabaseResult({
        success: false,
        latencyMs: 0,
        message: `Lỗi kết nối: ${msg}`,
      });
      sfx.playBuzz();
    } finally {
      setIsTestingSupabase(false);
    }
  };

  const handleSaveSupabaseConfig = () => {
    saveCustomSupabaseConfig(supabaseUrlInput, supabaseKeyInput);
    sfx.playStamp();
    showToast('Đã lưu cấu hình kết nối Supabase vào bộ nhớ trình duyệt!');
  };

  const handlePushAllToSupabase = async () => {
    setIsTestingSupabase(true);
    setSupabaseResult(null);
    try {
      const allCases = getAllSubmittedCases();
      const res = await syncAllCasesToSupabase(allCases);
      setSupabaseResult({ ...res, latencyMs: 0 });
      if (res.success) {
        sfx.playStamp();
        showToast(res.message);
      } else {
        sfx.playBuzz();
      }
    } finally {
      setIsTestingSupabase(false);
    }
  };

  const handlePullFromSupabase = async () => {
    setIsTestingSupabase(true);
    setSupabaseResult(null);
    try {
      const cloud = await fetchSupabaseCases();
      if (!cloud) {
        sfx.playBuzz();
        setSupabaseResult({
          success: false,
          latencyMs: 0,
          message: 'Không thể kết nối hoặc tải hồ sơ từ Supabase.',
        });
        return;
      }
      saveAllSubmittedCases(cloud);
      refreshData();
      sfx.playStamp();
      setSupabaseResult({
        success: true,
        latencyMs: 0,
        message: `Đã kéo thành công ${cloud.length} hồ sơ từ Supabase Cloud!`,
      });
      showToast(`Đã đồng bộ thành công ${cloud.length} hồ sơ từ Supabase Cloud về máy!`);
    } finally {
      setIsTestingSupabase(false);
    }
  };

  return (
    <div className="storage-panel">
      {toastMsg && (
        <div className="storage-toast" role="status">
          <span>✔</span> {toastMsg}
        </div>
      )}

      {/* PHẦN 1: LƯU TRỮ BỀN VỮNG */}
      <section className="storage-section">
        <div className="storage-section-head">
          <div>
            <h3 className="storage-section-title">
              <span>💾</span> 1. Lưu trữ bền vững (Persistent LocalStorage)
            </h3>
            <div className="storage-section-sub">
              Đáp ứng yêu cầu 4.1.3: Dữ liệu hồ sơ và tài khoản duy trì qua F5 và các phiên làm việc.
            </div>
          </div>
          <span className="storage-badge" title="Dung lượng LocalStorage hiện thời">
            Đã dùng: ~{storageUsageKb} KB
          </span>
        </div>

        {/* Thống kê hồ sơ */}
        <div className="storage-stats-grid">
          <div className="storage-stat-card">
            <div className="storage-stat-label">Hồ sơ bảo lưu</div>
            <div className="storage-stat-value">
              {cases.length} <span className="storage-stat-unit">bản ghi</span>
            </div>
          </div>

          <div className="storage-stat-card">
            <div className="storage-stat-label">Tài khoản đã đăng ký</div>
            <div className="storage-stat-value">
              {users.length} <span className="storage-stat-unit">tài khoản</span>
            </div>
          </div>

          <div className="storage-stat-card">
            <div className="storage-stat-label">Phiên đăng nhập</div>
            <div
              className="storage-stat-value"
              style={{ fontSize: '13.5px', marginTop: '2px', wordBreak: 'break-all' }}
            >
              {currentUser ? currentUser.name : 'Chưa đăng nhập'}
            </div>
            <span className="storage-stat-unit">
              {currentUser ? `Vai trò: ${currentUser.type.toUpperCase()}` : 'Chế độ khách'}
            </span>
          </div>
        </div>

        {/* Danh sách hồ sơ đang lưu */}
        <div className="storage-list-box">
          <div className="storage-list-head">
            Danh sách hồ sơ đang lưu trong bộ nhớ ({cases.length}):
          </div>
          {cases.length > 0 ? (
            <div className="storage-list-scroll">
              {cases.map((c) => (
                <div key={c.id} className="storage-list-row">
                  <div>
                    <strong>{c.caseCode}</strong> — {c.studentName} ({c.studentMssv})
                  </div>
                  <span className="storage-status-tag" data-status={c.status}>
                    {formatStatus(c.status)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: '12px',
                textAlign: 'center',
                color: 'var(--ink-soft)',
                fontStyle: 'italic',
                fontSize: '12px',
              }}
            >
              Chưa có hồ sơ nào được lưu trữ.
            </div>
          )}
        </div>

        {/* Các nút thao tác */}
        <div className="storage-actions">
          <button type="button" className="storage-btn" onClick={handleExportBackup}>
            📥 Xuất bản sao lưu (Export JSON)
          </button>

          <label className="storage-btn">
            📤 Phục hồi (Import JSON)
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              style={{ display: 'none' }}
            />
          </label>

          <button
            type="button"
            className="storage-btn storage-btn-success"
            onClick={handleResetToDefault}
          >
            🔄 Khôi phục dữ liệu ban đầu
          </button>

          <button
            type="button"
            className="storage-btn storage-btn-danger"
            onClick={handleClearAll}
          >
            🗑️ Xóa sạch bộ nhớ
          </button>
        </div>
      </section>

      {/* PHẦN 2: TÍCH HỢP BÊN NGOÀI */}
      <section className="storage-section">
        <div className="storage-section-head">
          <div>
            <h3 className="storage-section-title">
              <span>🌐</span> 2. Tích hợp bên ngoài (External Integrations)
            </h3>
            <div className="storage-section-sub">
              Đáp ứng yêu cầu 4.1.4: Tích hợp với dịch vụ ngoài (Google Gemini REST API & PKI SHA-256).
            </div>
          </div>
        </div>

        {/* Tích hợp 1: Gemini REST API */}
        <div className="storage-card">
          <div className="storage-card-title">
            <span>⚡ Tích hợp 1: Google Gemini REST API (Endpoint trí tuệ nhân tạo)</span>
            <span className="storage-badge storage-badge-success">LIVE / MOCK FALLBACK 4S</span>
          </div>
          <div className="storage-section-sub">
            Hỗ trợ phân tích OCR minh chứng và sinh brief tóm tắt tự động cho Cố vấn/CTSV. Mặc định tự động dự phòng sang Mock an toàn sau 4 giây nếu quá hạn mạng.
          </div>

          <div className="storage-input-group">
            <input
              type="password"
              className="storage-input"
              placeholder="Nhập Gemini API Key (hoặc để trống nếu đã có trong .env.local)"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
            />
            <input
              type="text"
              className="storage-input"
              style={{ maxWidth: '170px' }}
              placeholder="Model (e.g. gemini-1.5-flash)"
              value={modelInput}
              onChange={(e) => setModelInput(e.target.value)}
            />
            <button
              type="button"
              className="storage-btn-ping"
              onClick={handlePingGemini}
              disabled={isTestingApi}
            >
              {isTestingApi ? 'Đang gửi gói tin...' : '⚡ Kiểm tra kết nối (Ping API)'}
            </button>
            <button
              type="button"
              className="storage-btn-save"
              onClick={handleSaveGeminiKey}
              title="Lưu API Key vào trình duyệt để sử dụng Gemini Vision thật"
            >
              💾 Lưu API Key vào trình duyệt
            </button>
          </div>

          {apiResult && (
            <div
              className={`storage-result ${
                apiResult.success ? 'storage-result-success' : 'storage-result-error'
              }`}
            >
              {apiResult.success ? '✔ ' : '✖ '}
              {apiResult.message}
            </div>
          )}
        </div>

        {/* Tích hợp 2: PKI SHA-256 */}
        <div className="storage-card">
          <div className="storage-card-title">
            <span>🔏 Tích hợp 2: Hạ tầng chữ ký số PKI SHA-256 (Mã hóa toàn vẹn văn bản)</span>
            <span className="storage-badge storage-badge-success">CHỨNG THỰC X.509 · ACTIVE</span>
          </div>
          <div className="storage-section-sub">
            Thuật toán băm mật mã chuẩn X.509 SHA-256 được tích hợp trực tiếp tại khâu Ban Giám hiệu ký số (node T9)
            để đảm bảo tính bất biến, chống giả mạo hồ sơ điện tử trước khi ban hành quyết định về sinh viên.
          </div>
        </div>

        {/* Tích hợp 3: Supabase Cloud Database */}
        <div className="storage-card">
          <div className="storage-card-title">
            <span>☁️ Tích hợp 3: Supabase Cloud Database & Realtime Sync</span>
            <span
              className={`storage-badge ${
                isSupabaseConfigured() ? 'storage-badge-success' : 'storage-badge-neutral'
              }`}
            >
              {isSupabaseConfigured() ? 'CLOUD REALTIME SYNC BẬT' : 'CHẾ ĐỘ OFFLINE LOCAL'}
            </span>
          </div>
          <div className="storage-section-sub">
            Đồng bộ hồ sơ sinh viên nộp giữa nhiều thiết bị theo thời gian thực (sinh viên nộp trên điện thoại, bàn Cố vấn / CTSV / BGH cập nhật ngay lập tức không cần F5).
          </div>

          <div className="storage-input-group" style={{ flexDirection: 'column', gap: '8px', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="text"
                className="storage-input"
                style={{ flex: '1 1 240px' }}
                placeholder="Supabase Project URL (ví dụ: https://xyz.supabase.co)"
                value={supabaseUrlInput}
                onChange={(e) => setSupabaseUrlInput(e.target.value)}
              />
              <input
                type="password"
                className="storage-input"
                style={{ flex: '1 1 200px' }}
                placeholder="Supabase Anon Public Key"
                value={supabaseKeyInput}
                onChange={(e) => setSupabaseKeyInput(e.target.value)}
              />
              <button
                type="button"
                className="storage-btn-ping"
                onClick={handlePingSupabase}
                disabled={isTestingSupabase}
              >
                {isTestingSupabase ? 'Đang kiểm tra...' : '☁️ Ping Supabase'}
              </button>
            </div>

            {/* Hàng nút tác vụ đồng bộ Supabase */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
              <button
                type="button"
                className="storage-btn"
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={handleSaveSupabaseConfig}
              >
                💾 Lưu cấu hình vào trình duyệt
              </button>
              <button
                type="button"
                className="storage-btn storage-btn-success"
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={handlePushAllToSupabase}
                disabled={isTestingSupabase}
              >
                ⬆️ Đẩy toàn bộ hồ sơ lên Supabase (Sync Push)
              </button>
              <button
                type="button"
                className="storage-btn"
                style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: '#1565c0', color: '#fff', borderColor: '#1565c0' }}
                onClick={handlePullFromSupabase}
                disabled={isTestingSupabase}
              >
                ⬇️ Kéo toàn bộ hồ sơ từ Supabase (Sync Pull)
              </button>
            </div>
          </div>

          {supabaseResult && (
            <div
              className={`storage-result ${
                supabaseResult.success ? 'storage-result-success' : 'storage-result-error'
              }`}
              style={{ marginTop: '8px' }}
            >
              {supabaseResult.success ? '✔ ' : '✖ '}
              {supabaseResult.message}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
