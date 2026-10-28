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

export type Usage = {
  input_tokens: number
  output_tokens: number
  cache_read_input_tokens: number
  cache_creation_input_tokens: number
}

export type ApiResponse = {
  stop_reason: "end_turn"
  usage: Usage
} & AssistantMessage

type AnthropicApikey = {
  "x-api-key": string
}

type AnthropicApiVersion = {
  "anthropic-version": "2023-06-01" | "2026-10-21"
}

export type ApiRequestHeaders = AnthropicApikey &
  AnthropicApiVersion & { "content-type": "application/json" }
