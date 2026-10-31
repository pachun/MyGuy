import { beforeEach, describe, expect, it, onTestFinished } from "vitest"
import cli from "#src/cli/index.ts"
import {
  apiResponse,
  assistantMessage,
  textContent,
  thinkingContent,
  toolResultContent,
  toolUseContent,
  userMessage,
} from "#tests/factories/index.ts"
import mockQuery from "#tests/helpers/mockQuery.ts"
import mockQueryError from "#tests/helpers/mockQueryError.ts"
import { exit, resizeTo, shown, type } from "#tests/helpers/terminal.ts"

describe("The command line interface", () => {
  beforeEach(() => {
    const session = cli()
    onTestFinished(async () => {
      exit()
      await session
    })
  })

  it("shows the model's responses", async () => {
    const previousMessages = mockQuery({
      messages: [userMessage([textContent("hello")])],
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
      messages: [
        ...previousMessages,
        userMessage([textContent("What did I say?")]),
      ],
      apiResponse: apiResponse({
        ...assistantMessage([textContent("You said hello.")]),
        usage: {
          input_tokens: 30,
          output_tokens: 20,
          cache_read_input_tokens: 0,
          cache_creation_input_tokens: 0,
        },
      }),
    })

    await type("What did I say?")

    expect(shown()).toEqual("\n  You said hello.\n\n  ↑ 30  ↓ 20\n\n")
  })

  it("shows the model's thinking summary before its response", async () => {
    mockQuery({
      messages: [userMessage([textContent("hello")])],
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

  it("shows the tokens used below the model's response", async () => {
    mockQuery({
      messages: [userMessage([textContent("hello")])],
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

  it("shows tokens written to and read from the cache", async () => {
    const afterWrite = mockQuery({
      messages: [userMessage([textContent("Tell me a long story.")])],
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
      messages: [...afterWrite, userMessage([textContent("Shorter.")])],
      apiResponse: apiResponse({
        ...assistantMessage([textContent("The end.")]),
        usage: {
          input_tokens: 3,
          output_tokens: 80,
          cache_read_input_tokens: 1425,
          cache_creation_input_tokens: 0,
        },
      }),
    })

    await type("Shorter.")

    expect(shown()).toEqual("\n  The end.\n\n  ↑ 1428  ↓ 80  1425 cached\n\n")

    mockQuery({
      messages: [...afterRead, userMessage([textContent("Again.")])],
      apiResponse: apiResponse({
        ...assistantMessage([textContent("The end, again.")]),
        usage: {
          input_tokens: 2,
          output_tokens: 60,
          cache_read_input_tokens: 1508,
          cache_creation_input_tokens: 154,
        },
      }),
    })

    await type("Again.")

    expect(shown()).toEqual(
      "\n  The end, again.\n\n  ↑ 1664  ↓ 60  1508 cached +154\n\n",
    )
  })

  it("shows the tools the model calls before its response", async () => {
    const toolUse = toolUseContent({
      name: "shell",
      input: { command: "echo hi" },
    })
    const afterToolUse = mockQuery({
      messages: [userMessage([textContent("Run echo hi for me.")])],
      apiResponse: apiResponse({
        ...assistantMessage([toolUse]),
        stop_reason: "tool_use",
      }),
    })
    mockQuery({
      messages: [
        ...afterToolUse,
        userMessage([
          toolResultContent(toolUse, {
            content: '{"stdout":"hi\\n","stderr":""}',
          }),
        ]),
      ],
      apiResponse: apiResponse({
        ...assistantMessage([textContent("It printed hi.")]),
      }),
    })

    await type("Run echo hi for me.")

    expect(shown()).toEqual(
      '\n  shell {"command":"echo hi"}\n\n  It printed hi.\n\n  ↑ 0  ↓ 0\n\n',
    )
  })

  it("shows why the api refused a request and keeps the conversation", async () => {
    mockQueryError({
      messages: [userMessage([textContent("hello")])],
      apiError: {
        status: 401,
        body: {
          type: "error",
          error: {
            type: "authentication_error",
            message: "x-api-key header is required",
          },
        },
      },
    })

    await type("hello")

    expect(shown()).toEqual(
      "\n  authentication_error: x-api-key header is required\n\n",
    )

    mockQuery({
      messages: [userMessage([textContent("hello again")])],
      apiResponse: apiResponse({
        ...assistantMessage([textContent("Hello! How can I help you today?")]),
      }),
    })

    await type("hello again")

    expect(shown()).toEqual(
      "\n  Hello! How can I help you today?\n\n  ↑ 0  ↓ 0\n\n",
    )
  })

  it("says when the model's reply was cut off", async () => {
    mockQuery({
      messages: [userMessage([textContent("Write five paragraphs.")])],
      apiResponse: apiResponse({
        ...assistantMessage([textContent("Rivers begin as")]),
        stop_reason: "max_tokens",
      }),
    })

    await type("Write five paragraphs.")

    expect(shown()).toEqual(
      "\n  Rivers begin as\n\n  Cut off at the token limit. Ask to keep going.\n\n  ↑ 0  ↓ 0\n\n",
    )
  })

  it("says when the model declined to answer", async () => {
    mockQuery({
      messages: [userMessage([textContent("Tell me how to make a bomb.")])],
      apiResponse: apiResponse({
        ...assistantMessage([]),
        stop_reason: "refusal",
      }),
    })

    await type("Tell me how to make a bomb.")

    expect(shown()).toEqual(
      "\n  The model declined to answer on safety grounds.\n\n  ↑ 0  ↓ 0\n\n",
    )
  })

  it("rewraps the conversation when the terminal is resized", async () => {
    mockQuery({
      messages: [userMessage([textContent("hello")])],
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

  it("does not send an empty line to the model", async () => {
    await type("")

    expect(shown()).toEqual("")
  })

  it("does not send a blank line to the model", async () => {
    await type("   ")

    expect(shown()).toEqual("")
  })
})
