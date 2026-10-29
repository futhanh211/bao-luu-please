import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../../store/useApp';
import { RuleRow } from './useControlData';

export const RulesTable: React.FC<{ rules: RuleRow[] }> = ({ rules }) => {
  const speed = useAppStore((s) => s.speed) || 1;
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (rules.length === 0) {
      setShown(0);
      return undefined;
    }
    if (reducedMotion) {
      setShown(rules.length);
      return undefined;
    }

    setShown(0);
    const timers = rules.map((_, index) =>
      setTimeout(() => setShown(index + 1), (index * 300) / speed)
    );
    return () => timers.forEach(clearTimeout);
  }, [rules.length, speed, reducedMotion]);

  return (
    <section className="control-panel control-rules">
      <div className="control-panel-head">
        <h2 className="control-panel-title">Bộ quy tắc T3 · R1–R4</h2>
        <span className="control-panel-note">rule engine, không dùng AI</span>
      </div>

      {rules.length === 0 && <div className="rules-empty">Chưa đối chiếu — T3 chưa chạy.</div>}

      {rules.length > 0 && (
        <div className="rules-table">
          {rules.map((rule, index) => {
            if (index >= shown) return null;
            return (
              <div
                key={`${rule.id}_${index}`}
                className="rule-row"
                data-passed={rule.passed ? 'true' : 'false'}
              >
                <span className="rule-id">{rule.id}</span>
                <span>
                  {rule.id === 'R1'
                    ? 'Đã học tối thiểu 1 học kỳ'
                    : rule.id === 'R2'
                      ? 'Không trong thời gian bị kỷ luật'
                      : rule.id === 'R3'
                        ? 'Công nợ học phí = 0'
                        : 'Không thuộc diện buộc thôi học'}
                  <span className="rule-detail">{rule.detail}</span>
                </span>
                <span className="rule-mark">{rule.passed ? '✓' : '✗'}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
