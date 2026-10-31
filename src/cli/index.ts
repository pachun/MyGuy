import { stripVTControlCharacters, styleText } from "node:util"
import { type MarkedExtension, marked } from "marked"
import { markedTerminal } from "marked-terminal"
import wrapAnsi from "wrap-ansi"
import readLine, { typedLine } from "#src/cli/readLine.ts"
import { textContent, userMessage } from "#src/factories/index.ts"
import query from "#src/query.ts"
import type { Content } from "#src/types/Content.ts"
import type { Message } from "#src/types/Message.ts"
import type { StopReason } from "#src/types/StopReason.ts"
import type { AnyToolUseContent } from "#src/types/ToolUseContent.ts"
import type { Usage } from "#src/types/Usage.ts"

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
        ? `${styleText("dim", toolCall(content))}\n\n`
        : ""

const toolCall = (toolUse: AnyToolUseContent): string =>
  `${toolUse.name} ${JSON.stringify(toolUse.input)}`

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

const thousand = 1000
const million = 1000000

const rounded = (count: number): string =>
  count >= million
    ? `${(count / million).toFixed(1)}M`
    : count >= thousand
      ? `${(count / thousand).toFixed(1)}k`
      : `${count}`

const cached = ({
  cache_read_input_tokens: read,
  cache_creation_input_tokens: written,
}: Usage): string =>
  read > 0 && written > 0
    ? `  ${rounded(read)} cached +${rounded(written)}`
    : read > 0
      ? `  ${rounded(read)} cached`
      : written > 0
        ? `  +${rounded(written)} cached`
        : ""

const totalInput = (usage: Usage): number =>
  usage.input_tokens +
  usage.cache_read_input_tokens +
  usage.cache_creation_input_tokens

const tokensUsed = (usage: Usage): string =>
  `${indent}${styleText(
    "dim",
    `↑ ${rounded(totalInput(usage))}  ↓ ${rounded(usage.output_tokens)}${cached(usage)}`,
  )}\n\n`

type Turn = {
  prompt: string
  content: Content[]
  usage: Usage
  stop_reason: StopReason
}

const stopNote = (stop_reason: StopReason): string =>
  stop_reason === "max_tokens"
    ? `${indent}${styleText("dim", "Cut off at the token limit. Ask to keep going.")}\n\n`
    : stop_reason === "refusal"
      ? `${indent}${styleText("dim", "The model declined to answer on safety grounds.")}\n\n`
      : ""

const shownResponse = ({ content, usage, stop_reason }: Turn): string =>
  `\n${indented(wrapped(content.map(render).join("")))}${stopNote(stop_reason)}${tokensUsed(usage)}`

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
      if (!process.stdin.isRaw) {
        process.stdout.write(`${clearLine}${indent}${currentSpinnerFrame()}`)
      }
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

const shownError = (error: unknown): string =>
  `\n${indent}${styleText("red", error instanceof Error ? error.message : String(error))}\n\n`

type Mode = "auto" | "manual"

const otherMode = (mode: Mode): Mode => (mode === "auto" ? "manual" : "auto")

const modeHint = (mode: Mode): string =>
  `${indent}${styleText("dim", `${mode} mode (tab to switch)`)}`

const askToRun = async (toolUse: AnyToolUseContent): Promise<boolean> => {
  if (toolUse.name === "read_file") {
    return true
  } else {
    const question = `${indent}${styleText("dim", toolCall(toolUse))} run? [y/N]`
    process.stdout.write(showCursor)
    const { line: answer } = await readLine(question)
    if (process.stdout.isTTY) {
      process.stdout.write(`${cursorUpOneRow}${clearLine}${hideCursor}`)
    }
    return answer?.trim().toLowerCase() === "y"
  }
}

const runWithoutAsking = async (): Promise<boolean> => true

const approval = (mode: Mode) => (mode === "auto" ? runWithoutAsking : askToRun)

const respondTo = async (
  prompt: string,
  messages: Message[],
  transcript: Turn[],
  mode: Mode,
): Promise<{ messages: Message[]; transcript: Turn[] }> => {
  try {
    const {
      messages: nextMessages,
      usage,
      stop_reason,
    } = await spinWhile(
      query([...messages, userMessage([textContent(prompt)])], approval(mode)),
    )
    const content = nextMessages
      .slice(messages.length + 1)
      .flatMap(message => message.content)
    const turn = { prompt, content, usage, stop_reason }
    process.stdout.write(shownResponse(turn))
    return { messages: nextMessages, transcript: [...transcript, turn] }
  } catch (error) {
    process.stdout.write(shownError(error))
    return { messages, transcript }
  }
}

const cli = async (
  messages: Message[] = [],
  transcript: Turn[] = [],
  mode: Mode = "auto",
): Promise<void> => {
  const redraw = redrawTranscript(transcript)
  process.stdout.on("resize", redraw)
  const { line, toggled } = await readLine(promptLabel, [
    modeHint(mode),
    modeHint(otherMode(mode)),
  ])
  process.stdout.off("resize", redraw)
  const nextMode = toggled ? otherMode(mode) : mode
  if (line === null) {
    return
  } else if (line.trim() === "") {
    await cli(messages, transcript, nextMode)
  } else {
    const next = await respondTo(line, messages, transcript, nextMode)
    await cli(next.messages, next.transcript, nextMode)
  }
}

export default cli
