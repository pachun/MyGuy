import type {
  ToolUseContent,
  ToolUseRequest,
} from "#src/types/ToolUseContent.ts"
import toolUseId from "#tests/factories/toolUseId.ts"

const toolUseContent = (use: ToolUseRequest): ToolUseContent => ({
  ...use,
  id: toolUseId(`toolu_${crypto.randomUUID()}`),
  type: "tool_use",
})

export default toolUseContent
