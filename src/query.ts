import { toolResultContent, userMessage } from "#src/factories/index.ts"
import tools from "#src/tools/index.ts"
import apiErrorBodySchema from "#src/types/ApiError.ts"
import type { ApiRequest } from "#src/types/ApiRequest.ts"
import type { ApiRequestHeaders } from "#src/types/ApiRequestHeaders.ts"
import apiResponseSchema from "#src/types/ApiResponse.ts"
import type { Content } from "#src/types/Content.ts"
import type { Message } from "#src/types/Message.ts"
import type { StopReason } from "#src/types/StopReason.ts"
import type { ToolUseContent } from "#src/types/ToolUseContent.ts"
import type { Usage } from "#src/types/Usage.ts"

const asJson = (text: string): unknown => {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

const query = async (
  messages: Message[],
): Promise<{ messages: Message[]; usage: Usage; stop_reason: StopReason }> => {
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

  if (!response.ok) {
    const text = await response.text()
    const parsed = apiErrorBodySchema.safeParse(asJson(text))
    throw new Error(
      parsed.success
        ? `${parsed.data.error.type}: ${parsed.data.error.message}`
        : `HTTP ${response.status}: ${text}`,
    )
  }

  const parsed = apiResponseSchema.safeParse(await response.json())
  if (!parsed.success) {
    throw new Error(
      parsed.error.issues
        .map(issue => `${issue.path.join(".")}: ${issue.message}`)
        .join("\n"),
    )
  }
  const { role, content, usage, stop_reason } = parsed.data
  const assistantMessage = { role, content }
  const newMessages = [...messages, assistantMessage]

  if (stop_reason === "tool_use") {
    const toolResults = userMessage(
      await Promise.all(content.filter(isToolUse).map(toolResult)),
    )
    const innerQuery = await query([...newMessages, toolResults])
    return {
      messages: innerQuery.messages,
      usage: addUsage(usage, innerQuery.usage),
      stop_reason: innerQuery.stop_reason,
    }
  } else {
    return { messages: newMessages, usage, stop_reason }
  }
}

const isToolUse = (content: Content) => content.type === "tool_use"

const toolResult = async (content: ToolUseContent) => {
  const tool = tools.find(tool => tool.definition.name === content.name)
  if (tool) {
    try {
      return toolResultContent(content, {
        content: await tool.run(content.input),
      })
    } catch (exception) {
      return toolResultContent(content, {
        content:
          exception instanceof Error ? exception.message : String(exception),
        is_error: true,
      })
    }
  } else {
    return toolResultContent(content, {
      content: `${content.name} is not a tool.`,
      is_error: true,
    })
  }
}

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

export default query
