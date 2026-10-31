import type { Message } from "#src/types/Message.ts"
import type { Tool } from "#src/types/Tool.ts"

type ShowThinkingSummaries = {
  thinking: { type: "adaptive"; display: "summarized" }
}

type CacheInputTokens = {
  cache_control: { type: "ephemeral" }
}

type maxTokensThatDoNotTimeoutNonStreamingHttpRequests = 16000
type maxTokens = maxTokensThatDoNotTimeoutNonStreamingHttpRequests

export type ApiRequest = {
  model: "claude-opus-5-5"
  max_tokens: maxTokens
  tools: Tool[]
  system: string
  messages: Message[]
} & ShowThinkingSummaries &
  CacheInputTokens
