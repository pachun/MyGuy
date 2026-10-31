import { z } from "zod"
import textContent from "#src/types/TextContent.ts"
import thinkingContent from "#src/types/ThinkingContent.ts"
import toolUseContent from "#src/types/ToolUseContent.ts"
import usage from "#src/types/Usage.ts"

const apiResponse = z.object({
  role: z.literal("assistant"),
  content: z.array(
    z.discriminatedUnion("type", [
      textContent,
      thinkingContent,
      toolUseContent,
    ]),
  ),
  stop_reason: z.enum(["end_turn", "tool_use", "max_tokens"]),
  usage,
})

export type ApiResponse = z.infer<typeof apiResponse>

export default apiResponse
