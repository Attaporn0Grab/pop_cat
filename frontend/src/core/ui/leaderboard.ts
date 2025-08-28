export type LBState = { open: boolean }

export function initialState(): LBState {
  return { open: false }
}

export function open(state: LBState): LBState {
  return { ...state, open: true }
}

export function close(state: LBState): LBState {
  return { ...state, open: false }
}

export function toggle(state: LBState): LBState {
  return { ...state, open: !state.open }
}
