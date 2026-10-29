import React from 'react';
import { ControlTerminal } from './control/ControlTerminal';
import { DataStores } from './control/DataStores';
import { DocLifecycle } from './control/DocLifecycle';
import { RulesTable } from './control/RulesTable';
import { StatusStrip } from './control/StatusStrip';
import { useControlData } from './control/useControlData';

/**
 * Phòng điều khiển (Lane L1) — chỉ QUAN SÁT engine qua event log.
 * Không có nút điều khiển engine ở đây; người điều khiển dùng HUD / overlay bản đồ.
 */
export const ControlRoom: React.FC = () => {
  const data = useControlData();
  const rulesFailed = data.rules.filter((rule) => !rule.passed).length;

  return (
    <div className="control-page">
      <StatusStrip
        scenario={data.scenario}
        day={data.day}
        activeNodeId={data.activeNodeId}
        activeNodeLabel={data.activeNodeLabel}
        caseEnded={data.caseEnded}
        endOutcome={data.endOutcome}
      />

      <div className="control-grid">
        <ControlTerminal lines={data.lines} />

        <DataStores
          stores={data.stores}
          mssv={data.mssv}
          studentStatus={data.studentStatus}
          studentStatusBefore={data.studentStatusBefore}
          rulesFailed={rulesFailed}
        />

        <DocLifecycle documents={data.documents} />

        <RulesTable rules={data.rules} />
      </div>
    </div>
  );
};
