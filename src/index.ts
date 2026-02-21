import { MemoryGame } from "./core.js"

const game = MemoryGame.createGame({
  contents: new Set(["🍑", "🍎", "🍇", "🍉", "🍌", "🫐", "🥝", "🥥"])
})

document.body.appendChild(game)

game.addEventListener("timechange", (event) => {
  console.log(event.detail.currentTime)
})

console.log(game)
