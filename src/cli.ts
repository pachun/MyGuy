import { styleText } from "node:util"
import { type MarkedExtension, marked } from "marked"
import { markedTerminal } from "marked-terminal"
import query from "./query.ts"
import type { Message } from "./types.ts"

marked.use(markedTerminal() as MarkedExtension)

const cli = async (messages: Message[] = []): Promise<void> => {
  const line = await prompt(styleText(["bold", "cyan"], ">"))
  if (line !== null) {
    const nextMessages = await query(line, messages)
    const reply = nextMessages.at(-1)?.content.at(-1)?.text ?? ""
    process.stdout.write(`\n${await marked.parse(reply)}`)
    await cli(nextMessages)
  }
}

export default cli
