import { z } from "zod"
import type { ApiErrorBody } from "#src/types/ApiError.ts"

const apiErrorBody = z.object({
  type: z.literal("error"),
  error: z.object({ type: z.string(), message: z.string() }),
}) satisfies z.ZodType<ApiErrorBody>

export default apiErrorBody
