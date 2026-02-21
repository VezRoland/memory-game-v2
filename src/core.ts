interface GameArgs {
  contents: Set<any>
  duration?: number
}

type UnwrapIterable<T> = T extends Iterable<infer U> ? U : T 

export class MemoryGame extends HTMLDivElement {
  constructor() {
    super()
  }

  addCards(contents: GameArgs["contents"]) {
    contents.forEach(content => {
      const card = MemoryCard.createCard(content)
      this.appendChild(card)
    })
  }

  shuffleCards() {}

  static createGame({ contents, duration }: GameArgs) {
    const game = document.createElement("div", { is: "memory-game" }) as MemoryGame

    game.addCards(contents)

    return game
  }
}

type MemoryCardContent = UnwrapIterable<GameArgs["contents"]>

class MemoryCard extends HTMLDivElement {
  #content: MemoryCardContent | undefined

  constructor() {
    super()
  }

  connectedCallback() {
    this.textContent = this.#content
  }

  setContent(content: MemoryCardContent) {
    this.#content = content
  }

  static createCard(content: MemoryCardContent) {
    const card = document.createElement("div", { is: "memory-card" }) as MemoryCard

    card.setContent(content)

    return card
  }
}

customElements.define("memory-game", MemoryGame, { extends: "div" })
customElements.define("memory-card", MemoryCard, { extends: "div" })
