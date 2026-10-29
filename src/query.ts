import tools from "./tools/index.ts"
import type { ApiRequest } from "./types/ApiRequest.ts"
import type { ApiRequestHeaders } from "./types/ApiRequestHeaders.ts"
import type { ApiResponse } from "./types/ApiResponse.ts"
import type { Message } from "./types/Message.ts"
import type { Usage } from "./types/Usage.ts"

const addUsage = (u1: Usage, u2: Usage): Usage => {
  return {
    input_tokens: u1.input_tokens + u2.input_tokens,
    output_tokens: u1.output_tokens + u2.output_tokens,
    cache_read_input_tokens:
      u1.cache_read_input_tokens + u2.cache_read_input_tokens,
    cache_creation_input_tokens:
      u1.cache_creation_input_tokens + u2.cache_creation_input_tokens,
  }
}

const query = async (
  messages: Message[],
): Promise<{ messages: Message[]; usage: Usage }> => {
  const apiRequestHeaders: ApiRequestHeaders = {
    "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  }

  const apiRequestBody: ApiRequest = {
    model: "claude-opus-5-5",
    max_tokens: 16000,
    tools: tools.map(tool => tool.definition),
    messages,
    thinking: { type: "adaptive", display: "summarized" },
    cache_control: { type: "ephemeral" },
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: apiRequestHeaders,
    body: JSON.stringify(apiRequestBody),
  })

  const apiResponse = (await response.json()) as ApiResponse
  const { role, content, usage, stop_reason } = apiResponse
  const assistantMessage = { role, content }
  const newMessages = [...messages, assistantMessage]

  if (stop_reason === "tool_use") {
    const toolResults = {
      role: "user" as const,
      content: await Promise.all(
        content
          .filter(content => content.type === "tool_use")
          .map(async content => {
            const tool = tools.find(
              tool => tool.definition.name === content.name,
            )
            if (tool) {
              try {
                return {
                  type: "tool_result" as const,
                  tool_use_id: content.id,
                  content: await tool.run(content.input),
                }
              } catch (exception) {
                return {
                  type: "tool_result" as const,
                  tool_use_id: content.id,
                  content:
                    exception instanceof Error
                      ? exception.message
                      : String(exception),
                  is_error: true,
                }
              }
            } else {
              return {
                type: "tool_result" as const,
                tool_use_id: content.id,
                content: `${content.name} is not a tool.`,
                is_error: true,
              }
            }
          }),
      ),
    }
    const innerQuery = await query([...newMessages, toolResults])
    return {
      messages: innerQuery.messages,
      usage: addUsage(usage, innerQuery.usage),
    }
  } else {
    return { messages: newMessages, usage }
  }
}

export default query
