import nock from "nock"
import { describe, expect, test, vi } from "vitest"
import maxTokens from "../src/maxTokens.ts"
import prompt from "../src/prompt.ts"
import type { ApiRequest, ApiResponse } from "../src/types.ts"

describe("prompt('hello')", () => {
  test("returns the model's response", async () => {
    const promptInput = "hello"
    const anthropicApiKey = "anthropic-api-key"

    vi.stubEnv("ANTHROPIC_API_KEY", anthropicApiKey)

    const expectedApiRequest: ApiRequest = {
      model: "claude-opus-5-5",
      max_tokens: maxTokens,
      messages: [
        { role: "user", content: [{ type: "text", text: promptInput }] },
      ],
    }

    const apiResponse: ApiResponse = {
      content: [{ type: "text", text: "Hello! How can I help you today?" }],
    }

    nock("https://api.anthropic.com")
      .matchHeader("content-type", "application/json")
      .matchHeader("anthropic-version", "2023-06-01")
      .matchHeader("x-api-key", anthropicApiKey)
      .post("/v1/messages", expectedApiRequest)
      .reply(200, apiResponse)

    const response = await prompt(promptInput)

    expect(response).toEqual(["Hello! How can I help you today?"])
  })
})
