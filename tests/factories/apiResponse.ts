import type { ApiResponse } from "#src/types/ApiResponse.ts"

const apiResponse = (apiResponse: Partial<ApiResponse>): ApiResponse => {
  const { content, usage, stop_reason } = apiResponse
  return {
    role: "assistant",
    content: content ?? [],
    stop_reason: stop_reason ?? "end_turn",
    usage: usage ?? {
      input_tokens: 0,
      output_tokens: 0,
      cache_read_input_tokens: 0,
      cache_creation_input_tokens: 0,
    },
  }
}

export default apiResponse
