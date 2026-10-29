import { stripVTControlCharacters, styleText } from "node:util"
import { type MarkedExtension, marked } from "marked"
import { markedTerminal } from "marked-terminal"
import wrapAnsi from "wrap-ansi"
import query from "./query.ts"
import readLine, { typedLine } from "./readLine.ts"
import type { Content } from "./types/Content.ts"
import type { Message } from "./types/Message.ts"
import type { Usage } from "./types/Usage.ts"

const indent = "  "
const rightMargin = "  "
const width = (): number =>
  (process.stdout.columns ?? 80) - indent.length - rightMargin.length

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

const render = (content: Content): string =>
  content.type === "thinking"
    ? styleText(
        "dim",
        stripVTControlCharacters(
          marked.parse(content.thinking, { async: false }),
        ),
      )
    : content.type === "text"
      ? marked.parse(content.text, { async: false })
      : content.type === "tool_use"
        ? `${styleText("dim", `${content.name} ${JSON.stringify(content.input)}`)}\n\n`
        : ""

const leadingBullet = /^\s*(?:(?:[*+-]|\d+\.)\s+)?/

const wrapped = (rendered: string): string =>
  rendered
    .split("\n")
    .flatMap(line => {
      const hanging = " ".repeat(
        stripVTControlCharacters(line).match(leadingBullet)?.at(0)?.length ?? 0,
      )
      return wrapAnsi(line, width() - hanging.length, { trim: false })
        .split("\n")
        .map((piece, index) =>
          index === 0 ? piece.trimEnd() : `${hanging}${piece.trim()}`,
        )
    })
    .join("\n")

const indented = (rendered: string): string =>
  rendered
    .split("\n")
    .map(line => (line === "" ? line : `${indent}${line}`))
    .join("\n")

const promptLabel = styleText(["bold", "cyan"], ">")

const cached = ({
  cache_read_input_tokens: read,
  cache_creation_input_tokens: written,
}: Usage): string =>
  read > 0 && written > 0
    ? `  ${read} cached +${written}`
    : read > 0
      ? `  ${read} cached`
      : written > 0
        ? `  +${written} cached`
        : ""

const totalInput = (usage: Usage): number =>
  usage.input_tokens +
  usage.cache_read_input_tokens +
  usage.cache_creation_input_tokens

const tokensUsed = (usage: Usage): string =>
  `${indent}${styleText(
    "dim",
    `↑ ${totalInput(usage)}  ↓ ${usage.output_tokens}${cached(usage)}`,
  )}\n\n`

type Turn = { prompt: string; content: Content[]; usage: Usage }

const shownResponse = ({ content, usage }: Turn): string =>
  `\n${indented(wrapped(content.map(render).join("")))}${tokensUsed(usage)}`

const shownTurn = (turn: Turn): string =>
  `${typedLine(promptLabel, turn.prompt)}\n${shownResponse(turn)}`

const clearScreenAndScrollback = "\x1b[2J\x1b[3J\x1b[H"

const redrawTranscript = (transcript: Turn[]) => (): void => {
  process.stdout.write(
    `${clearScreenAndScrollback}\n${transcript.map(shownTurn).join("")}`,
  )
}

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
  prompt: string,
  messages: Message[],
): Promise<{ messages: Message[]; turn: Turn }> => {
  const { messages: nextMessages, usage } = await spinWhile(
    query([
      ...messages,
      { role: "user", content: [{ type: "text", text: prompt }] },
    ]),
  )
  const content = nextMessages
    .slice(messages.length + 1)
    .flatMap(message => message.content)
  const turn = { prompt, content, usage }
  process.stdout.write(shownResponse(turn))
  return { messages: nextMessages, turn }
}

const cli = async (
  messages: Message[] = [],
  transcript: Turn[] = [],
): Promise<void> => {
  const redraw = redrawTranscript(transcript)
  process.stdout.on("resize", redraw)
  const line = await readLine(promptLabel)
  process.stdout.off("resize", redraw)
  if (line === null) {
    return
  } else if (line.trim() === "") {
    await cli(messages, transcript)
  } else {
    const { messages: nextMessages, turn } = await respondTo(line, messages)
    await cli(nextMessages, [...transcript, turn])
  }
}

export default cli
