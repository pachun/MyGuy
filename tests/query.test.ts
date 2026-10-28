import { describe, expect, test } from "vitest"
import query from "../src/query.ts"
import mockQuery from "./helpers/mockQuery.ts"

describe("query('hello')", () => {
  test("returns messages with the model's first text response", async () => {
    mockQuery({ prompt: "hello", response: "Hello! How can I help you today?" })

    const messages = await query("hello")

    expect(messages).toEqual([
      { role: "user", content: [{ type: "text", text: "hello" }] },
      {
        role: "assistant",
        content: [{ type: "text", text: "Hello! How can I help you today?" }],
      },
    ])
  })
})

describe("query('What did I say?', previousMessages)", () => {
  test("returns messages with the model's next text response", async () => {
    const previousMessages = mockQuery({
      prompt: "hello",
      response: "Hello! How can I help you today?",
    })
    mockQuery({
      prompt: "What did I say?",
      response: "You said hello.",
      previousMessages,
    })

    const messages = await query("What did I say?", await query("hello"))

    expect(messages).toEqual([
      { role: "user", content: [{ type: "text", text: "hello" }] },
      {
        role: "assistant",
        content: [{ type: "text", text: "Hello! How can I help you today?" }],
      },
      { role: "user", content: [{ type: "text", text: "What did I say?" }] },
      {
        role: "assistant",
        content: [{ type: "text", text: "You said hello." }],
      },
    ])
  })
})
