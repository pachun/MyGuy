import type { AssistantMessage } from "#src/types/AssistantMessage.ts"
import type { Content } from "#src/types/Content.ts"

const assistantMessage = (content: Content[]): AssistantMessage => ({
  role: "assistant",
  content,
})

export default assistantMessage
