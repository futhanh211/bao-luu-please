import { Token, EngineEvent } from '../types';

export interface ScheduledTimer {
  timerId: string;
  targetNodeId: string;
  fireAtDay: number;
  fired: boolean;
}

export class TimerManager {
  private scheduled: ScheduledTimer | null = null;

  public schedule(
    timerId: string,
    targetNodeId: string,
    fireAtDay: number,
    emit: (event: EngineEvent) => void
  ): void {
    this.scheduled = {
      timerId,
      targetNodeId,
      fireAtDay,
      fired: false,
    };

    emit({
      type: 'timer.scheduled',
      timerId,
      targetNodeId,
      fireAtDay,
    });
  }

  public check(
    currentDay: number,
    caseId: string,
    emit: (event: EngineEvent) => void
  ): Token | null {
    if (!this.scheduled || this.scheduled.fired) {
      return null;
    }

    if (currentDay >= this.scheduled.fireAtDay) {
      this.scheduled.fired = true;

      emit({
        type: 'timer.fired',
        timerId: this.scheduled.timerId,
        targetNodeId: this.scheduled.targetNodeId,
        day: currentDay,
      });

      // Spawn a new token into the reminder branch (T6)
      // Non-interrupting: T4 token is NOT cancelled!
      return {
        id: `token_timer_${Date.now()}`,
        at: 'T6',
        caseId,
        branch: 'reminder',
      };
    }

    return null;
  }

  public cancel(targetNodeId?: string): void {
    if (!this.scheduled) return;
    if (!targetNodeId || this.scheduled.targetNodeId === targetNodeId) {
      this.scheduled = null;
    }
  }

  public reset(): void {
    this.scheduled = null;
  }

  public getScheduled(): ScheduledTimer | null {
    return this.scheduled ? { ...this.scheduled } : null;
  }
}
