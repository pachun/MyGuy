import type { Content } from "#src/types/Content.ts"
import type { UserMessage } from "#src/types/UserMessage.ts"

const userMessage = (content: Content[]): UserMessage => ({
  role: "user",
  content,
})

export default userMessage
