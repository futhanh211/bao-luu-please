import { useMemo } from 'react';
import { usePlaybackStore } from '../../../store/playback';
import { PROCESS_DEF } from '../../../engine/process.def';
import { EngineEvent } from '../../../engine/types';
import { ScenarioConfig } from '../../../data/scenarios';
import { MapDisplayState } from '../../map/mapState';
import { buildControlLines, ControlLine } from './controlLog';

export interface RuleRow {
  id: string;
  passed: boolean;
  detail: string;
}

export interface StoreInfo {
  id: 'DS1' | 'DS2';
  reads: number;
  writes: number;
  lastEntity: string | null;
  lastStatus: string | null;
  flashing: boolean;
}

export interface ControlData {
  scenario: ScenarioConfig | null;
  day: number;
  lines: ControlLine[];
  rules: RuleRow[];
  stores: StoreInfo[];
  documents: { id: 'DO1' | 'DO2' | 'DO3'; stage: string | null; present: boolean; signed: boolean }[];
  activeNodeId: string | null;
  activeNodeLabel: string;
  caseEnded: boolean;
  endOutcome: string | null;
  studentStatus: string;
  studentStatusBefore: string;
  mssv: string;
  evidenceCount: number;
  mapState: MapDisplayState;
}

function lastIndex(log: EngineEvent[], match: (event: EngineEvent) => boolean): number {
  for (let i = log.length - 1; i >= 0; i -= 1) {
    if (match(log[i])) return i;
  }
  return -1;
}

function storeInfo(log: EngineEvent[], id: 'DS1' | 'DS2'): StoreInfo {
  const readIdx = lastIndex(log, (e) => e.type === 'data.read' && e.storeId === id);
  const writeIdx = lastIndex(log, (e) => e.type === 'data.written' && e.storeId === id);
  const readEvent = readIdx >= 0 ? log[readIdx] : null;
  const writeEvent = writeIdx >= 0 ? log[writeIdx] : null;
  const lastEntity =
    (writeEvent?.type === 'data.written' ? writeEvent.entityId : null) ??
    (readEvent?.type === 'data.read' ? readEvent.entityId : null);
  const lastStatus =
    writeEvent?.type === 'data.written'
      ? ((writeEvent.payload as { status?: string } | undefined)?.status ?? null)
      : null;
  const newest = Math.max(readIdx, writeIdx);
  const flashing = newest >= 0 && log.length - newest <= 3;

  return {
    id,
    reads: log.filter((e) => e.type === 'data.read' && e.storeId === id).length,
    writes: log.filter((e) => e.type === 'data.written' && e.storeId === id).length,
    lastEntity,
    lastStatus,
    flashing,
  };
}

/** Gom dữ liệu quan sát cho Phòng điều khiển từ event log thật của engine. */
export function useControlData(): ControlData {
  const log = usePlaybackStore((s) => s.currentEventLog);
  const scenario = usePlaybackStore((s) => s.scenario);
  const mapState = usePlaybackStore((s) => s.mapState);
  const engine = usePlaybackStore((s) => s.engine);
  const studentRecord = usePlaybackStore((s) => s.studentRecord);

  const evidenceCount = engine?.state.evidence.length ?? 0;
  const mssv = engine?.state.form.mssv ?? scenario?.form.mssv ?? '—';

  const lines = useMemo(
    () => buildControlLines(log, { evidenceCount }),
    [log, evidenceCount]
  );

  const rules = useMemo<RuleRow[]>(
    () =>
      log.flatMap((event) =>
        event.type === 'rule.evaluated'
          ? [{ id: event.ruleId, passed: event.passed, detail: event.detail }]
          : []
      ),
    [log]
  );

  const documents = useMemo(() => {
    const ids: Array<'DO1' | 'DO2' | 'DO3'> = ['DO1', 'DO2', 'DO3'];
    return ids.map((id) => {
      const changed = [...log].reverse().find((e) => e.type === 'dataobject.changed' && e.id === id);
      const stage = changed?.type === 'dataobject.changed' ? changed.stage : null;
      return {
        id,
        stage,
        present: Boolean(mapState.visibleDataObjects[id] || stage),
        signed: stage === 'signed',
      };
    });
  }, [log, mapState.visibleDataObjects]);

  const activeNodeId = useMemo(() => {
    const active = Object.entries(mapState.nodeStates).find(
      ([, status]) => status === 'active' || status === 'waiting'
    );
    return active?.[0] ?? mapState.activeNodeId ?? null;
  }, [mapState.nodeStates, mapState.activeNodeId]);

  const activeNodeLabel = activeNodeId
    ? (PROCESS_DEF.nodes.find((n) => n.id === activeNodeId)?.name ?? activeNodeId)
    : 'Chờ lệnh';

  return {
    scenario,
    day: mapState.counters.day,
    lines,
    rules,
    stores: [storeInfo(log, 'DS1'), storeInfo(log, 'DS2')],
    documents,
    activeNodeId,
    activeNodeLabel,
    caseEnded: mapState.caseEnded,
    endOutcome: mapState.endOutcome ?? null,
    studentStatus: engine?.state.studentStatus ?? 'Đang học',
    studentStatusBefore: studentRecord?.status ?? 'Đang học',
    mssv,
    evidenceCount,
    mapState,
  };
}
