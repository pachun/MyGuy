import nock from "nock"
import { vi } from "vitest"
import maxTokens from "../../src/maxTokens.ts"
import type { ApiRequest, ApiResponse, Message } from "../../src/types.ts"

const mockQuery = ({
  prompt,
  apiResponse,
  previousMessages = [],
}: {
  prompt: string
  apiResponse: ApiResponse
  previousMessages?: Message[]
}) => {
  const anthropicApiKey = "anthropic-api-key"
  vi.stubEnv("ANTHROPIC_API_KEY", anthropicApiKey)

  const requestMessages: Message[] = [
    ...previousMessages,
    {
      role: "user",
      content: [{ type: "text", text: prompt }],
    },
  ]

  const { role, content } = apiResponse
  const responseMessage = { role, content }

  const messages: Message[] = [...requestMessages, responseMessage]

  const expectedApiRequest: ApiRequest = {
    model: "claude-opus-5-5",
    max_tokens: maxTokens,
    messages: requestMessages,
    thinking: { type: "adaptive", display: "summarized" },
    cache_control: { type: "ephemeral" },
  }

  nock("https://api.anthropic.com")
    .matchHeader("content-type", "application/json")
    .matchHeader("anthropic-version", "2023-06-01")
    .matchHeader("x-api-key", anthropicApiKey)
    .post("/v1/messages", expectedApiRequest)
    .reply(200, apiResponse)

  return messages
}

export default mockQuery
