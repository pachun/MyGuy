import { z } from "zod"
import type tools from "#src/tools/index.ts"
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
} & ToolUseRequest

const anyToolUseContent = z.object({
  id: z.custom<ToolUseId>(value => typeof value === "string"),
  type: z.literal("tool_use"),
  name: z.string(),
  input: z.record(z.string(), z.json()),
})

export type AnyToolUseContent = z.infer<typeof anyToolUseContent>

export default anyToolUseContent
