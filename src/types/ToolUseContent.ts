import type tools from "#src/tools/index.ts"
import type { Json } from "#src/types/Json.ts"
import type { InputOf, Property, Tool } from "#src/types/Tool.ts"
import type { ToolUseId } from "#src/types/ToolUseId.ts"

type ToolUse<Defined> = Defined extends {
  definition: Tool<
    infer Name,
    infer RequiredKeys,
    infer Properties extends Record<string, Property>
  >
}
  ? { name: Name; input: InputOf<RequiredKeys, Properties> }
  : never

export type ToolUseRequest = ToolUse<(typeof tools)[number]>

export type ToolUseContent = {
  id: ToolUseId
  type: "tool_use"
  name: string
  input: { [key: string]: Json }
}
