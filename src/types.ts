export type TextContent = { type: "text"; text: string }

export type UserMessage = {
  role: "user"
  content: TextContent[]
}

export type AssistantMessage = {
  role: "assistant"
  content: TextContent[]
}

export type Message = UserMessage | AssistantMessage

export type ApiRequest = {
  model: "claude-opus-5-5"
  max_tokens: number
  messages: Message[]
}

export type ApiResponse = AssistantMessage & { stop_reason: "end_turn" }

type AnthropicApikey = {
  "x-api-key": string
}

type AnthropicApiVersion = {
  "anthropic-version": "2023-06-01" | "2026-10-21"
}

export type ApiRequestHeaders = AnthropicApikey &
  AnthropicApiVersion & { "content-type": "application/json" }
