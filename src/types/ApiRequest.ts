import type { Message } from "./Message.ts"
import type { Tool } from "./Tool.ts"

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
  tools: Tool[]
  max_tokens: maxTokens
  messages: Message[]
} & ShowThinkingSummaries &
  CacheInputTokens
