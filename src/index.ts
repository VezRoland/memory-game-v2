import { MemoryGame } from "./core.js"

const game = MemoryGame.createGame({ contents: new Set([ "a", "b", "c", "d" ]) })
document.body.appendChild(game)

console.log(game)
