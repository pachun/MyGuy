import type {
  AssistantMessage,
  Content,
  TextContent,
  ThinkingContent,
  UserMessage,
} from "../../src/types.ts"

export const assistantMessage = (content: Content[]): AssistantMessage => ({
  role: "assistant",
  content,
})

export const userMessage = (content: Content[]): UserMessage => ({
  role: "user",
  content,
})

export const textContent = (text: string): TextContent => ({
  type: "text",
  text,
})

export const thinkingContent = (thinking: string): ThinkingContent => ({
  type: "thinking",
  thinking,
  signature: "signature",
})
