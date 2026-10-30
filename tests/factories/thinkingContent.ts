import type { ThinkingContent } from "#src/types/ThinkingContent.ts"

const thinkingContent = (thinking: string): ThinkingContent => ({
  type: "thinking",
  thinking,
  signature: "signature",
})

export default thinkingContent
