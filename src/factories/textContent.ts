import type { TextContent } from "#src/types/TextContent.ts"

const textContent = (text: string): TextContent => ({
  type: "text",
  text,
})

export default textContent
