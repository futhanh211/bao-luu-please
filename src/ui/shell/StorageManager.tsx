import React, { useState, useEffect } from 'react';
import {
  getAllSubmittedCases,
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
import { testGeminiConnection } from '../../ai/live';
import { useAuthStore } from '../../store/useAuth';
import { sfx } from '../audio/sfx';

export const StorageManager: React.FC = () => {
  const [cases, setCases] = useState<SubmittedCase[]>([]);
  const [users, setUsers] = useState<RegisteredAccount[]>([]);
  const [storageUsageKb, setStorageUsageKb] = useState<number>(0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // External API Testing State
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [modelInput, setModelInput] = useState<string>('gemini-1.5-flash');
  const [isTestingApi, setIsTestingApi] = useState<boolean>(false);
  const [apiResult, setApiResult] = useState<{
    success: boolean;
    latencyMs: number;
    message: string;
    modelUsed: string;
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
    if (window.confirm('Khôi phục CSDL về trạng thái mẫu ban đầu (2 hồ sơ mẫu)?')) {
      resetSubmittedCasesToDefault();
      refreshData();
      showToast('Đã đặt lại CSDL mẫu ban đầu!');
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '14px' }}>
      {toastMsg && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: 'var(--amber-dim, #fef3c7)',
            color: 'var(--ink, #1f2937)',
            border: '1px solid var(--amber, #f59e0b)',
            borderRadius: '4px',
            fontWeight: 'bold',
          }}
        >
          {toastMsg}
        </div>
      )}

      {/* PHẦN 1: LƯU TRỮ BỀN VỮNG */}
      <section
        style={{
          border: '1px solid var(--paper-line, #d1d5db)',
          padding: '16px',
          borderRadius: '4px',
          backgroundColor: 'rgba(255,255,255,0.03)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--amber, #f59e0b)' }}>
              💾 1. LƯU TRỮ BỀN VỮNG (PERSISTENT LOCALSTORAGE)
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--ink-soft, #6b7280)' }}>
              Đáp ứng yêu cầu 4.1.3: Dữ liệu duy trì bền vững qua các phiên làm việc và F5.
            </span>
          </div>
          <span
            style={{
              padding: '4px 8px',
              backgroundColor: 'var(--desk-800, #374151)',
              borderRadius: '3px',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            Đã dùng: ~{storageUsageKb} KB
          </span>
        </div>

        {/* Thống kê hồ sơ */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '10px',
            marginBottom: '14px',
          }}
        >
          <div
            style={{
              padding: '10px',
              border: '1px solid var(--paper-line, #e5e7eb)',
              borderRadius: '4px',
              backgroundColor: 'rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>HỒ SƠ BẢO LƯU</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--paper)' }}>
              {cases.length} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>bản ghi</span>
            </div>
          </div>

          <div
            style={{
              padding: '10px',
              border: '1px solid var(--paper-line, #e5e7eb)',
              borderRadius: '4px',
              backgroundColor: 'rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>TÀI KHOẢN ĐÃ ĐĂNG KÝ</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--paper)' }}>
              {users.length} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>tài khoản</span>
            </div>
          </div>

          <div
            style={{
              padding: '10px',
              border: '1px solid var(--paper-line, #e5e7eb)',
              borderRadius: '4px',
              backgroundColor: 'rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>PHIÊN ĐĂNG NHẬP</div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--paper)', marginTop: '4px' }}>
              {currentUser ? `${currentUser.name} (${currentUser.type})` : 'Chưa đăng nhập'}
            </div>
          </div>
        </div>

        {/* Danh sách hồ sơ gần đây */}
        {cases.length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>
              Danh sách hồ sơ đang lưu trong LocalStorage:
            </div>
            <div
              style={{
                maxHeight: '120px',
                overflowY: 'auto',
                border: '1px solid var(--paper-line, #d1d5db)',
                borderRadius: '3px',
                padding: '6px',
                fontSize: '12px',
                backgroundColor: 'rgba(0,0,0,0.2)',
              }}
            >
              {cases.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '4px 6px',
                    borderBottom: '1px dashed rgba(255,255,255,0.1)',
                  }}
                >
                  <span>
                    <strong>{c.caseCode}</strong> — {c.studentName} ({c.studentMssv})
                  </span>
                  <span style={{ color: 'var(--amber)' }}>{c.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Các nút thao tác */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleExportBackup}
            style={{
              padding: '8px 14px',
              backgroundColor: 'var(--desk-800)',
              color: 'var(--paper)',
              border: '1px solid var(--paper-line)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            📥 Xuất bản sao lưu (Export JSON)
          </button>

          <label
            style={{
              padding: '8px 14px',
              backgroundColor: 'var(--desk-800)',
              color: 'var(--paper)',
              border: '1px solid var(--paper-line)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'inline-block',
            }}
          >
            📤 Phục hồi (Import JSON)
            <input type="file" accept=".json" onChange={handleImportFile} style={{ display: 'none' }} />
          </label>

          <button
            type="button"
            onClick={handleResetToDefault}
            style={{
              padding: '8px 14px',
              backgroundColor: 'var(--desk-700)',
              color: 'var(--amber)',
              border: '1px solid var(--amber)',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            🔄 Đặt lại CSDL mẫu
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            style={{
              padding: '8px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              border: '1px solid #ef4444',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            🗑️ Xóa sạch bộ nhớ
          </button>
        </div>
      </section>

      {/* PHẦN 2: TÍCH HỢP BÊN NGOÀI */}
      <section
        style={{
          border: '1px solid var(--paper-line, #d1d5db)',
          padding: '16px',
          borderRadius: '4px',
          backgroundColor: 'rgba(255,255,255,0.03)',
        }}
      >
        <div style={{ marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--amber, #f59e0b)' }}>
            🌐 2. TÍCH HỢP BÊN NGOÀI (EXTERNAL INTEGRATIONS)
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--ink-soft, #6b7280)' }}>
            Đáp ứng yêu cầu 4.1.4: Tích hợp với dịch vụ ngoài (Google Gemini API & PKI SHA-256).
          </span>
        </div>

        {/* Tích hợp 1: Gemini REST API */}
        <div
          style={{
            padding: '12px',
            backgroundColor: 'rgba(0,0,0,0.15)',
            borderRadius: '4px',
            marginBottom: '12px',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: 'var(--paper)' }}>
            Tích hợp 1: Google Gemini REST API (Endpoint trí tuệ nhân tạo)
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <input
              type="password"
              placeholder="Nhập Gemini API Key (hoặc để trống nếu đã có trong .env.local)"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              style={{
                flex: 1,
                minWidth: '220px',
                padding: '6px 10px',
                backgroundColor: 'var(--desk-900)',
                color: 'var(--paper)',
                border: '1px solid var(--paper-line)',
                borderRadius: '3px',
                fontSize: '12px',
              }}
            />
            <input
              type="text"
              placeholder="Model (e.g. gemini-1.5-flash)"
              value={modelInput}
              onChange={(e) => setModelInput(e.target.value)}
              style={{
                width: '160px',
                padding: '6px 10px',
                backgroundColor: 'var(--desk-900)',
                color: 'var(--paper)',
                border: '1px solid var(--paper-line)',
                borderRadius: '3px',
                fontSize: '12px',
              }}
            />
            <button
              type="button"
              onClick={handlePingGemini}
              disabled={isTestingApi}
              style={{
                padding: '6px 14px',
                backgroundColor: 'var(--amber)',
                color: 'var(--desk-900)',
                border: 'none',
                borderRadius: '3px',
                fontWeight: 'bold',
                cursor: isTestingApi ? 'wait' : 'pointer',
              }}
            >
              {isTestingApi ? 'Đang gửi gói tin...' : '⚡ Kiểm tra kết nối (Ping API)'}
            </button>
          </div>

          {apiResult && (
            <div
              style={{
                padding: '8px 12px',
                borderRadius: '3px',
                backgroundColor: apiResult.success ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${apiResult.success ? '#22c55e' : '#ef4444'}`,
                color: apiResult.success ? '#4ade80' : '#f87171',
                fontSize: '13px',
              }}
            >
              {apiResult.message}
            </div>
          )}
        </div>

        {/* Tích hợp 2: PKI SHA-256 */}
        <div
          style={{
            padding: '12px',
            backgroundColor: 'rgba(0,0,0,0.15)',
            borderRadius: '4px',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px', color: 'var(--paper)' }}>
            Tích hợp 2: Hạ tầng chữ ký số PKI SHA-256 (Mã hóa toàn vẹn văn bản)
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
            Thuật toán băm mật mã chuẩn X.509 SHA-256 được tích hợp trực tiếp tại khâu Ban Giám hiệu ký số (T9)
            để đảm bảo tính bất biến, chống giả mạo hồ sơ điện tử trước khi ban hành về sinh viên.
          </div>
        </div>
      </section>
    </div>
  );
};
