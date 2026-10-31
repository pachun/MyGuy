import { stripVTControlCharacters } from "node:util"
import wrapAnsi from "wrap-ansi"

const enterOrNewline = /\r|\n/
const backspace = "\x7f"
const controlC = "\x03"
const controlD = "\x04"
const escapeKey = "\x1b"
const tab = "\t"

const labelWidth = (label: string): number =>
  stripVTControlCharacters(`${label} `).length
const rightMargin = "  "
const startOfLine = "\r"
const clearLine = "\r\x1b[K"
const clearBelow = "\x1b[J"
const cursorUp = (rows: number): string => (rows > 0 ? `\x1b[${rows}A` : "")
const cursorToColumn = (column: number): string => `\x1b[${column}G`

type Hints = readonly [current: string, toggled: string]
const noHints: Hints = ["", ""]

type Read = { line: string | null; toggled: boolean }

const typedRows = (label: string, buffer: string): string[] => {
  const columns = process.stdout.columns ?? 80
  return wrapAnsi(buffer, columns - labelWidth(label) - rightMargin.length, {
    trim: false,
  })
    .split("\n")
    .map((row, index) => (index === 0 ? row : row.trimStart()))
}

export const typedLine = (label: string, buffer: string): string =>
  `${label} ${typedRows(label, buffer).join(`\n${" ".repeat(labelWidth(label))}`)}`

const draw = (
  label: string,
  buffer: string,
  drawnRows: number,
  hint: string,
): number => {
  const rows = typedRows(label, buffer)
  const endOfLastRow = labelWidth(label) + (rows.at(-1)?.length ?? 0) + 1
  process.stdout.write(
    `${startOfLine}${cursorUp(drawnRows - 1)}${clearBelow}${typedLine(label, buffer)}\n${hint}${cursorUp(1)}${cursorToColumn(endOfLastRow)}`,
  )
  return rows.length
}

const editLine = (label: string, hints: Hints): Promise<Read> =>
  new Promise(resolve => {
    const hintAfter = (tabs: number): string => hints[tabs % 2] ?? ""

    const finish = (line: string | null, tabs: number): void => {
      process.stdout.write(`\n${clearLine}`)
      process.stdin.setRawMode(false)
      process.stdin.pause()
      resolve({ line, toggled: tabs % 2 === 1 })
    }

    const onKeystroke = (
      buffer: string,
      drawnRows: number,
      tabs: number,
      chunk: string,
    ): void => {
      const [typed = "", ...afterEnter] = chunk.split(enterOrNewline)
      const submitted = buffer + typed
      if (chunk === controlC || (chunk === controlD && buffer === "")) {
        finish(null, tabs)
      } else if (afterEnter.length > 0 && submitted.trim() === "") {
        awaitKeystroke(buffer, drawnRows, tabs)
      } else if (afterEnter.length > 0) {
        finish(submitted, tabs)
      } else if (chunk === tab) {
        awaitKeystroke(
          buffer,
          draw(label, buffer, drawnRows, hintAfter(tabs + 1)),
          tabs + 1,
        )
      } else {
        const nextBuffer =
          chunk === backspace
            ? buffer.slice(0, -1)
            : chunk.startsWith(escapeKey) || chunk === controlD
              ? buffer
              : buffer + chunk
        awaitKeystroke(
          nextBuffer,
          draw(label, nextBuffer, drawnRows, hintAfter(tabs)),
          tabs,
        )
      }
    }

    const awaitKeystroke = (
      buffer: string,
      drawnRows: number,
      tabs: number,
    ): void => {
      const onData = (chunk: string): void => {
        process.stdout.off("resize", onResize)
        onKeystroke(buffer, drawnRows, tabs, chunk)
      }
      const onResize = (): void => {
        process.stdin.off("data", onData)
        awaitKeystroke(buffer, draw(label, buffer, 1, hintAfter(tabs)), tabs)
      }
      process.stdin.once("data", onData)
      process.stdout.once("resize", onResize)
    }

    process.stdin.setRawMode(true)
    process.stdin.setEncoding("utf8")
    process.stdin.resume()
    awaitKeystroke("", draw(label, "", 1, hintAfter(0)), 0)
  })

const promptedLine = async (label: string): Promise<Read> => {
  const line = await prompt(label)
  return line === tab ? { line: "", toggled: true } : { line, toggled: false }
}

const readLine = (label: string, hints: Hints = noHints): Promise<Read> =>
  process.stdin.isTTY ? editLine(label, hints) : promptedLine(label)

export default readLine
