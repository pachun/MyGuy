import type { AssistantMessage } from "#src/types/AssistantMessage.ts"
import type { Content } from "#src/types/Content.ts"
import type { TextContent } from "#src/types/TextContent.ts"
import type { ThinkingContent } from "#src/types/ThinkingContent.ts"
import type { ToolResultContent } from "#src/types/ToolResultContent.ts"
import type {
  ToolUseContent,
  ToolUseRequest,
} from "#src/types/ToolUseContent.ts"
import type { ToolUseId } from "#src/types/ToolUseId.ts"
import type { UserMessage } from "#src/types/UserMessage.ts"

export const assistantMessage = (content: Content[]): AssistantMessage => ({
  role: "assistant",
  content,
})

export const userMessage = (content: Content[]): UserMessage => ({
  role: "user",
  content,
})

export const textContent = (text: string): TextContent => ({
  type: "text",
  text,
})

export const thinkingContent = (thinking: string): ThinkingContent => ({
  type: "thinking",
  thinking,
  signature: "signature",
})

export const toolUseId = (id: string): ToolUseId => id as ToolUseId

export const toolUseContent = (use: ToolUseRequest): ToolUseContent => ({
  ...use,
  id: toolUseId(`toolu_${crypto.randomUUID()}`),
  type: "tool_use",
})

export const toolResultContent = (
  toolUse: ToolUseContent,
  { content, is_error }: { content: string; is_error?: boolean },
): ToolResultContent => ({
  type: "tool_result",
  tool_use_id: toolUse.id,
  content,
  ...(is_error ? { is_error: true } : {}),
})
