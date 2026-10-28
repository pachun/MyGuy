import wrapAnsi from "wrap-ansi"

const enterOrNewline = /\r|\n/
const backspace = "\x7f"
const controlC = "\x03"
const controlD = "\x04"
const escapeKey = "\x1b"

const labelWidth = "> ".length
const continuationIndent = " ".repeat(labelWidth)
const startOfLine = "\r"
const clearBelow = "\x1b[J"
const cursorUp = (rows: number): string => (rows > 0 ? `\x1b[${rows}A` : "")
const cursorToColumn = (column: number): string => `\x1b[${column}G`

const typedRows = (buffer: string): string[] => {
  const columns = process.stdout.columns ?? 80
  return wrapAnsi(buffer, columns - labelWidth, { trim: false })
    .split("\n")
    .map((row, index) => (index === 0 ? row : row.trimStart()))
}

export const typedLine = (label: string, buffer: string): string =>
  `${label} ${typedRows(buffer).join(`\n${continuationIndent}`)}`

const draw = (label: string, buffer: string, drawnRows: number): number => {
  const rows = typedRows(buffer)
  const endOfLastRow = labelWidth + (rows.at(-1)?.length ?? 0) + 1
  process.stdout.write(
    `${startOfLine}${cursorUp(drawnRows - 1)}${clearBelow}${typedLine(label, buffer)}\n${cursorUp(1)}${cursorToColumn(endOfLastRow)}`,
  )
  return rows.length
}

const editLine = (label: string): Promise<string | null> =>
  new Promise(resolve => {
    const finish = (line: string | null): void => {
      process.stdout.write("\n")
      process.stdin.setRawMode(false)
      process.stdin.pause()
      resolve(line)
    }

    const onKeystroke = (
      buffer: string,
      drawnRows: number,
      chunk: string,
    ): void => {
      const [typed = "", ...afterEnter] = chunk.split(enterOrNewline)
      const submitted = buffer + typed
      if (chunk === controlC || (chunk === controlD && buffer === "")) {
        finish(null)
      } else if (afterEnter.length > 0 && submitted.trim() === "") {
        awaitKeystroke(buffer, drawnRows)
      } else if (afterEnter.length > 0) {
        finish(submitted)
      } else {
        const nextBuffer =
          chunk === backspace
            ? buffer.slice(0, -1)
            : chunk.startsWith(escapeKey) || chunk === controlD
              ? buffer
              : buffer + chunk
        awaitKeystroke(nextBuffer, draw(label, nextBuffer, drawnRows))
      }
    }

    const awaitKeystroke = (buffer: string, drawnRows: number): void => {
      const onData = (chunk: string): void => {
        process.stdout.off("resize", onResize)
        onKeystroke(buffer, drawnRows, chunk)
      }
      const onResize = (): void => {
        process.stdin.off("data", onData)
        awaitKeystroke(buffer, draw(label, buffer, 1))
      }
      process.stdin.once("data", onData)
      process.stdout.once("resize", onResize)
    }

    process.stdin.setRawMode(true)
    process.stdin.setEncoding("utf8")
    process.stdin.resume()
    awaitKeystroke("", draw(label, "", 1))
  })

const readLine = (label: string): Promise<string | null> =>
  process.stdin.isTTY ? editLine(label) : Promise.resolve(prompt(label))

export default readLine
