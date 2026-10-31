import nock from "nock"
import { vi } from "vitest"
import tools from "#src/tools/index.ts"
import type { ApiError } from "#src/types/ApiError.ts"
import type { ApiRequest } from "#src/types/ApiRequest.ts"
import type { Message } from "#src/types/Message.ts"

const mockQueryError = ({
  messages,
  apiError,
}: {
  messages: Message[]
  apiError: ApiError
}) => {
  const anthropicApiKey = "anthropic-api-key"
  vi.stubEnv("ANTHROPIC_API_KEY", anthropicApiKey)

  const expectedApiRequest: ApiRequest = {
    model: "claude-opus-5-5",
    max_tokens: 16000,
    thinking: { type: "adaptive", display: "summarized" },
    cache_control: { type: "ephemeral" },
    tools: tools.map(tool => tool.definition),
    system: "",
    messages,
  }

  nock("https://api.anthropic.com")
    .matchHeader("content-type", "application/json")
    .matchHeader("anthropic-version", "2023-06-01")
    .matchHeader("x-api-key", anthropicApiKey)
    .post("/v1/messages", expectedApiRequest)
    .reply(apiError.status, apiError.body)
}

export default mockQueryError
