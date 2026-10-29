import React from 'react';
import { ControlData } from './useControlData';

const DOC_META: Record<'DO1' | 'DO2' | 'DO3', { icon: string; name: string; hint: string }> = {
  DO1: { icon: '📄', name: 'Hồ sơ bảo lưu', hint: 'T1 tạo khi hồ sơ hợp lệ' },
  DO2: { icon: '📝', name: 'Dự thảo quyết định', hint: 'T8 điền mẫu tự động' },
  DO3: { icon: '📜', name: 'Quyết định nghỉ học tạm thời', hint: 'T9 ký số → đóng dấu đỏ' },
};

const STAGE_LABEL: Record<string, string> = {
  created: 'Đã tạo',
  drafted: 'Đã soạn',
  signed: 'Đã ký số',
};

export const DocLifecycle: React.FC<{ documents: ControlData['documents'] }> = ({ documents }) => {
  return (
    <section className="control-panel control-docs">
      <div className="control-panel-head">
        <h2 className="control-panel-title">Vòng đời hồ sơ điện tử</h2>
        <span className="control-panel-note">DO1 → DO2 → DO3</span>
      </div>

      <div className="doc-row">
        {documents.map((doc) => {
          const meta = DOC_META[doc.id];
          return (
            <div
              key={doc.id}
              className="doc-item"
              data-present={doc.present ? 'true' : 'false'}
              data-signed={doc.signed ? 'true' : 'false'}
              title={meta.hint}
            >
              <span className="doc-icon">{meta.icon}</span>
              <span>
                <span className="doc-name">
                  {doc.id} · {meta.name}
                </span>
                <br />
                <span style={{ fontSize: 11, opacity: 0.8 }}>{meta.hint}</span>
              </span>
              <span className="doc-meta">
                {doc.present ? (STAGE_LABEL[doc.stage ?? ''] ?? doc.stage ?? 'Có') : 'chưa có'}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
};
