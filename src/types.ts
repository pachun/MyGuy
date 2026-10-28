export type TextContent = { type: "text"; text: string }

export type Message = {
  role: "user"
  content: TextContent[]
}

export type ApiRequest = {
  model: "claude-opus-5-5"
  max_tokens: number
  messages: Message[]
}

export type ApiResponse = {
  content: TextContent[]
}

type AnthropicApikey = {
  "x-api-key": string
}

type AnthropicApiVersion = {
  "anthropic-version": "2023-06-01" | "2026-10-21"
}

export type ApiRequestHeaders = AnthropicApikey &
  AnthropicApiVersion & { "content-type": "application/json" }
