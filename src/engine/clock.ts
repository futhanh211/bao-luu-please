// Virtual clock based on working days (01-PROCESS-SPEC.md section 7)

export class Clock {
  private day: number;

  constructor(initialDay = 0) {
    this.day = initialDay;
  }

  public getDay(): number {
    return this.day;
  }

  public advance(days = 1): number {
    if (days < 0) {
      throw new Error('Cannot rewind clock');
    }
    this.day += days;
    return this.day;
  }

  public reset(day = 0): void {
    this.day = day;
  }
}
