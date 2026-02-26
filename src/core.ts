interface GameArgs {
  contents: Set<string>
  duration?: number
}

type UnwrapIterable<T> = T extends Iterable<infer U> ? U : T

type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never

export type GameEndState =
  | {
      success: true
      statistics: Record<string, string>
    }
  | {
      success: false
      reason: GameOverReason
      statistics: Record<string, string>
    }

type GameOverReason = "reachedTimeLimit" | "reachedFlipLimit"

export class MemoryGame extends HTMLDivElement {
  #isComparingCards = false

  #cardsToBeCompared: Set<MemoryCard> = new Set()
  #flippedCards: Set<MemoryCard> = new Set()

  #duration: Timestamp = new Timestamp(0)
  #currentTime: Timestamp = new Timestamp(0)
  #timer: ReturnType<typeof setInterval> | null = null

  constructor() {
    super()
  }

  connectedCallback() {
    this.classList.add("memory-game")
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

  async flipCard(card: MemoryCard) {
    if (
      this.#isComparingCards ||
      this.#cardsToBeCompared.has(card) ||
      this.#flippedCards.has(card)
    )
      return

    this.#cardsToBeCompared.add(card)
    const [cardA, cardB] = this.#cardsToBeCompared

    if (!cardA || !cardB) return await card.flip()
    else this.#isComparingCards = true

    await card.flip()

    if (cardA.compare(cardB)) {
      this.#flippedCards.add(cardA)
      this.#flippedCards.add(cardB)
      await Promise.all([cardA.hide(), cardB.hide()])
    } else {
      await Promise.all([
        cardA.flip({ delay: 500, direction: "reverse" }),
        cardB.flip({ delay: 500, direction: "reverse" })
      ])
    }

    this.#isComparingCards = false
    this.#cardsToBeCompared.clear()

    if (this.#flippedCards.size === this.childNodes.length)
      this.endGame({ success: true })
  }

  private changeCurrentTime(newTime: (currentTime: number) => number) {
    this.#currentTime.setTime(newTime(this.#currentTime.getTime()))

    const event = new CustomEvent("timechange", {
      detail: { currentTime: this.#currentTime }
    })

    this.dispatchEvent(event)

    return this.#currentTime.getTime() > 0
  }

  startTimer(duration: number | null = null) {
    this.stopTimer()

    if (duration !== null) {
      this.#duration.setTime(duration)
      this.#currentTime.setTime(duration)
    }

    this.#timer = setInterval(() => {
      if (!this.changeCurrentTime((t) => t - 10)) {
        this.stopTimer()
        this.endGame({ success: false, reason: "reachedTimeLimit" })
      }
    }, 10)
  }

  stopTimer() {
    if (!this.#timer) return
    clearInterval(this.#timer)
  }

  static createGame({ contents, duration }: GameArgs) {
    const game = document.createElement("div", { is: "memory-game" }) as MemoryGame

    const flatContents = Array.from(contents)
    game.addCards([...flatContents, ...flatContents])
    game.shuffleCards()
    game.startTimer(duration)

    return game
  }

  endGame(state: DistributiveOmit<GameEndState, "statistics">) {
    const event = new CustomEvent("gameover", {
      detail: {
        ...state,
        statistics: {
          duration: this.#duration,
          timeElapsed: this.#currentTime
        }
      }
    })

    setTimeout(() => this.dispatchEvent(event), 10)
  }
}

type MemoryCardContent = UnwrapIterable<GameArgs["contents"]>

class MemoryCard extends HTMLDivElement {
  flipped = false
  #content: MemoryCardContent | null = null

  constructor() {
    super()
  }

  connectedCallback() {
    const template = document.getElementById(
      "memory-card-template"
    ) as HTMLTemplateElement

    this.appendChild(template.content.cloneNode(true))
    this.classList.add("card")

    this.addEventListener("click", this.handleFlip)
  }

  disconnectedCallback() {
    this.removeEventListener("click", this.handleFlip)
  }

  setContent(content: MemoryCardContent) {
    this.#content = content
  }

  static createCard(content: MemoryCardContent) {
    const card = document.createElement("div", { is: "memory-card" }) as MemoryCard

    card.setContent(content)

    return card
  }

  compare(card: MemoryCard) {
    return card.#content === this.#content
  }

  async flip({
    duration = 300,
    delay = 0,
    direction = "normal"
  }: {
    duration?: EffectTiming["duration"]
    delay?: EffectTiming["delay"]
    direction?: EffectTiming["direction"]
  } = {}) {
    const inside = this.querySelector(".card-inside")
    const back = this.querySelector(".card-back")
    if (!inside || !back) return

    const animation = inside.animate(
      [{ transform: "rotateY(0deg)" }, { transform: "rotateY(180deg)" }],
      {
        duration,
        delay,
        fill: "forwards",
        easing: "ease-in-out",
        direction
      }
    )

    if (direction === "normal") back.textContent = this.#content

    await animation.finished

    if (direction === "reverse") back.textContent = null
  }

  async hide() {
    const animation = this.animate(
      [
        { opacity: "100%", scale: "100%" },
        { opacity: "0%", scale: "25%" }
      ],
      {
        duration: 300,
        fill: "forwards",
        easing: "ease-in-out"
      }
    )

    await animation.finished

    this.classList.add("card-hidden")
  }

  private handleFlip() {
    const parent = this.parentNode as MemoryGame
    parent.flipCard(this)
  }
}

export class Timestamp {
  #ms = 0
  #lastFormattedSeconds = -1
  #formattedCache = ""

  constructor(ms: number) {
    this.#ms = ms
  }

  getTime() {
    return this.#ms
  }

  setTime(ms: number) {
    this.#ms = ms
  }

  getFormattedTime() {
    if (!this.hasSecondsChanged()) return this.#formattedCache

    this.#lastFormattedSeconds = Math.ceil(this.#ms / 1000)
    this.#formattedCache = this.#format()

    return this.#formattedCache
  }

  hasSecondsChanged() {
    return Math.ceil(this.#ms / 1000) !== this.#lastFormattedSeconds
  }

  #format() {
    const totalDisplaySeconds = Math.ceil(this.#ms / 1000)
    const minutes = Math.floor(totalDisplaySeconds / 60)
    const seconds = totalDisplaySeconds % 60

    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }
}

customElements.define("memory-game", MemoryGame, { extends: "div" })
customElements.define("memory-card", MemoryCard, { extends: "div" })
