import { EventEmitter, once } from "node:events"
import { stripVTControlCharacters } from "node:util"
import { vi } from "vitest"

const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

const terminal = new EventEmitter()

vi.stubGlobal("prompt", () => {
  terminal.emit("prompt")
  return once(terminal, "line").then(([line]) => line)
})

export const shown = () =>
  stripVTControlCharacters(
    stdout.mock.calls.map(([chunk]) => String(chunk)).join(""),
  )

export const type = (line: string) => {
  stdout.mockClear()
  const nextPrompt = once(terminal, "prompt")
  terminal.emit("line", line)
  return nextPrompt
}

export const exit = () => terminal.emit("line", null)
