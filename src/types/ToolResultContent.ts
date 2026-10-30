import type { ToolUseId } from "#src/types/ToolUseId.ts"

export type ToolResultContent = {
  type: "tool_result"
  tool_use_id: ToolUseId
  content: string
}
