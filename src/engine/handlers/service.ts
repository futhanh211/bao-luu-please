import { CaseState, Token, EngineDeps, EngineEvent, DocScanResult } from '../types';

export async function handleServiceTask(
  nodeId: string,
  state: CaseState,
  _token: Token,
  deps: EngineDeps,
  emit: (event: EngineEvent) => void
): Promise<void> {
  switch (nodeId) {
    case 'T1': {
      // AI touchpoint AI-1
      emit({ type: 'ai.requested', touchpoint: 'AI-1', source: 'T1', payload: { mssv: state.form.mssv } });

      // Check required fields
      const missing: string[] = [];
      if (!state.form.fullName) missing.push('Họ và tên');
      if (!state.form.mssv) missing.push('Mã số sinh viên');
      if (!state.form.reason) missing.push('Lý do nghỉ học');
      if (!state.form.semesterCount) missing.push('Số học kỳ xin nghỉ');
      if (!state.form.commitment) missing.push('Cam kết');

      // Check if student exists in DS2
      emit({ type: 'data.read', storeId: 'DS2', entityId: state.form.mssv });
      const student = deps.db.ds2.get(state.form.mssv);
      if (!student) {
        missing.push('Không tìm thấy sinh viên trong CSDL Quản lý sinh viên (DS2)');
      }

      // Analyze documents with AI
      const docResult: DocScanResult = await deps.ai.analyzeDocuments({
        form: state.form,
        evidence: state.evidence,
      });

      emit({ type: 'ai.responded', touchpoint: 'AI-1', source: 'T1', result: docResult });

      const evidenceOk = docResult.typeMatchesReason && docResult.confidence >= 0.6;
      const complete = missing.length === 0;

      state.validity = {
        complete,
        missing,
        evidenceOk,
      };

      if (complete && evidenceOk) {
        state.dataObjects.DO1 = true;
        emit({ type: 'dataobject.changed', id: 'DO1', stage: 'created', payload: state.form });
      }
      break;
    }

    case 'T6': {
      // Send reminder to advisor
      const reminderDay = deps.clock.getDay();
      state.advisor.remindedAt = reminderDay;

      const messageContent = `[HỆ THỐNG NHẮC VIỆC SLA] Hồ sơ bảo lưu của sinh viên ${state.form.fullName} (MSSV: ${state.form.mssv}) đã chờ quá 3 ngày làm việc. Đề nghị Cố vấn học tập hoàn tất xác nhận.`;
      state.messages.push({
        id: `msg_remind_${Date.now()}`,
        recipient: 'advisor',
        title: 'Thông báo nhắc việc xác nhận hồ sơ quá hạn SLA',
        content: messageContent,
        day: reminderDay,
      });

      emit({
        type: 'message.sent',
        flowId: 'INTERNAL_ADVISOR_REMIND',
        payload: { recipient: 'advisor', day: reminderDay, mssv: state.form.mssv },
      });
      break;
    }

    case 'T8': {
      // Initialize draft decision
      emit({ type: 'ai.requested', touchpoint: 'AI-4', source: 'T8' });
      const basis = await deps.ai.draftText('decisionBasis', {
        form: state.form,
        validity: state.validity,
        ruleResult: state.ruleResult,
      });
      emit({ type: 'ai.responded', touchpoint: 'AI-4', source: 'T8', result: basis });

      state.decisionDoc = {
        number: `BL-${state.form.mssv.slice(-4)}/QĐ-ĐHKT`,
        decisionDate: `Ngày ${deps.clock.getDay() + 1}`,
        studentName: state.form.fullName,
        mssv: state.form.mssv,
        faculty: state.form.faculty,
        durationSemesters: state.form.semesterCount,
        startSemester: state.form.startSemester,
        basisText: basis,
        signed: false,
      };

      state.dataObjects.DO2 = true;
      emit({ type: 'dataobject.changed', id: 'DO2', stage: 'drafted', payload: state.decisionDoc });
      break;
    }

    case 'T10': {
      // Update student status in DS2
      deps.db.ds2.updateStudentStatus(state.form.mssv, 'Bảo lưu');
      state.studentStatus = 'Bảo lưu';

      emit({
        type: 'data.written',
        storeId: 'DS2',
        entityId: state.form.mssv,
        payload: { status: 'Bảo lưu' },
      });
      break;
    }

    default:
      break;
  }
}
