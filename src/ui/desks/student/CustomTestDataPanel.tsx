import React, { useState, useEffect } from 'react';
import { usePlaybackStore } from '../../../store/playback';
import {
  CUSTOM_PRESETS,
  CustomPreset,
  CustomTestDataConfig,
  CustomEvidencePreset,
  CUSTOM_EVIDENCE_OPTIONS,
} from '../../../data/customTestData';
import { CustomTestPresets } from './CustomTestPresets';

export const CustomTestDataPanel: React.FC = () => {
  const customTestConfig = usePlaybackStore((s) => s.customTestConfig);
  const applyCustomTestData = usePlaybackStore((s) => s.applyCustomTestData);
  const submitted = usePlaybackStore((s) => s.submitted);

  const [expanded, setExpanded] = useState(true);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('happy_path');
  const [synced, setSynced] = useState(true);

  const [draft, setDraft] = useState<CustomTestDataConfig>(
    customTestConfig ?? CUSTOM_PRESETS[0].config
  );

  useEffect(() => {
    if (customTestConfig) setDraft(customTestConfig);
  }, [customTestConfig]);

  const handleSelectPreset = (preset: CustomPreset): void => {
    if (submitted) return;
    setSelectedPresetId(preset.id);
    setDraft({ ...preset.config });
    applyCustomTestData({ ...preset.config });
    setSynced(true);
  };

  const handleFieldChange = (patch: Partial<CustomTestDataConfig>): void => {
    if (submitted) return;
    setSelectedPresetId('');
    setSynced(false);
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleApply = (): void => {
    if (submitted) return;
    applyCustomTestData(draft);
    setSynced(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') handleApply();
  };

  const currentPreset = CUSTOM_PRESETS.find((p) => p.id === selectedPresetId);

  // Status for 4 business rules
  const r1Pass = draft.semestersCompleted >= 1;
  const r2Pass = draft.discipline === 'none';
  const r3Pass = draft.tuitionDebt === 0;
  const r4Pass = !draft.forcedWithdrawal;

  return (
    <div className="custom-test-panel">
      {/* Header bar */}
      <div className="custom-test-header" onClick={() => setExpanded((v) => !v)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>⚙️</span>
          <span className="custom-test-title">Bảng thiết lập dữ liệu test (Giảng viên)</span>
          <span className="custom-test-badge-fake">Dữ liệu giả lập</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {synced ? (
            <span className="custom-test-sync-ok">✓ Đã đồng bộ CSDL</span>
          ) : (
            <span className="custom-test-sync-pending">● Có thay đổi chưa áp dụng</span>
          )}
          <button type="button" className="custom-test-collapse-btn">
            {expanded ? '▲ Thu gọn' : '▼ Mở rộng'}
          </button>
        </div>
      </div>

      {/* Dòng tóm tắt khi thu gọn */}
      {!expanded && (
        <div className="custom-test-collapsed-strip" onClick={() => setExpanded(true)}>
          <div>
            <strong>Kịch bản:</strong> {currentPreset ? currentPreset.label : 'Tùy chỉnh tự do'} ·{' '}
            <span style={{ color: r1Pass && r2Pass && r3Pass && r4Pass ? 'var(--stamp-green)' : 'var(--stamp-red)' }}>
              {r1Pass && r2Pass && r3Pass && r4Pass ? 'Đạt 4 quy tắc T3' : 'Có quy tắc vi phạm'}
            </span>
          </div>
          <span style={{ textDecoration: 'underline', cursor: 'var(--cursor-pointer)' }}>Bấm để mở rộng</span>
        </div>
      )}

      {/* Nội dung khi mở rộng */}
      {expanded && (
        <div className="custom-test-body">
          <CustomTestPresets
            selectedPresetId={selectedPresetId}
            submitted={submitted}
            onSelectPreset={handleSelectPreset}
          />

          {/* Form Inputs Grid - Chia 2 cụm rõ ràng */}
          <div className="custom-test-grid">
            {/* Cột 1: Đối soát Quy tắc R1 - R4 (T3) */}
            <div className="custom-test-section">
              <h4 className="custom-test-section-title">1. Quy tắc Đào tạo & Tài chính (CSDL DS1 - T3)</h4>

              {/* R1 */}
              <div className="custom-test-field">
                <div className="custom-test-label-row">
                  <label className="custom-test-label" htmlFor="ct-r1">R1 · Kỳ hoàn thành (yêu cầu ≥ 1):</label>
                  <span className={r1Pass ? 'custom-test-pill-pass' : 'custom-test-pill-fail'}>
                    {r1Pass ? '✓ Đạt R1' : '✗ Vi phạm (< 1 kỳ)'}
                  </span>
                </div>
                <input
                  id="ct-r1"
                  type="number"
                  min={0}
                  max={12}
                  disabled={submitted}
                  value={draft.semestersCompleted}
                  onChange={(e) => handleFieldChange({ semestersCompleted: Number(e.target.value) })}
                  onKeyDown={handleKeyDown}
                  className="custom-test-input"
                  style={{ color: r1Pass ? 'var(--ink)' : 'var(--stamp-red)', fontWeight: 600 }}
                />
              </div>

              {/* R2 */}
              <div className="custom-test-field">
                <div className="custom-test-label-row">
                  <label className="custom-test-label" htmlFor="ct-r2">R2 · Kỷ luật:</label>
                  <span className={r2Pass ? 'custom-test-pill-pass' : 'custom-test-pill-fail'}>
                    {r2Pass ? '✓ Đạt R2' : '✗ Vi phạm (Kỷ luật)'}
                  </span>
                </div>
                <select
                  id="ct-r2"
                  disabled={submitted}
                  value={draft.discipline}
                  onChange={(e) =>
                    handleFieldChange({
                      discipline: e.target.value as CustomTestDataConfig['discipline'],
                    })
                  }
                  className="custom-test-select"
                  style={{ color: r2Pass ? 'var(--ink)' : 'var(--stamp-red)', fontWeight: 600 }}
                >
                  <option value="none">Bình thường (Đạt R2)</option>
                  <option value="warning">Cảnh cáo (Vi phạm R2)</option>
                  <option value="suspended">Đình chỉ (Vi phạm R2)</option>
                </select>
              </div>

              {/* R3 */}
              <div className="custom-test-field">
                <div className="custom-test-label-row">
                  <label className="custom-test-label" htmlFor="ct-r3">R3 · Nợ học phí (VNĐ, = 0 đạt):</label>
                  <span className={r3Pass ? 'custom-test-pill-pass' : 'custom-test-pill-fail'}>
                    {r3Pass ? '✓ Đạt R3 (0 đ)' : `✗ Nợ ${draft.tuitionDebt.toLocaleString('vi-VN')} đ`}
                  </span>
                </div>
                <input
                  id="ct-r3"
                  type="number"
                  step={500000}
                  disabled={submitted}
                  value={draft.tuitionDebt}
                  onChange={(e) => handleFieldChange({ tuitionDebt: Number(e.target.value) })}
                  onKeyDown={handleKeyDown}
                  className="custom-test-input"
                  style={{ color: r3Pass ? 'var(--ink)' : 'var(--stamp-red)', fontWeight: 600 }}
                />
              </div>

              {/* R4 */}
              <div className="custom-test-field">
                <div className="custom-test-label-row">
                  <label className="custom-test-label" htmlFor="ct-r4">R4 · Buộc thôi học:</label>
                  <span className={r4Pass ? 'custom-test-pill-pass' : 'custom-test-pill-fail'}>
                    {r4Pass ? '✓ Đạt R4' : '✗ Vi phạm (Thôi học)'}
                  </span>
                </div>
                <select
                  id="ct-r4"
                  disabled={submitted}
                  value={draft.forcedWithdrawal ? 'yes' : 'no'}
                  onChange={(e) => handleFieldChange({ forcedWithdrawal: e.target.value === 'yes' })}
                  className="custom-test-select"
                  style={{ color: r4Pass ? 'var(--ink)' : 'var(--stamp-red)', fontWeight: 600 }}
                >
                  <option value="no">Không (Đạt R4)</option>
                  <option value="yes">Thuộc diện thôi học (Vi phạm R4)</option>
                </select>
              </div>
            </div>

            {/* Cột 2: Minh chứng & Hồ sơ Sinh viên */}
            <div className="custom-test-section">
              <h4 className="custom-test-section-title">2. Minh chứng & Hồ sơ Sinh viên (DS2)</h4>

              {/* Minh chứng */}
              <div className="custom-test-field">
                <label className="custom-test-label" htmlFor="ct-evidence">
                  Tài liệu minh chứng đính kèm (Test T1 & CTSV):
                </label>
                <select
                  id="ct-evidence"
                  disabled={submitted}
                  value={draft.evidencePreset}
                  onChange={(e) =>
                    handleFieldChange({ evidencePreset: e.target.value as CustomEvidencePreset })
                  }
                  className="custom-test-select"
                >
                  {CUSTOM_EVIDENCE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Họ tên SV */}
              <div className="custom-test-field">
                <label className="custom-test-label" htmlFor="ct-fullname">Họ và tên sinh viên:</label>
                <input
                  id="ct-fullname"
                  disabled={submitted}
                  value={draft.fullName}
                  onChange={(e) => handleFieldChange({ fullName: e.target.value })}
                  onKeyDown={handleKeyDown}
                  className="custom-test-input"
                />
              </div>

              {/* MSSV */}
              <div className="custom-test-field">
                <label className="custom-test-label" htmlFor="ct-mssv">Mã số sinh viên (MSSV):</label>
                <input
                  id="ct-mssv"
                  disabled={submitted}
                  value={draft.mssv}
                  onChange={(e) => handleFieldChange({ mssv: e.target.value })}
                  onKeyDown={handleKeyDown}
                  className="custom-test-input"
                />
              </div>

              <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 4, lineHeight: 1.4 }}>
                💡 <em>Ghi chú:</em> Khi thay đổi thông số, hệ thống sẽ tự cập nhật đồng bộ vào CSDL tra cứu (DS1, DS2) và Đơn xin bảo lưu.
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="custom-test-actions">
            <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
              {submitted ? (
                <span style={{ color: 'var(--stamp-green)', fontWeight: 600 }}>
                  🔒 Đơn đã nộp — Dữ liệu kiểm thử đã được khóa cho ca làm việc này.
                </span>
              ) : (
                <span>Nhấn <strong>Enter</strong> trong ô nhập hoặc bấm nút bên phải để áp dụng dữ liệu.</span>
              )}
            </div>

            {!submitted && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={synced}
                  data-synced={synced}
                  className="custom-test-apply-btn"
                >
                  {synced ? '✓ ĐÃ ĐỒNG BỘ CSDL & HỒ SƠ' : '⚡ ÁP DỤNG & ĐỒNG BỘ VÀO CSDL'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
