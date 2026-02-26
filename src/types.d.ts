import type { GameEndState, Timestamp } from "./core.js"

export {}

declare global {
  interface TimeChangeEventDetail {
    currentTime: Timestamp
  }

  interface HTMLElementEventMap {
    timechange: CustomEvent<TimeChangeEventDetail>
    gameover: CustomEvent<GameEndState>
  }
}
