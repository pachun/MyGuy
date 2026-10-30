import type { Content } from "#src/types/Content.ts"

export type AssistantMessage = {
  role: "assistant"
  content: Content[]
}
