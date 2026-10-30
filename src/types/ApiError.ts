import { z } from "zod"

const apiErrorBody = z.object({
  type: z.literal("error"),
  error: z.object({ type: z.string(), message: z.string() }),
})

export type ApiErrorBody = z.infer<typeof apiErrorBody>

export type ApiError = {
  status: number
  body: ApiErrorBody
}

export default apiErrorBody
