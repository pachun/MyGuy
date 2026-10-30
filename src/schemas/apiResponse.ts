import { z } from "zod"
import type { ApiResponse } from "#src/types/ApiResponse.ts"
import type { ToolUseId } from "#src/types/ToolUseId.ts"

const toolUseId = z.custom<ToolUseId>(value => typeof value === "string")

const apiResponse = z.object({
  role: z.literal("assistant"),
  content: z.array(
    z.discriminatedUnion("type", [
      z.object({ type: z.literal("text"), text: z.string() }),
      z.object({
        type: z.literal("thinking"),
        thinking: z.string(),
        signature: z.string(),
      }),
      z.object({
        type: z.literal("tool_use"),
        id: toolUseId,
        name: z.string(),
        input: z.record(z.string(), z.json()),
      }),
    ]),
  ),
  stop_reason: z.enum(["end_turn", "tool_use"]),
  usage: z.object({
    input_tokens: z.number(),
    output_tokens: z.number(),
    cache_read_input_tokens: z.number(),
    cache_creation_input_tokens: z.number(),
  }),
}) satisfies z.ZodType<ApiResponse>

export default apiResponse
