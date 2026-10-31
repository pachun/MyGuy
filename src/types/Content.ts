import type { TextContent } from "#src/types/TextContent.ts"
import type { ThinkingContent } from "#src/types/ThinkingContent.ts"
import type { ToolResultContent } from "#src/types/ToolResultContent.ts"
import type { AnyToolUseContent } from "#src/types/ToolUseContent.ts"

export type Content =
  | TextContent
  | ThinkingContent
  | AnyToolUseContent
  | ToolResultContent
