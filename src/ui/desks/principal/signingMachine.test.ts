import { describe, it, expect } from 'vitest';
import {
  nextSigningState,
  isSigningComplete,
  SigningState,
} from './signingMachine';

describe('signingMachine · nghi thức ký số BGH', () => {
  it('đi đúng chuỗi idle → tokenInserted → pinEntered → signing → signed', () => {
    let state: SigningState = 'idle';
    state = nextSigningState(state, 'insertToken');
    expect(state).toBe('tokenInserted');
    state = nextSigningState(state, 'enterPin');
    expect(state).toBe('pinEntered');
    state = nextSigningState(state, 'confirm');
    expect(state).toBe('signing');
    state = nextSigningState(state, 'finish');
    expect(state).toBe('signed');
    expect(isSigningComplete(state)).toBe(true);
  });

  it('bỏ qua bước thì đứng yên, không nhảy cóc', () => {
    expect(nextSigningState('idle', 'confirm')).toBe('idle');
    expect(nextSigningState('idle', 'finish')).toBe('idle');
    expect(nextSigningState('tokenInserted', 'confirm')).toBe('tokenInserted');
    expect(nextSigningState('pinEntered', 'finish')).toBe('pinEntered');
    expect(nextSigningState('signing', 'confirm')).toBe('signing');
  });

  it('ký xong thì không đổi trạng thái nữa, reset đưa về idle', () => {
    expect(nextSigningState('signed', 'insertToken')).toBe('signed');
    expect(nextSigningState('signed', 'confirm')).toBe('signed');
    expect(nextSigningState('signed', 'reset')).toBe('idle');
  });
});
