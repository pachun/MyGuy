import { stripVTControlCharacters, styleText } from "node:util"
import { type MarkedExtension, marked } from "marked"
import { markedTerminal } from "marked-terminal"
import wrapAnsi from "wrap-ansi"
import query from "./query.ts"
import readLine from "./readLine.ts"
import type { Content, Message } from "./types.ts"

const indent = "  "
const width = (process.stdout.columns ?? 80) - indent.length

const unstyled = (code: string): string => code
type HighlightOptions = Parameters<typeof markedTerminal>[1]
const highlightOptions = {
  theme: { emphasis: unstyled, strong: unstyled },
} as unknown as HighlightOptions

marked.use(markedTerminal({}, highlightOptions) as MarkedExtension)
marked.use({
  renderer: {
    text(token) {
      return "tokens" in token && token.tokens
        ? this.parser.parseInline(token.tokens)
        : false
    },
  },
})

const render = async (content: Content): Promise<string> =>
  content.type === "thinking"
    ? styleText(
        "dim",
        stripVTControlCharacters(await marked.parse(content.thinking)),
      )
    : marked.parse(content.text)

const leadingBullet = /^\s*(?:(?:[*+-]|\d+\.)\s+)?/

const wrapped = (rendered: string): string =>
  rendered
    .split("\n")
    .flatMap(line => {
      const hanging = " ".repeat(
        stripVTControlCharacters(line).match(leadingBullet)?.at(0)?.length ?? 0,
      )
      return wrapAnsi(line, width - hanging.length, { trim: false })
        .split("\n")
        .map((piece, index) =>
          index === 0 ? piece : `${hanging}${piece.trimStart()}`,
        )
    })
    .join("\n")

const indented = (rendered: string): string =>
  rendered
    .split("\n")
    .map(line => (line === "" ? line : `${indent}${line}`))
    .join("\n")

const promptLabel = styleText(["bold", "cyan"], ">")

const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
const spinnerFrameMilliseconds = 80
const clearLine = "\r\x1b[K"
const cursorUpOneRow = "\x1b[1A"
const hideCursor = "\x1b[?25l"
const showCursor = "\x1b[?25h"

const currentSpinnerFrame = (): string =>
  spinnerFrames[
    Math.floor(Date.now() / spinnerFrameMilliseconds) % spinnerFrames.length
  ] ?? ""

const spinWhile = async <T>(pending: Promise<T>): Promise<T> => {
  if (process.stdout.isTTY) {
    process.stdout.write(`\n${hideCursor}`)
    const ticking = setInterval(() => {
      process.stdout.write(`${clearLine}${indent}${currentSpinnerFrame()}`)
    }, spinnerFrameMilliseconds)
    try {
      return await pending
    } finally {
      clearInterval(ticking)
      process.stdout.write(`${clearLine}${cursorUpOneRow}${showCursor}`)
    }
  } else {
    return pending
  }
}

const respondTo = async (
  line: string,
  messages: Message[],
): Promise<Message[]> => {
  const nextMessages = await spinWhile(query(line, messages))
  const content = nextMessages.at(-1)?.content ?? []
  const rendered = await Promise.all(content.map(render))
  process.stdout.write(`\n${indented(wrapped(rendered.join("")))}`)
  return nextMessages
}

const cli = async (messages: Message[] = []): Promise<void> => {
  const line = await readLine(promptLabel)
  if (line !== null) {
    const nextMessages =
      line.trim() === "" ? messages : await respondTo(line, messages)
    await cli(nextMessages)
  }
}

export default cli
