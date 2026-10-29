import type { TextContent } from "./TextContent.ts"
import type { ThinkingContent } from "./ThinkingContent.ts"
import type { ToolResultContent } from "./ToolResultContent.ts"
import type { ToolUseContent } from "./ToolUseContent.ts"

export type Content =
  | TextContent
  | ThinkingContent
  | ToolUseContent
  | ToolResultContent
