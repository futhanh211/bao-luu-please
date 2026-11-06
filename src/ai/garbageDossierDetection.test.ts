import { describe, it, expect, beforeEach } from 'vitest';
import { MockAIProvider } from './mock';
import { buildFallbackDocScan } from './mockTemplates';
import { createEngine } from '../engine/engine';
import { PROCESS_DEF } from '../engine/process.def';
import { Clock } from '../engine/clock';
import { InMemoryStudentsDB } from '../data/students.db';
import { InMemoryAcademicFinanceDB } from '../data/academic-finance.db';
import { SCENARIOS } from '../data/scenarios';
import { EngineDeps, EngineEvent, EvidenceItem } from '../engine/types';
import { usePlaybackStore } from '../store/playback';
import { useAppStore } from '../store/useApp';

describe('Kiểm thử triệt để: Chống duyệt lọt hồ sơ rác (Garbage Dossier & OCR Verification)', () => {
  let deps: EngineDeps;
  let studentsDb: InMemoryStudentsDB;
  let academicFinanceDb: InMemoryAcademicFinanceDB;
  let clock: Clock;

  beforeEach(() => {
    clock = new Clock(0);
    studentsDb = new InMemoryStudentsDB();
    academicFinanceDb = new InMemoryAcademicFinanceDB();
    deps = {
      clock,
      db: { ds1: academicFinanceDb, ds2: studentsDb },
      ai: new MockAIProvider(undefined, 0),
    };
    useAppStore.setState({
      screen: 'desk',
      role: 'student',
      mode: 'play',
      sessionMode: 'portal',
    });
  });

  describe('1. AI-OCR: Nhận diện tệp rác và tệp không hợp lệ', () => {
    const ai = new MockAIProvider(undefined, 0);

    it('Tệp tên rác (ho_so_rac.png) bị phát hiện ngay lập tức: confidence thấp, không có dấu đỏ', async () => {
      const garbageFile = {
        name: 'ho_so_rac.png',
        size: 512,
        type: 'image/png',
      };
      const result = await ai.scanDocument(garbageFile, 'medical');

      expect(result.confidence).toBeLessThan(0.6);
      expect(result.extractedCount).toBe(0);
      expect(result.data.medical?.isValidStamp).toBe(false);
      expect(result.summary).toContain('CẢNH BÁO');
    });

    it('Tệp giả mạo hoặc meme (fake_document.pdf, con_meo.jpg) bị từ chối trích xuất', async () => {
      const fakeFile = {
        name: 'fake_document.pdf',
        size: 1024,
        type: 'application/pdf',
      };
      const result = await ai.scanDocument(fakeFile, 'military');

      expect(result.confidence).toBeLessThanOrEqual(0.3);
      expect(result.data.military?.isValidStamp).toBe(false);
    });

    it('Tệp ảnh bài tập / ứng dụng không liên quan (Chuyên đề Bác .jpg) vào mục y tế bị từ chối và cảnh báo', async () => {
      const irrelevantFile = {
        name: 'Chuyên đề Bác .jpg',
        size: 353400,
        type: 'image/jpeg',
      };
      const result = await ai.scanDocument(irrelevantFile, 'medical');

      expect(result.confidence).toBeLessThan(0.6);
      expect(result.extractedCount).toBe(0);
      expect(result.data.medical?.isValidStamp).toBe(false);
      expect(result.data.medical?.hospital).toBeUndefined();
      expect(result.summary).toContain('CẢNH BÁO');
    });

    it('Tệp nộp chéo loại minh chứng (Lệnh gọi nhập ngũ vào mục y tế) bị phát hiện và cảnh báo sai danh mục', async () => {
      const crossFile = {
        name: 'lenh_goi_nhap_ngu_bch_quan_su.pdf',
        size: 204800,
        type: 'application/pdf',
      };
      const result = await ai.scanDocument(crossFile, 'medical');

      expect(result.confidence).toBeLessThan(0.6);
      expect(result.extractedCount).toBe(0);
      expect(result.summary).toContain('CẢNH BÁO');
      expect(result.summary).toContain('không khớp');
    });

    it('Tệp hợp lệ thông thường (giay_ra_vien.jpg) vẫn được trích xuất đầy đủ', async () => {
      const validFile = {
        name: 'giay_ra_vien_bv_da_khoa_da_nang.jpg',
        size: 1024 * 300,
        type: 'image/jpeg',
      };
      const result = await ai.scanDocument(validFile, 'medical');

      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.extractedCount).toBeGreaterThan(0);
      expect(result.data.medical?.isValidStamp).toBe(true);
      expect(result.data.medical?.hospital).toContain('Đà Nẵng');
    });

    it('Tệp ảnh chụp thực tế từ thiết bị có tên UUID (12f3c20a-9a64-40cf-a6cd-0799c32fecf0.jpg) được nhận diện và trích xuất hợp lệ', async () => {
      const userUploadedFile = {
        name: '12f3c20a-9a64-40cf-a6cd-0799c32fecf0.jpg',
        size: 205100, // 205.1 KB đúng như trong ảnh người dùng
        type: 'image/jpeg',
      };
      const result = await ai.scanDocument(userUploadedFile, 'medical');

      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.extractedCount).toBe(8);
      expect(result.data.medical?.isValidStamp).toBe(true);
      expect(result.data.medical?.hospital).toContain('Mẫu Test');
      expect(result.data.medical?.doctorName).toContain('Trần Văn Mẫu');
      expect(result.data.medical?.recordCode).toBe('BA-2026-045872');
      expect(result.data.medical?.diagnosis).toContain('xương đùi');
    });

    it('Tệp ảnh Lệnh gọi nghĩa vụ quân sự tải lên (Gemini_Generated_Image_6k70jf6k70jf6k70.png) được trích xuất thành công', async () => {
      const militaryImageFile = {
        name: 'Gemini_Generated_Image_6k70jf6k70jf6k70.png',
        size: 7900000, // 7.9 MB đúng như trong ảnh người dùng
        type: 'image/png',
      };
      const result = await ai.scanDocument(militaryImageFile, 'military');

      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.extractedCount).toBe(6);
      expect(result.data.military?.isValidStamp).toBe(true);
      expect(result.data.military?.militaryUnit).toContain('Hải Châu');
      expect(result.data.military?.orderNumber).toBeTruthy();
      expect(result.summary).toContain('lệnh gọi nhập ngũ');
    });

    it('Tệp ảnh Xác nhận hoàn cảnh khó khăn tải lên từ thiết bị được trích xuất thành công', async () => {
      const hardshipImageFile = {
        name: 'xac_nhan_ubnd_ho_ngheo_photo.jpg',
        size: 320000,
        type: 'image/jpeg',
      };
      const result = await ai.scanDocument(hardshipImageFile, 'hardship');

      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.extractedCount).toBe(6);
      expect(result.data.hardship?.isValidStamp).toBe(true);
      expect(result.data.hardship?.authority).toContain('UBND');
      expect(result.data.hardship?.category).toBe('Hộ cận nghèo');
    });
  });

  describe('2. AI-1 DocScan: Đánh giá hồ sơ rác và trừ điểm confidence', () => {
    it('Hồ sơ chứa minh chứng rác (chuỗi rác, file rác) -> confidence < 0.6 và typeMatchesReason = false', () => {
      const garbageEvidence: EvidenceItem[] = [
        {
          id: 'ev_garbage_1',
          type: 'medical_record',
          name: 'Tệp tải lên: ho_so_rac.png',
          content: 'asdfghjk qwerty 12345 file rac',
          fields: [
            { id: 'hospital', label: 'Bệnh viện', value: 'rac' },
            { id: 'diagnosis', label: 'Chẩn đoán', value: 'asdf' },
          ],
        },
      ];

      const scanResult = buildFallbackDocScan(
        {
          fullName: 'Nguyễn Văn Test',
          mssv: '3121102001',
          className: '47K12.1',
          faculty: 'Khoa CNTT Kinh doanh',
          phone: '0905123456',
          email: 'test@due.edu.vn',
          reason: 'Ốm đau/tai nạn điều trị dài',
          semesterCount: 1,
          startSemester: 'Học kỳ 1 năm học 2026-2027',
          commitment: true,
        },
        garbageEvidence
      );

      expect(scanResult.typeMatchesReason).toBe(false);
      expect(scanResult.confidence).toBeLessThan(0.6);
      expect(scanResult.anomalies.some((a) => a.field === 'garbage')).toBe(true);
    });

    it('Hồ sơ tự nộp không có con dấu mộc đỏ -> bị đánh tụt confidence < 0.6', () => {
      const unsealedEvidence: EvidenceItem[] = [
        {
          id: 'ev_custom_med',
          type: 'medical_record',
          name: 'Giấy xác nhận bệnh viện',
          content: 'Chẩn đoán: Viêm ruột thừa. Không có dấu đỏ.',
          fields: [
            { id: 'hospital', label: 'Bệnh viện', value: 'Bệnh viện Đa khoa Đà Nẵng' },
            { id: 'diagnosis', label: 'Chẩn đoán', value: 'Viêm ruột thừa cấp' },
            { id: 'hospitalStamp', label: 'Dấu bệnh viện', value: 'Chưa có dấu mộc đỏ' },
          ],
          issueNotes: 'Giấy xác nhận chưa có chữ ký và dấu mộc đỏ của Bệnh viện theo quy định',
        },
      ];

      const scanResult = buildFallbackDocScan(
        {
          fullName: 'Lê Minh Custom',
          mssv: '3121102999',
          className: '47K12.1',
          faculty: 'Khoa CNTT Kinh doanh',
          phone: '0905123456',
          email: 'custom@due.edu.vn',
          reason: 'Ốm đau/tai nạn điều trị dài',
          semesterCount: 1,
          startSemester: 'Học kỳ 1 năm học 2026-2027',
          commitment: true,
        },
        unsealedEvidence
      );

      expect(scanResult.confidence).toBeLessThan(0.6);
      expect(scanResult.anomalies.some((a) => a.field === 'stamp')).toBe(true);
    });
  });

  describe('3. Engine BPMN G1 Gateway: Chặn đứng hồ sơ rác, trả hồ sơ ngay tại T1/G1', () => {
    it('Khi nộp 1 hồ sơ rác qua engine -> T1 phát hiện -> G1 rẽ Không sang T2 (MF2) -> E_END_RETURNED', async () => {
      const baseScenario = SCENARIOS[0];
      const customAi = new MockAIProvider(undefined, 0);
      const testDeps: EngineDeps = {
        clock,
        db: { ds1: academicFinanceDb, ds2: studentsDb },
        ai: customAi,
      };

      const engine = createEngine(PROCESS_DEF, baseScenario, testDeps);
      const events: EngineEvent[] = [];
      engine.subscribe((e) => events.push(e));

      const garbageEvidence: EvidenceItem[] = [
        {
          id: 'ev_custom_garbage',
          type: 'medical_record',
          name: 'Minh chứng gốc từ máy: ho_so_rac.png',
          content: 'Tệp rác không có nội dung bệnh viện hợp lệ',
          fields: [
            { id: 'hospital', label: 'Bệnh viện', value: 'rac' },
            { id: 'diagnosis', label: 'Chẩn đoán', value: 'asdfghjk' },
          ],
        },
      ];

      // Bắt đầu ca với hồ sơ rác
      await engine.start({
        form: {
          fullName: 'Trần Văn Rác',
          mssv: '3121102001',
          className: '47K12.1',
          faculty: 'Khoa CNTT Kinh doanh',
          phone: '0905123456',
          email: 'rac.tv@due.edu.vn',
          reason: 'Ốm đau/tai nạn điều trị dài',
          semesterCount: 1,
          startSemester: 'Học kỳ 1, Năm học 2026-2027',
          commitment: true,
        },
        attachedEvidenceIds: ['ev_custom_garbage'],
        evidence: garbageEvidence,
      });

      await engine.runUntilBlocked();

      // Kiểm tra sự kiện tại T1 và G1
      const aiResponseEvent = events.find(
        (e) => e.type === 'ai.responded' && e.touchpoint === 'AI-1'
      );
      expect(aiResponseEvent).toBeDefined();

      // G1 phải rẽ sang T2 (Không hợp lệ)
      const g1Branch = events.find(
        (e) => e.type === 'edge.traversed' && e.from === 'G1'
      );
      expect(g1Branch).toBeDefined();
      expect((g1Branch as { to: string }).to).toBe('T2');

      // Phải gửi thông báo MF2 trả hồ sơ cho sinh viên
      const mf2Sent = events.find(
        (e) => e.type === 'message.sent' && e.flowId === 'MF2'
      );
      expect(mf2Sent).toBeDefined();

      // Quy trình phải kết thúc tại E_END_RETURNED (Trả hồ sơ)
      const caseEnded = events.find((e) => e.type === 'case.ended');
      expect(caseEnded).toBeDefined();
      if (caseEnded?.type === 'case.ended') {
        expect(caseEnded.endEventId).toBe('E_END_RETURNED');
        expect(caseEnded.outcome).toBe('Trả hồ sơ');
      }

      // Tuyệt đối KHÔNG được lọt token sang G2, T4 (Cố vấn), T5 (CTSV), T9 (BGH)
      expect(events.some((e) => e.type === 'node.entered' && e.nodeId === 'G2')).toBe(false);
      expect(events.some((e) => e.type === 'node.entered' && e.nodeId === 'T4')).toBe(false);
      expect(events.some((e) => e.type === 'node.entered' && e.nodeId === 'T5')).toBe(false);
      expect(events.some((e) => e.type === 'node.entered' && e.nodeId === 'T9')).toBe(false);
    });

    it('Nộp form với các trường bắt buộc rỗng hoặc chỉ có khoảng trắng -> bị chặn tại T1', async () => {
      const baseScenario = SCENARIOS[0];
      const engine = createEngine(PROCESS_DEF, baseScenario, deps);
      const events: EngineEvent[] = [];
      engine.subscribe((e) => events.push(e));

      await engine.start({
        form: {
          fullName: '   ', // Chỉ có khoảng trắng
          mssv: '3121102001',
          className: '47K12.1',
          faculty: 'Khoa CNTT',
          phone: '0905123456',
          email: 'test@due.edu.vn',
          reason: 'Ốm đau/tai nạn điều trị dài',
          semesterCount: 1,
          startSemester: 'Học kỳ 1',
          commitment: true,
        },
        attachedEvidenceIds: [],
        evidence: [],
      });

      await engine.runUntilBlocked();

      expect(engine.state.validity.complete).toBe(false);
      expect(engine.state.validity.missing).toContain('Họ và tên');

      const caseEnded = events.find((e) => e.type === 'case.ended');
      expect(caseEnded).toBeDefined();
      if (caseEnded?.type === 'case.ended') {
        expect(caseEnded.endEventId).toBe('E_END_RETURNED');
      }
    });
  });

  describe('4. Store Integration: Nộp hồ sơ rác trong session sinh viên tự nhập', () => {
    it('Sinh viên tự nộp tệp ho_so_rac.png qua submitApplication -> Store tự động cập nhật status: returned', async () => {
      const student = {
        mssv: '3121102001',
        name: 'Nguyễn Minh Khoa',
        className: '47K12.1',
        faculty: 'Khoa CNTT Kinh doanh',
      };

      usePlaybackStore.getState().initStudentSession(student, 's6');

      const garbageItem: EvidenceItem = {
        id: 'ev_rac_uploaded_99',
        type: 'attached_file',
        name: 'ho_so_rac.png',
        content: 'Tệp hình ảnh rác tải lên từ máy tính',
        fileData: {
          name: 'ho_so_rac.png',
          size: 100,
          type: 'image/png',
        },
        fields: [
          { id: 'fileName', label: 'Tên tệp', value: 'ho_so_rac.png' },
        ],
      };

      usePlaybackStore.getState().setEvidenceList([garbageItem], true);

      // Sinh viên bấm Nộp trực tuyến
      await usePlaybackStore.getState().submitApplication();

      const state = usePlaybackStore.getState();
      expect(state.submitted).toBe(true);
      expect(state.mapState.caseEnded).toBe(true);

      // Phải có sự kiện kết thúc trả hồ sơ
      const returnedEvent = state.currentEventLog.find(
        (e) => e.type === 'case.ended' && e.endEventId === 'E_END_RETURNED'
      );
      expect(returnedEvent).toBeDefined();
    });
  });
});
