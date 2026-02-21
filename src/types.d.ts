export {}

interface TimeChangeEventDetail {
  currentTime: number
}

declare global {
  interface HTMLElementEventMap {
    timechange: CustomEvent<TimeChangeEventDetail>
  }
}
