import maxTokens from "./maxTokens.ts"
import type {
  ApiRequest,
  ApiRequestHeaders,
  ApiResponse,
  AssistantMessage,
  Message,
} from "./types.ts"

const query = async (
  prompt: string,
  previousMessages: Message[] = [],
): Promise<Message[]> => {
  const apiRequestHeaders: ApiRequestHeaders = {
    "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  }

  const messages: Message[] = [
    ...previousMessages,
    { role: "user", content: [{ type: "text", text: prompt }] },
  ]

  const apiRequestBody: ApiRequest = {
    model: "claude-opus-5-5",
    max_tokens: maxTokens,
    messages,
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: apiRequestHeaders,
    body: JSON.stringify(apiRequestBody),
  })

  const apiResponse = (await response.json()) as ApiResponse
  const { role, content } = apiResponse
  const assistantMessage: AssistantMessage = { role, content }
  return [...messages, assistantMessage]
}

export default query
