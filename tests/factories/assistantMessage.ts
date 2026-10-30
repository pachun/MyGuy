import type {
  AssistantContent,
  AssistantMessage,
} from "#src/types/AssistantMessage.ts"

const assistantMessage = (content: AssistantContent[]): AssistantMessage => ({
  role: "assistant",
  content,
})

export default assistantMessage
