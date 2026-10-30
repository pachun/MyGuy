import { z } from "zod"

const usage = z.object({
  input_tokens: z.number(),
  output_tokens: z.number(),
  cache_read_input_tokens: z.number(),
  cache_creation_input_tokens: z.number(),
})

export type Usage = z.infer<typeof usage>

export default usage
