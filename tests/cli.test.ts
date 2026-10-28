import { beforeEach, describe, expect, onTestFinished, test } from "vitest"
import cli from "../src/cli.ts"
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
      response: "Hello! How can I help you today?",
    })

    await type("hello")

    expect(shown()).toEqual("\nHello! How can I help you today?\n\n")

    mockQuery({
      prompt: "What did I say?",
      response: "You said hello.",
      previousMessages: messages,
    })

    await type("What did I say?")

    expect(shown()).toEqual("\nYou said hello.\n\n")
  })
})
