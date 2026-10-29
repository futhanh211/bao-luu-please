export type SigningState =
  | 'idle'
  | 'tokenInserted'
  | 'pinEntered'
  | 'signing'
  | 'signed';

export type SigningAction =
  | 'insertToken'
  | 'enterPin'
  | 'confirm'
  | 'finish'
  | 'reset';

/** State machine thuần cho nghi thức ký số ở bàn BGH. */
export function nextSigningState(
  state: SigningState,
  action: SigningAction
): SigningState {
  if (action === 'reset') return 'idle';

  switch (state) {
    case 'idle':
      return action === 'insertToken' ? 'tokenInserted' : state;
    case 'tokenInserted':
      return action === 'enterPin' ? 'pinEntered' : state;
    case 'pinEntered':
      return action === 'confirm' ? 'signing' : state;
    case 'signing':
      return action === 'finish' ? 'signed' : state;
    case 'signed':
      return state;
    default:
      return state;
  }
}

export const SIGNING_STEP_LABELS: Record<SigningState, string> = {
  idle: 'Chờ cắm USB token',
  tokenInserted: 'Đã cắm USB token',
  pinEntered: 'Đã nhập PIN',
  signing: 'Đang ký số…',
  signed: 'Đã ký số',
};

export function isSigningComplete(state: SigningState): boolean {
  return state === 'signed';
}
