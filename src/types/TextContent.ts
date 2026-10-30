import { z } from "zod"

const textContent = z.object({ type: z.literal("text"), text: z.string() })

export type TextContent = z.infer<typeof textContent>

export default textContent
