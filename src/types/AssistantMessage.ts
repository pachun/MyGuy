import type { TextContent } from "#src/types/TextContent.ts"
import type { ThinkingContent } from "#src/types/ThinkingContent.ts"
import type { ToolUseContent } from "#src/types/ToolUseContent.ts"

export type AssistantContent = TextContent | ThinkingContent | ToolUseContent

export type AssistantMessage = {
  role: "assistant"
  content: AssistantContent[]
}
