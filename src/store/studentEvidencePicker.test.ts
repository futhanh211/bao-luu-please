import { describe, it, expect, beforeEach } from 'vitest';
import { usePlaybackStore } from './playback';
import {
  STUDENT_EVIDENCE_OPTIONS,
} from '../data/customTestData';

describe('Student Desk - Evidence Bag & Option Picker Workflow', () => {
  beforeEach(() => {
    usePlaybackStore.getState().initStudentSession({
      mssv: '251121536115',
      name: 'Phạm Minh Khôi',
      className: '51K36',
      faculty: 'Khoa Thống kê - Tin học',
    });
  });

  it('khởi tạo phiên sinh viên với túi minh chứng trống (không tự điền giấy ra viện mặc định)', () => {
    const state = usePlaybackStore.getState();
    expect(state.scenario?.evidence).toHaveLength(0);
    expect(state.submissionDraft?.attachedEvidenceIds).toHaveLength(0);
  });

  it('cung cấp đủ 4 tùy chọn minh chứng theo yêu cầu người dùng', () => {
    expect(STUDENT_EVIDENCE_OPTIONS).toHaveLength(4);
    const keys = STUDENT_EVIDENCE_OPTIONS.map((o) => o.key);
    expect(keys).toEqual(['medical', 'military', 'hardship', 'personal']);

    const titles = STUDENT_EVIDENCE_OPTIONS.map((o) => o.title);
    expect(titles).toContain('Giấy xác nhận của bệnh viện');
    expect(titles).toContain('Giấy đi nghĩa vụ quân sự');
    expect(titles).toContain('Giấy chứng minh hoàn cảnh gia đình');
    expect(titles).toContain('Lý do cá nhân khác');
  });

  it('chọn giấy xác nhận của bệnh viện -> cập nhật túi minh chứng và lý do ốm đau', () => {
    const medOpt = STUDENT_EVIDENCE_OPTIONS.find((o) => o.key === 'medical')!;
    const item = medOpt.buildItem('Phạm Minh Khôi');

    usePlaybackStore.getState().setEvidenceList([item], false);
    usePlaybackStore.getState().updateDraftForm({ reason: medOpt.matchingReason });

    const state = usePlaybackStore.getState();
    expect(state.scenario?.evidence).toHaveLength(1);
    expect(state.scenario?.evidence[0].type).toBe('medical_record');
    expect(state.scenario?.evidence[0].name).toContain('Giấy xác nhận của bệnh viện');
    expect(state.submissionDraft?.form.reason).toBe('Ốm đau/tai nạn điều trị dài');
  });

  it('chọn giấy đi nghĩa vụ quân sự -> cập nhật túi minh chứng và lý do quân sự', () => {
    const milOpt = STUDENT_EVIDENCE_OPTIONS.find((o) => o.key === 'military')!;
    const item = milOpt.buildItem('Phạm Minh Khôi');

    usePlaybackStore.getState().setEvidenceList([item], false);
    usePlaybackStore.getState().updateDraftForm({ reason: milOpt.matchingReason });

    const state = usePlaybackStore.getState();
    expect(state.scenario?.evidence).toHaveLength(1);
    expect(state.scenario?.evidence[0].type).toBe('military_call');
    expect(state.submissionDraft?.form.reason).toBe('Nghĩa vụ quân sự');
  });

  it('chọn giấy chứng minh hoàn cảnh gia đình -> cập nhật hoàn cảnh gia đình', () => {
    const hardOpt = STUDENT_EVIDENCE_OPTIONS.find((o) => o.key === 'hardship')!;
    const item = hardOpt.buildItem('Phạm Minh Khôi');

    usePlaybackStore.getState().setEvidenceList([item], false);
    usePlaybackStore.getState().updateDraftForm({ reason: hardOpt.matchingReason });

    const state = usePlaybackStore.getState();
    expect(state.scenario?.evidence).toHaveLength(1);
    expect(state.scenario?.evidence[0].type).toBe('hardship_proof');
    expect(state.submissionDraft?.form.reason).toBe('Hoàn cảnh gia đình');
  });

  it('chọn lý do cá nhân khác -> cập nhật lý do cá nhân khác', () => {
    const persOpt = STUDENT_EVIDENCE_OPTIONS.find((o) => o.key === 'personal')!;
    const item = persOpt.buildItem('Phạm Minh Khôi');

    usePlaybackStore.getState().setEvidenceList([item], false);
    usePlaybackStore.getState().updateDraftForm({ reason: persOpt.matchingReason });

    const state = usePlaybackStore.getState();
    expect(state.scenario?.evidence).toHaveLength(1);
    expect(state.scenario?.evidence[0].type).toBe('personal_reason');
    expect(state.submissionDraft?.form.reason).toBe('Lý do cá nhân khác');
  });

  it('cho phép xóa minh chứng khỏi túi và khay đính kèm', () => {
    const medOpt = STUDENT_EVIDENCE_OPTIONS.find((o) => o.key === 'medical')!;
    const item = medOpt.buildItem('Phạm Minh Khôi');

    usePlaybackStore.getState().setEvidenceList([item], true);
    expect(usePlaybackStore.getState().scenario?.evidence).toHaveLength(1);
    expect(usePlaybackStore.getState().submissionDraft?.attachedEvidenceIds).toContain(item.id);

    usePlaybackStore.getState().removeEvidenceItem(item.id);
    expect(usePlaybackStore.getState().scenario?.evidence).toHaveLength(0);
    expect(usePlaybackStore.getState().submissionDraft?.attachedEvidenceIds).not.toContain(item.id);
  });
});
