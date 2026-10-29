import React from 'react';
import { StudentApplicationForm } from '../../../engine/types';
import { Paper } from '../../kit/Paper';

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="ctsv-doc-row">
    <span className="ctsv-doc-label">{label}</span>
    <span className="ctsv-doc-value">{value}</span>
  </div>
);

/** Tờ đơn gốc của sinh viên — bản đối chiếu tên/MSSV/lý do. */
export const ApplicationCard: React.FC<{ form: StudentApplicationForm }> = ({ form }) => (
  <Paper className="ctsv-paper" rotation={-0.7}>
    <div className="ctsv-doc-head">
      <div className="ctsv-doc-kicker">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
      <h3 className="ctsv-doc-title">ĐƠN XIN NGHỈ HỌC TẠM THỜI</h3>
      <div className="ctsv-doc-kicker">Nộp trực tuyến · MF1</div>
    </div>
    <Row label="Họ và tên" value={form.fullName} />
    <Row label="MSSV" value={form.mssv} />
    <Row label="Lớp" value={form.className} />
    <Row label="Khoa" value={form.faculty} />
    <Row label="Lý do" value={form.reason} />
    <Row label="Số học kỳ" value={`${form.semesterCount} học kỳ`} />
    <Row label="Bắt đầu từ" value={form.startSemester} />
    <div className="ctsv-doc-foot">
      Người làm đơn: {form.fullName} · Cam kết: {form.commitment ? 'Đã xác nhận' : 'Chưa xác nhận'}
    </div>
  </Paper>
);
