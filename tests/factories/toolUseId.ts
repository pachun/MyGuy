import type { ToolUseId } from "#src/types/ToolUseId.ts"

const toolUseId = (id: string): ToolUseId => id as ToolUseId

export default toolUseId
