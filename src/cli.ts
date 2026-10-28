import { stripVTControlCharacters, styleText } from "node:util"
import { type MarkedExtension, marked } from "marked"
import { markedTerminal } from "marked-terminal"
import query from "./query.ts"
import type { Content, Message } from "./types.ts"

const indent = "  "
const width = (process.stdout.columns ?? 80) - indent.length

marked.use(markedTerminal({ reflowText: true, width }) as MarkedExtension)

const render = async (content: Content): Promise<string> =>
  content.type === "thinking"
    ? styleText(
        "dim",
        stripVTControlCharacters(await marked.parse(content.thinking)),
      )
    : marked.parse(content.text)

const indented = (rendered: string): string =>
  rendered
    .split("\n")
    .map(line => (line === "" ? line : `${indent}${line}`))
    .join("\n")

const cli = async (messages: Message[] = []): Promise<void> => {
  const line = await prompt(styleText(["bold", "cyan"], ">"))
  if (line !== null) {
    const nextMessages = await query(line, messages)
    const reply = nextMessages.at(-1)?.content ?? []
    const rendered = await Promise.all(reply.map(render))
    process.stdout.write(`\n${indented(rendered.join(""))}`)
    await cli(nextMessages)
  }
}

export default cli
