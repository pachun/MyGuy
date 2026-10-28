export type TextContent = { type: "text"; text: string }

export type ThinkingContent = {
  type: "thinking"
  thinking: string
  signature: string
}

export type Content = TextContent | ThinkingContent

export type UserMessage = {
  role: "user"
  content: Content[]
}

export type AssistantMessage = {
  role: "assistant"
  content: Content[]
}

export type Message = UserMessage | AssistantMessage

type ShowThinkingSummaries = {
  thinking: { type: "adaptive"; display: "summarized" }
}

type CacheInputTokens = {
  cache_control: { type: "ephemeral" }
}

export type ApiRequest = {
  model: "claude-opus-5-5"
  max_tokens: number
  messages: Message[]
} & ShowThinkingSummaries &
  CacheInputTokens

export type ApiResponse = AssistantMessage & { stop_reason: "end_turn" }

type AnthropicApikey = {
  "x-api-key": string
}

type AnthropicApiVersion = {
  "anthropic-version": "2023-06-01" | "2026-10-21"
}

export type ApiRequestHeaders = AnthropicApikey &
  AnthropicApiVersion & { "content-type": "application/json" }
