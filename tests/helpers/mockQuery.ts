import nock from "nock"
import { vi } from "vitest"
import tools from "#src/tools/index.ts"
import type { ApiRequest } from "#src/types/ApiRequest.ts"
import type { ApiResponse } from "#src/types/ApiResponse.ts"
import type { Message } from "#src/types/Message.ts"

const mockQuery = ({
  messages,
  apiResponse,
}: {
  messages: Message[]
  apiResponse: ApiResponse
}) => {
  const anthropicApiKey = "anthropic-api-key"
  vi.stubEnv("ANTHROPIC_API_KEY", anthropicApiKey)

  const { role, content } = apiResponse
  const responseMessage = { role, content }

  const responseMessages: Message[] = [...messages, responseMessage]

  const expectedApiRequest: ApiRequest = {
    model: "claude-opus-5-5",
    thinking: { type: "adaptive", display: "summarized" },
    cache_control: { type: "ephemeral" },
    max_tokens: 16000,
    tools: tools.map(tool => tool.definition),
    system: "",
    messages,
  }

  nock("https://api.anthropic.com")
    .matchHeader("content-type", "application/json")
    .matchHeader("anthropic-version", "2023-06-01")
    .matchHeader("x-api-key", anthropicApiKey)
    .post("/v1/messages", expectedApiRequest)
    .reply(200, apiResponse)

  return responseMessages
}

export default mockQuery
