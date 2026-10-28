import { describe, expect, test } from "vitest"
import query from "../src/query.ts"
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
      response: [textContent("Hello! How can I help you today?")],
    })

    const messages = await query("hello")

    expect(messages).toEqual([
      userMessage([textContent("hello")]),
      assistantMessage([textContent("Hello! How can I help you today?")]),
    ])
  })
})

describe("query('What did I say?', previousMessages)", () => {
  test("returns messages with the model's next response", async () => {
    const previousMessages = mockQuery({
      prompt: "hello",
      response: [textContent("Hello! How can I help you today?")],
    })
    mockQuery({
      prompt: "What did I say?",
      response: [textContent("You said hello.")],
      previousMessages,
    })

    const messages = await query("What did I say?", await query("hello"))

    expect(messages).toEqual([
      userMessage([textContent("hello")]),
      assistantMessage([textContent("Hello! How can I help you today?")]),
      userMessage([textContent("What did I say?")]),
      assistantMessage([textContent("You said hello.")]),
    ])
  })
})
