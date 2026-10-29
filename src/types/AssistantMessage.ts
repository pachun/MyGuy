import type { Content } from "./Content.ts"

export type AssistantMessage = {
  role: "assistant"
  content: Content[]
}
