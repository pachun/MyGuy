import maxTokens from "./maxTokens.ts"
import type { ApiRequest, ApiRequestHeaders, ApiResponse } from "./types.ts"

const prompt = async (text: string) => {
  const headers: ApiRequestHeaders = {
    "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
    "content-type": "application/json",
    "anthropic-version": "2023-06-01",
  }

  const request: ApiRequest = {
    model: "claude-opus-5-5",
    max_tokens: maxTokens,
    messages: [{ role: "user", content: [{ type: "text", text }] }],
  }
  const body = JSON.stringify(request)

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers,
    body,
  })

  const apiResponse = (await response.json()) as ApiResponse
  return apiResponse.content.map(content => content.text)
}

export default prompt
