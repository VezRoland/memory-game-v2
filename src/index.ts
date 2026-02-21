import { MemoryGame } from "./core.js"

const game = MemoryGame.createGame({
  contents: new Set(["a", "b", "c", "d", "e", "f", "g", "h"]),
  duration: 10
})

document.body.appendChild(game)

game.addEventListener("timechange", (event) => {
  console.log(event.detail.currentTime)
})

console.log(game)
