import { MemoryGame } from "./core.js"

const game = MemoryGame.createGame({
  contents: new Set(["🍑", "🍎", "🍇", "🍉", "🍌", "🫐", "🥝", "🥥"]),
  duration: 10000
})

document.body.appendChild(game)

game.addEventListener("timechange", ({ detail: { currentTime } }) => {
  if (currentTime.hasSecondsChanged()) {
    const currentTimeElem = document.getElementById("current-time") as HTMLParagraphElement
    currentTimeElem.textContent = currentTime.getFormattedTime()
  }
})

game.addEventListener("gameover", ({ detail }) => {
  switch (detail.success) {
    case true:
      return alert("You won the game!")
    case false:
      return alert("You lost the game!")
  }
})
