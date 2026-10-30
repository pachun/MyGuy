import { z } from "zod"

const thinkingContent = z.object({
  type: z.literal("thinking"),
  thinking: z.string(),
  signature: z.string(),
})

export type ThinkingContent = z.infer<typeof thinkingContent>

export default thinkingContent
