import type { TextContent } from "#src/types/TextContent.ts"
import type { ThinkingContent } from "#src/types/ThinkingContent.ts"
import type { AnyToolUseContent } from "#src/types/ToolUseContent.ts"

export type AssistantContent = TextContent | ThinkingContent | AnyToolUseContent

export type AssistantMessage = {
  role: "assistant"
  content: AssistantContent[]
}
