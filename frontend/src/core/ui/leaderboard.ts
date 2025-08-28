/* Thai:
ชุด reducer สั้นๆ สำหรับ state ของแผง Leaderboard:
- initialState, open, close, toggle
- เขียนให้ฟังก์ชันเป็น pure และอ่านง่าย เหมาะกับการเทสและ reuse
*/
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
