interface GameArgs {
  contents: Set<string>
  duration?: number
}

type UnwrapIterable<T> = T extends Iterable<infer U> ? U : T

export class MemoryGame extends HTMLDivElement {
  #duration: number | null = null
  #currentTime: number = 0
  #timer: ReturnType<typeof setInterval> | null = null

  constructor() {
    super()
  }

  disconnectedCallback() {
    this.stopTimer()
  }

  addCards(contents: Array<UnwrapIterable<GameArgs["contents"]>>) {
    contents.forEach((content) => {
      const card = MemoryCard.createCard(content)
      this.appendChild(card)
    })
  }

  shuffleCards() {
    for (let i = this.childNodes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      this.appendChild(this.childNodes.item(j))
    }
  }

  private changeCurrentTime(newTime: (currentTime:number) => number) {
    this.#currentTime = newTime(this.#currentTime)

    const event = new CustomEvent("timechange", {
      detail: { currentTime: this.#currentTime }
    })

    this.dispatchEvent(event)

    return this.#currentTime > 0
  }

  startTimer(duration: number | null = null) {
    if (!duration || this.#duration) return
    this.changeCurrentTime(() => (this.#duration ?? duration) * 100)

    this.#timer = setInterval(() => {
      !this.changeCurrentTime((t) => (t -= 1)) && this.stopTimer()
    }, 10)
  }

  stopTimer() {
    if (!this.#timer) return
    clearInterval(this.#timer)
  }

  static createGame({ contents, duration }: GameArgs) {
    const game = document.createElement("div", { is: "memory-game" }) as MemoryGame

    const flatContents = Array.from(contents)
    game.addCards(Array.from([...flatContents, ...flatContents]))
    game.shuffleCards()
    game.startTimer(duration)

    return game
  }
}

type MemoryCardContent = UnwrapIterable<GameArgs["contents"]>

class MemoryCard extends HTMLDivElement {
  #content: MemoryCardContent | null = null

  constructor() {
    super()
  }

  connectedCallback() {
    this.textContent = this.#content
  }

  setContent(content: MemoryCardContent) {
    this.#content = content
  }

  compare(card: MemoryCard) {
    return card.#content === this.#content
  }

  static createCard(content: MemoryCardContent) {
    const card = document.createElement("div", { is: "memory-card" }) as MemoryCard

    card.setContent(content)

    return card
  }
}

customElements.define("memory-game", MemoryGame, { extends: "div" })
customElements.define("memory-card", MemoryCard, { extends: "div" })
