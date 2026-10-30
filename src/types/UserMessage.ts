import type { Content } from "#src/types/Content.ts"

export type UserMessage = {
  role: "user"
  content: Content[]
}
