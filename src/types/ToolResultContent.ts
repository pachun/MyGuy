import type { ToolUseId } from "./ToolUseId.ts"

export type ToolResultContent = {
  type: "tool_result"
  tool_use_id: ToolUseId
  content: string
}
