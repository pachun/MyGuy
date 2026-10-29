import { beforeEach, describe, expect, onTestFinished, test } from "vitest"
import cli from "../src/cli.ts"
import apiResponse from "./helpers/apiResponse.ts"
import {
  assistantMessage,
  textContent,
  thinkingContent,
} from "./helpers/messages.ts"
import mockQuery from "./helpers/mockQuery.ts"
import { exit, resizeTo, shown, type } from "./helpers/terminal.ts"

describe("The command line interface", () => {
  beforeEach(() => {
    const session = cli()
    onTestFinished(async () => {
      exit()
      await session
    })
  })

  test("shows the model's responses", async () => {
    const previousMessages = mockQuery({
      prompt: "hello",
      apiResponse: apiResponse({
        ...assistantMessage([textContent("Hello! How can I help you today?")]),
        usage: {
          input_tokens: 10,
          output_tokens: 13,
          cache_read_input_tokens: 0,
          cache_creation_input_tokens: 0,
        },
      }),
    })

    await type("hello")

    expect(shown()).toEqual(
      "\n  Hello! How can I help you today?\n\n  ↑ 10  ↓ 13\n\n",
    )

    mockQuery({
      prompt: "What did I say?",
      apiResponse: apiResponse({
        ...assistantMessage([textContent("You said hello.")]),
        usage: {
          input_tokens: 30,
          output_tokens: 20,
          cache_read_input_tokens: 0,
          cache_creation_input_tokens: 0,
        },
      }),
      previousMessages,
    })

    await type("What did I say?")

    expect(shown()).toEqual("\n  You said hello.\n\n  ↑ 30  ↓ 20\n\n")
  })

  test("shows the model's thinking summary before its response", async () => {
    mockQuery({
      prompt: "hello",
      apiResponse: apiResponse({
        ...assistantMessage([
          thinkingContent("The user is greeting me.\n\n"),
          textContent("Hello! How can I help you today?"),
        ]),
      }),
    })

    await type("hello")

    expect(shown()).toEqual(
      "\n  The user is greeting me.\n\n  Hello! How can I help you today?\n\n  ↑ 0  ↓ 0\n\n",
    )
  })

  test("shows the tokens used below the model's response", async () => {
    mockQuery({
      prompt: "hello",
      apiResponse: apiResponse({
        ...assistantMessage([textContent("Hello! How can I help you today?")]),
        usage: {
          input_tokens: 10,
          output_tokens: 13,
          cache_read_input_tokens: 0,
          cache_creation_input_tokens: 0,
        },
      }),
    })

    await type("hello")

    expect(shown()).toEqual(
      "\n  Hello! How can I help you today?\n\n  ↑ 10  ↓ 13\n\n",
    )
  })

  test("shows tokens written to and read from the cache", async () => {
    const afterWrite = mockQuery({
      prompt: "Tell me a long story.",
      apiResponse: apiResponse({
        ...assistantMessage([textContent("Once upon a time...")]),
        usage: {
          input_tokens: 4,
          output_tokens: 150,
          cache_read_input_tokens: 0,
          cache_creation_input_tokens: 1421,
        },
      }),
    })

    await type("Tell me a long story.")

    expect(shown()).toEqual(
      "\n  Once upon a time...\n\n  ↑ 1425  ↓ 150  +1421 cached\n\n",
    )

    const afterRead = mockQuery({
      prompt: "Shorter.",
      apiResponse: apiResponse({
        ...assistantMessage([textContent("The end.")]),
        usage: {
          input_tokens: 3,
          output_tokens: 80,
          cache_read_input_tokens: 1425,
          cache_creation_input_tokens: 0,
        },
      }),
      previousMessages: afterWrite,
    })

    await type("Shorter.")

    expect(shown()).toEqual("\n  The end.\n\n  ↑ 1428  ↓ 80  1425 cached\n\n")

    mockQuery({
      prompt: "Again.",
      apiResponse: apiResponse({
        ...assistantMessage([textContent("The end, again.")]),
        usage: {
          input_tokens: 2,
          output_tokens: 60,
          cache_read_input_tokens: 1508,
          cache_creation_input_tokens: 154,
        },
      }),
      previousMessages: afterRead,
    })

    await type("Again.")

    expect(shown()).toEqual(
      "\n  The end, again.\n\n  ↑ 1664  ↓ 60  1508 cached +154\n\n",
    )
  })

  test("rewraps the conversation when the terminal is resized", async () => {
    mockQuery({
      prompt: "hello",
      apiResponse: apiResponse({
        ...assistantMessage([textContent("Hello! How can I help you today?")]),
        usage: {
          input_tokens: 10,
          output_tokens: 13,
          cache_read_input_tokens: 0,
          cache_creation_input_tokens: 0,
        },
      }),
    })
    await type("hello")

    resizeTo(28)

    expect(shown()).toEqual(
      "\n> hello\n\n  Hello! How can I help\n  you today?\n\n  ↑ 10  ↓ 13\n\n",
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
