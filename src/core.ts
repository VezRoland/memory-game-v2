interface GameArgs {
  contents: Set<string>
  duration?: number
}

type UnwrapIterable<T> = T extends Iterable<infer U> ? U : T

export class MemoryGame extends HTMLDivElement {
  #isComparingCards = false

  #cardsToBeCompared: Set<MemoryCard> = new Set()
  #flippedCards: Set<MemoryCard> = new Set()

  #duration: number | null = null
  #currentTime: number = 0
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
    if (this.#isComparingCards || this.#cardsToBeCompared.has(card)) return

    this.#cardsToBeCompared.add(card)
    const [cardA, cardB] = this.#cardsToBeCompared

    if (!cardA || !cardB) return await card.flip()
    else this.#isComparingCards = true

    await card.flip()

    if (cardA.compare(cardB)) {
      this.#flippedCards.add(cardA)
      this.#flippedCards.add(cardB)
    } else {
      await Promise.all([
        cardA.flip({ delay: 500, direction: "reverse" }),
        cardB.flip({ delay: 500, direction: "reverse" })
      ])
    }

    this.#isComparingCards = false
    this.#cardsToBeCompared.clear()
  }

  private changeCurrentTime(newTime: (currentTime: number) => number) {
    this.#currentTime = newTime(this.#currentTime)

    const event = new CustomEvent("timechange", {
      detail: { currentTime: this.#currentTime }
    })

    this.dispatchEvent(event)

    return this.#currentTime > 0
  }

  startTimer(duration: number | null = null) {
    let targetDuration = duration ?? this.#duration
    if (!targetDuration) return

    this.#duration = targetDuration
    this.changeCurrentTime(() => targetDuration * 100)

    this.#timer = setInterval(() => {
      !this.changeCurrentTime((t) => t - 1) && this.stopTimer()
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

  private handleFlip() {
    const parent = this.parentNode as MemoryGame
    parent.flipCard(this)
  }
}

customElements.define("memory-game", MemoryGame, { extends: "div" })
customElements.define("memory-card", MemoryCard, { extends: "div" })
