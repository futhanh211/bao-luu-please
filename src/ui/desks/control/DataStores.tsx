import React from 'react';
import { StoreInfo } from './useControlData';

interface DataStoresProps {
  stores: StoreInfo[];
  mssv: string;
  studentStatus: string;
  studentStatusBefore: string;
  rulesFailed: number;
}

const STORE_META: Record<'DS1' | 'DS2', { icon: string; title: string; subtitle: string }> = {
  DS1: {
    icon: '🗄️',
    title: 'DS1 · CSDL Đào tạo & Tài chính',
    subtitle: 'T3 đọc học kỳ, kỷ luật, công nợ, cờ buộc thôi học',
  },
  DS2: {
    icon: '🖥️',
    title: 'DS2 · CSDL Quản lý sinh viên',
    subtitle: 'T1 tra hồ sơ · T10 ghi trạng thái',
  },
};

export const DataStores: React.FC<DataStoresProps> = ({
  stores,
  mssv,
  studentStatus,
  studentStatusBefore,
  rulesFailed,
}) => {
  return (
    <section className="control-panel control-stores">
      <div className="control-panel-head">
        <h2 className="control-panel-title">Tủ dữ liệu</h2>
        <span className="control-panel-note">nhấp sáng khi đọc / ghi</span>
      </div>

      {stores.map((store) => {
        const meta = STORE_META[store.id];
        return (
          <div key={store.id} className="store-card" data-flash={store.flashing ? 'true' : 'false'}>
            <div className="store-card-head">
              <span>
                {meta.icon} <strong>{store.id}</strong>
              </span>
              <span style={{ fontSize: 13, color: 'var(--paper-dim)' }}>
                đọc {store.reads} · ghi {store.writes}
              </span>
            </div>
            <div className="store-record">{meta.title}</div>
            <div className="store-record">{meta.subtitle}</div>

            {store.id === 'DS1' && (
              <div className="store-record">
                Bản ghi: <b>{mssv}</b>
                <br />
                Đối chiếu R1–R4: <b>{rulesFailed > 0 ? `${rulesFailed} quy tắc không đạt` : 'chưa có vi phạm'}</b>
              </div>
            )}

            {store.id === 'DS2' && (
              <div className="store-record">
                Bản ghi: <b>{store.lastEntity ?? mssv}</b>
                <br />
                Trạng thái: <b>{studentStatusBefore}</b>
                {studentStatus !== studentStatusBefore && (
                  <>
                    {' → '}
                    <b>{studentStatus}</b>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
};
