import type { Content } from "./Content.ts"

export type UserMessage = {
  role: "user"
  content: Content[]
}
