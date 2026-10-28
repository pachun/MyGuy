import { beforeEach, describe, expect, onTestFinished, test } from "vitest"
import cli from "../src/cli.ts"
import { textContent, thinkingContent } from "./helpers/messages.ts"
import mockQuery from "./helpers/mockQuery.ts"
import { exit, shown, type } from "./helpers/terminal.ts"

describe("The command line interface", () => {
  beforeEach(() => {
    const session = cli()
    onTestFinished(async () => {
      exit()
      await session
    })
  })

  test("shows the model's responses", async () => {
    const messages = mockQuery({
      prompt: "hello",
      response: [textContent("Hello! How can I help you today?")],
    })

    await type("hello")

    expect(shown()).toEqual("\n  Hello! How can I help you today?\n\n")

    mockQuery({
      prompt: "What did I say?",
      response: [textContent("You said hello.")],
      previousMessages: messages,
    })

    await type("What did I say?")

    expect(shown()).toEqual("\n  You said hello.\n\n")
  })

  test("shows the model's thinking summary before its response", async () => {
    mockQuery({
      prompt: "hello",
      response: [
        thinkingContent("The user is greeting me.\n\n"),
        textContent("Hello! How can I help you today?"),
      ],
    })

    await type("hello")

    expect(shown()).toEqual(
      "\n  The user is greeting me.\n\n  Hello! How can I help you today?\n\n",
    )
  })

  test("does not send an empty line to the model", async () => {
    await type("")

    expect(shown()).toEqual("")
  })

  test("does not send a blank line to the model", async () => {
    await type("   ")

    expect(shown()).toEqual("")
  })
})
