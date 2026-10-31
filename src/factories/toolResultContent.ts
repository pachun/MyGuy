import type { ToolResultContent } from "#src/types/ToolResultContent.ts"
import type { AnyToolUseContent } from "#src/types/ToolUseContent.ts"

const toolResultContent = (
  toolUse: AnyToolUseContent,
  { content, is_error }: { content: string; is_error?: boolean },
): ToolResultContent => ({
  type: "tool_result",
  tool_use_id: toolUse.id,
  content,
  ...(is_error ? { is_error: true } : {}),
})

export default toolResultContent
