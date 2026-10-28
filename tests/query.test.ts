import { describe, expect, test } from "vitest"
import query from "../src/query.ts"
import apiResponse from "./helpers/apiResponse.ts"
import {
  assistantMessage,
  textContent,
  userMessage,
} from "./helpers/messages.ts"
import mockQuery from "./helpers/mockQuery.ts"

describe("query('hello')", () => {
  test("returns messages with the model's response", async () => {
    mockQuery({
      prompt: "hello",
      apiResponse: apiResponse({
        ...assistantMessage([textContent("Hello! How can I help you today?")]),
      }),
    })

    const { messages } = await query("hello")

    expect(messages).toEqual([
      userMessage([textContent("hello")]),
      assistantMessage([textContent("Hello! How can I help you today?")]),
    ])
  })

  test("returns usage info", async () => {
    mockQuery({
      prompt: "hello",
      apiResponse: apiResponse({
        ...assistantMessage([textContent("Hello! How can I help you today?")]),
        usage: {
          input_tokens: 30,
          output_tokens: 20,
          cache_read_input_tokens: 5,
          cache_creation_input_tokens: 10,
        },
      }),
    })

    const { usage } = await query("hello")

    expect(usage).toEqual({
      input_tokens: 30,
      output_tokens: 20,
      cache_read_input_tokens: 5,
      cache_creation_input_tokens: 10,
    })
  })
})

describe("query('What did I say?', previousMessages)", () => {
  test("returns messages with the model's next response", async () => {
    const previousMessages = mockQuery({
      prompt: "hello",
      apiResponse: apiResponse({
        ...assistantMessage([textContent("Hello! How can I help you today?")]),
      }),
    })
    mockQuery({
      prompt: "What did I say?",
      apiResponse: apiResponse({
        ...assistantMessage([textContent("You said hello.")]),
      }),
      previousMessages,
    })

    const { messages } = await query(
      "What did I say?",
      (await query("hello")).messages,
    )

    expect(messages).toEqual([
      userMessage([textContent("hello")]),
      assistantMessage([textContent("Hello! How can I help you today?")]),
      userMessage([textContent("What did I say?")]),
      assistantMessage([textContent("You said hello.")]),
    ])
  })
})
