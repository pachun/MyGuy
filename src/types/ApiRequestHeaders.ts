type AnthropicApikey = {
  "x-api-key": string
}

type AnthropicApiVersion = {
  "anthropic-version": "2023-06-01" | "2026-10-21"
}

export type ApiRequestHeaders = AnthropicApikey &
  AnthropicApiVersion & { "content-type": "application/json" }
